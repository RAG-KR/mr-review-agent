import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import type { DuplicateEvidence, DuplicateInstance } from '../types.js';

const execAsync = promisify(exec);

/**
 * Search for duplicate code patterns using grep
 * Detects DRY violations across the codebase
 */
export class DuplicateSearcher {
  /**
   * Find duplicate patterns in the codebase
   */
  async findDuplicates(
    content: string,
    filePath: string,
    repoRoot: string
  ): Promise<DuplicateEvidence[]> {
    const duplicates: DuplicateEvidence[] = [];

    // Extract patterns from content
    const patterns = this.extractPatterns(content);

    for (const pattern of patterns) {
      const instances = await this.searchPattern(pattern, filePath, repoRoot);

      // Only report if we find duplicates (more than 1 instance)
      if (instances.length > 1) {
        duplicates.push({
          pattern: pattern.name,
          description: pattern.description,
          instances
        });
      }
    }

    return duplicates;
  }

  /**
   * Extract searchable patterns from code
   */
  private extractPatterns(content: string): Array<{ name: string; regex: string; description: string }> {
    const patterns: Array<{ name: string; regex: string; description: string }> = [];

    // Pattern 1: Email validation regex
    const emailRegex = /\/\^?[^\\/]+@[^\\/]+\.[^\\/]+[\$]?\/[gim]*/g;
    if (emailRegex.test(content)) {
      patterns.push({
        name: 'Email Validation',
        regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        description: 'Email validation pattern found'
      });
    }

    // Pattern 2: Phone number validation
    const phoneRegex = /\/[\\(]?\d{3}[\\)]?[\s.-]?\d{3}[\s.-]?\d{4}\//g;
    if (phoneRegex.test(content)) {
      patterns.push({
        name: 'Phone Validation',
        regex: '\\(?[0-9]{3}\\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}',
        description: 'Phone number validation pattern found'
      });
    }

    // Pattern 3: Common validation function names
    const validationFuncs = [
      'validateEmail',
      'checkEmail',
      'verifyEmail',
      'isValidEmail',
      'validatePhone',
      'validatePassword',
      'checkAuth',
      'verifyAuth',
      'validateUser'
    ];

    for (const funcName of validationFuncs) {
      const funcRegex = new RegExp(`function\\s+${funcName}|const\\s+${funcName}\\s*=|${funcName}\\s*\\(`, 'i');
      if (funcRegex.test(content)) {
        patterns.push({
          name: `Function: ${funcName}`,
          regex: `(function\\s+${funcName}|const\\s+${funcName}\\s*=|${funcName}\\s*\\()`,
          description: `Validation function "${funcName}" may be duplicated`
        });
      }
    }

    // Pattern 4: Try-catch blocks with similar error handling
    const tryCatchPattern = /try\s*{[\s\S]*?catch\s*\([^)]+\)\s*{[\s\S]*?console\.(error|log)/g;
    if (tryCatchPattern.test(content)) {
      patterns.push({
        name: 'Error Handling',
        regex: 'try\\s*\\{.*catch\\s*\\(',
        description: 'Try-catch error handling pattern found'
      });
    }

    // Pattern 5: API endpoint definitions
    const apiPattern = /\.(get|post|put|delete|patch)\s*\(\s*['"`]\/[^'"`]+['"`]/gi;
    if (apiPattern.test(content)) {
      const match = content.match(apiPattern);
      if (match) {
        patterns.push({
          name: 'API Endpoint',
          regex: '\\.(get|post|put|delete|patch)\\s*\\(',
          description: 'API endpoint definition found'
        });
      }
    }

    return patterns.slice(0, 3); // Limit to top 3 patterns to avoid noise
  }

  /**
   * Search for a pattern across the codebase
   */
  private async searchPattern(
    pattern: { name: string; regex: string; description: string },
    excludeFile: string,
    repoRoot: string
  ): Promise<DuplicateInstance[]> {
    const instances: DuplicateInstance[] = [];

    try {
      // Use grep to search for pattern
      // -n: show line numbers
      // -H: show filename
      // --include: only TS/JS files
      // -E: extended regex
      const { stdout } = await execAsync(
        `grep -nH --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" -E "${pattern.regex}" ${repoRoot} 2>/dev/null || true`,
        { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
      );

      if (!stdout.trim()) {
        return instances;
      }

      // Parse grep output: filepath:line:content
      const lines = stdout.trim().split('\n');

      for (const line of lines) {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (!match) continue;

        const [, filePath, lineNum, snippet] = match;
        const relativePath = path.relative(repoRoot, filePath);

        // Skip the file we're currently analyzing
        if (relativePath === excludeFile) {
          continue;
        }

        // Skip node_modules, dist, etc.
        if (relativePath.includes('node_modules') || relativePath.includes('dist')) {
          continue;
        }

        instances.push({
          file: relativePath,
          line: parseInt(lineNum, 10),
          snippet: snippet.trim().slice(0, 80) // Limit snippet length
        });

        // Limit instances to avoid overwhelming output
        if (instances.length >= 5) {
          break;
        }
      }
    } catch (error) {
      // Grep failed or no matches
      return instances;
    }

    return instances;
  }
}
