import path from 'path';
import { promises as fs } from 'fs';
import type { GitDiff, ContextBundle, ContextFile, ContextMetadata } from '../types.js';
import { ImportParser } from './ImportParser.js';
import { PatternFinder } from './PatternFinder.js';
import { DuplicateSearcher } from './DuplicateSearcher.js';

/**
 * Multi-phase context gathering engine
 * Builds intelligent context for code reviews
 */
export class ContextBuilder {
  private importParser: ImportParser;
  private patternFinder: PatternFinder;
  private duplicateSearcher: DuplicateSearcher;
  private maxFiles: number;

  constructor(maxFiles: number = 15) {
    this.maxFiles = maxFiles;
    this.importParser = new ImportParser();
    this.patternFinder = new PatternFinder();
    this.duplicateSearcher = new DuplicateSearcher();
  }

  /**
   * Build complete context bundle for code review
   */
  async build(diff: GitDiff, repoRoot: string): Promise<ContextBundle> {
    // Phase 1: Changed files (already have full content from diff)
    const changedFiles = await this.buildChangedFilesContext(diff, repoRoot);

    // Phase 2: Import context (imports + callers)
    const importContext = await this.buildImportContext(changedFiles, repoRoot);

    // Phase 3: Architectural patterns (similar files)
    const patterns = await this.buildPatternContext(changedFiles, repoRoot);

    // Phase 4: Duplicate detection (grep-based)
    const duplicates = await this.searchDuplicates(changedFiles, repoRoot);

    // Apply priority-based file limit
    const { changedFiles: limitedChanged, importContext: limitedImports, patterns: limitedPatterns } =
      this.applyPriorityLimit(changedFiles, importContext, patterns);

    // Build metadata
    const metadata = this.buildMetadata(
      limitedChanged,
      limitedImports,
      limitedPatterns,
      duplicates
    );

    return {
      changedFiles: limitedChanged,
      importContext: limitedImports,
      architecturalPatterns: limitedPatterns,
      duplicateEvidence: duplicates,
      metadata
    };
  }

  /**
   * Phase 1: Build context for changed files
   */
  private async buildChangedFilesContext(
    diff: GitDiff,
    repoRoot: string
  ): Promise<ContextFile[]> {
    const contextFiles: ContextFile[] = [];

    for (const file of diff.files) {
      if (file.status === 'deleted' || !file.content) {
        continue;
      }

      const truncatedContent = this.truncateByPriority(file.content, 'changed');

      contextFiles.push({
        path: file.path,
        content: truncatedContent.content,
        truncated: truncatedContent.wasTruncated,
        priority: 'changed',
        lineCount: truncatedContent.lineCount
      });
    }

    return contextFiles;
  }

  /**
   * Phase 2: Build import context (imports + reverse deps)
   */
  private async buildImportContext(
    changedFiles: ContextFile[],
    repoRoot: string
  ): Promise<ContextFile[]> {
    const importPaths = new Set<string>();

    // Parse imports from changed files
    for (const file of changedFiles) {
      const imports = await this.importParser.parseImports(file.content, file.path, repoRoot);
      imports.forEach(imp => importPaths.add(imp));
    }

    // Find reverse dependencies (files that import changed files)
    for (const file of changedFiles) {
      const callers = await this.importParser.findReverseDependencies(file.path, repoRoot);
      callers.forEach(caller => importPaths.add(caller));
    }

    // Read import files
    const contextFiles: ContextFile[] = [];
    for (const importPath of importPaths) {
      const fullPath = path.resolve(repoRoot, importPath);

      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const truncatedContent = this.truncateByPriority(content, 'import');

        contextFiles.push({
          path: importPath,
          content: truncatedContent.content,
          truncated: truncatedContent.wasTruncated,
          priority: 'import',
          lineCount: truncatedContent.lineCount
        });
      } catch (error) {
        // File doesn't exist or can't be read, skip
        continue;
      }
    }

