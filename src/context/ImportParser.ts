import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

/**
 * Parse imports from TypeScript/JavaScript files
 * and find reverse dependencies
 */
export class ImportParser {
  /**
   * Parse import statements from file content
   */
  async parseImports(
    content: string,
    filePath: string,
    repoRoot: string
  ): Promise<string[]> {
    const imports = new Set<string>();
    const fileDir = path.dirname(filePath);

    // Regex patterns for different import styles
    const patterns = [
      // import { X } from './file'
      // import X from './file'
      /import\s+(?:{[^}]*}|\w+)\s+from\s+['"]([^'"]+)['"]/g,
      // import './file'
      /import\s+['"]([^'"]+)['"]/g,
      // require('./file')
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      // export { X } from './file'
      /export\s+(?:{[^}]*}|\*)\s+from\s+['"]([^'"]+)['"]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];

        // Skip node_modules and external packages
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          continue;
        }

        // Resolve relative path
        const resolved = this.resolveImportPath(importPath, fileDir, repoRoot);
        if (resolved) {
          imports.add(resolved);
        }
      }
    }

    return Array.from(imports);
  }

  /**
   * Find files that import the given file (reverse dependencies)
   */
  async findReverseDependencies(
    filePath: string,
    repoRoot: string
  ): Promise<string[]> {
    const callers = new Set<string>();

    try {
      // Get the file name without extension for grepping
      const fileName = path.basename(filePath);
      const fileNameNoExt = fileName.replace(/\.[^.]+$/, '');

      // Build grep patterns for different import styles
      const patterns = [
        `from ['"].*${fileNameNoExt}`,
        `require\\(['"].*${fileNameNoExt}`
      ];

      for (const pattern of patterns) {
        try {
          // Use grep to find files that import this file
          // -l: only file names
          // -r: recursive
          // --include: only TS/JS files
          const { stdout } = await execAsync(
            `grep -rl --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" -E "${pattern}" ${repoRoot} 2>/dev/null || true`
          );

          if (stdout.trim()) {
            const files = stdout
              .trim()
              .split('\n')
              .map(f => path.relative(repoRoot, f))
              .filter(f => f !== filePath); // Don't include the file itself

            files.forEach(f => callers.add(f));
          }
        } catch (error) {
          // Grep failed or no matches, continue
          continue;
        }
      }
    } catch (error) {
      // Failed to find reverse deps, return empty
      return [];
    }

    return Array.from(callers);
  }

  /**
   * Resolve import path to absolute file path
   */
  private resolveImportPath(
    importPath: string,
    fileDir: string,
    repoRoot: string
  ): string | null {
    try {
      // Handle absolute imports from root
      if (importPath.startsWith('/')) {
        importPath = importPath.slice(1);
      }

      // Resolve relative to file directory
      const resolved = path.resolve(repoRoot, fileDir, importPath);
      const relativePath = path.relative(repoRoot, resolved);

      // Try common extensions if no extension provided
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.d.ts'];

      for (const ext of extensions) {
        const testPath = relativePath + ext;
        const fullPath = path.resolve(repoRoot, testPath);

        try {
          // Check if file exists (sync for simplicity)
          require('fs').accessSync(fullPath);
          return testPath;
        } catch {
          continue;
        }
      }

      // Try index files
      for (const indexFile of ['index.ts', 'index.tsx', 'index.js', 'index.jsx']) {
        const testPath = path.join(relativePath, indexFile);
        const fullPath = path.resolve(repoRoot, testPath);

        try {
          require('fs').accessSync(fullPath);
          return testPath;
        } catch {
          continue;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