    return contextFiles;
  }

  /**
   * Phase 3: Find architectural patterns (similar files)
   */
  private async buildPatternContext(
    changedFiles: ContextFile[],
    repoRoot: string
  ): Promise<ContextFile[]> {
    const patternPaths = new Set<string>();

    for (const file of changedFiles) {
      // Find similar files by naming convention and directory structure
      const similar = await this.patternFinder.findSimilarFiles(file.path, repoRoot);
      similar.forEach(s => patternPaths.add(s));
    }

    // Remove files already in changed or import context
    const existingPaths = new Set([
      ...changedFiles.map(f => f.path)
    ]);

    const contextFiles: ContextFile[] = [];
    for (const patternPath of patternPaths) {
      if (existingPaths.has(patternPath)) {
        continue;
      }

      const fullPath = path.resolve(repoRoot, patternPath);

      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const truncatedContent = this.truncateByPriority(content, 'pattern');

        contextFiles.push({
          path: patternPath,
          content: truncatedContent.content,
          truncated: truncatedContent.wasTruncated,
          priority: 'pattern',
          lineCount: truncatedContent.lineCount
        });
      } catch (error) {
        continue;
      }
    }

    return contextFiles;
  }

  /**
   * Phase 4: Search for duplicate code patterns
   */
  private async searchDuplicates(
    changedFiles: ContextFile[],
    repoRoot: string
  ) {
    const allDuplicates = [];

    for (const file of changedFiles) {
      const duplicates = await this.duplicateSearcher.findDuplicates(
        file.content,
        file.path,
        repoRoot
      );
      allDuplicates.push(...duplicates);
    }

    return allDuplicates;
  }

  /**
   * Apply priority-based file limit
   */
  private applyPriorityLimit(
    changedFiles: ContextFile[],
    importContext: ContextFile[],
    patterns: ContextFile[]
  ) {
    let remaining = this.maxFiles;

    // Priority 1: All changed files (must include)
    const limitedChanged = changedFiles;
    remaining -= limitedChanged.length;

    // Priority 2: Import context (high priority, limit to 4)
    const maxImports = Math.min(remaining, 4);
    const limitedImports = importContext.slice(0, maxImports);
    remaining -= limitedImports.length;

    // Priority 3: Patterns (medium priority, limit to 2 for stability)
    const maxPatterns = Math.min(remaining, 2);
    const limitedPatterns = patterns.slice(0, maxPatterns);

    return {
      changedFiles: limitedChanged,
      importContext: limitedImports,
      patterns: limitedPatterns
    };
  }

  /**
   * Truncate content based on priority
   */
  private truncateByPriority(
    content: string,
    priority: 'changed' | 'import' | 'pattern' | 'evidence'
  ): { content: string; wasTruncated: boolean; lineCount: number } {
    const limits = {
      changed: 300,   // Reduced for large MRs (was 500)
      import: 200,    // Reduced (was 300)
      pattern: 150,   // Reduced (was 200) - just need key examples
      evidence: 50    // Low priority (just snippets)
    };

    const maxLines = limits[priority];
    const lines = content.split('\n');

    if (lines.length <= maxLines) {
      return {
        content,
        wasTruncated: false,
        lineCount: lines.length
      };
    }

    const truncated = lines.slice(0, maxLines).join('\n') +
      `\n\n... (truncated ${lines.length - maxLines} lines)`;

    return {
      content: truncated,
      wasTruncated: true,
      lineCount: maxLines
    };
  }

  /**
   * Build context metadata
   */
  private buildMetadata(
    changedFiles: ContextFile[],
    importContext: ContextFile[],
    patterns: ContextFile[],
    duplicates: any[]
  ): ContextMetadata {
    const totalFiles = changedFiles.length + importContext.length + patterns.length;
    const totalLines = [
      ...changedFiles,
      ...importContext,
      ...patterns
    ].reduce((sum, f) => sum + f.lineCount, 0);

    // Rough estimation: ~3 tokens per line
    const estimatedTokens = totalLines * 3;

    return {
      totalFiles,
      totalLines,
      estimatedTokens,
      phases: {
        phase1_changes: changedFiles.length,
        phase2_imports: importContext.length,
        phase3_patterns: patterns.length,
        phase4_duplicates: duplicates.length
      }
    };
  }
}
