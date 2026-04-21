import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { GitDiff, ChangedFile, DiffStats } from '../types.js';

export class DiffAnalyzer {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  async analyze(rawDiff: string, changedFiles: string[]): Promise<GitDiff> {
    const stats = this.parseStats(rawDiff);
    const files = await this.parseChangedFiles(changedFiles, rawDiff);

    return {
      files,
      stats,
      rawDiff,
    };
  }

  private parseStats(diff: string): DiffStats {
    const lines = diff.split('\n');
    let insertions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        insertions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      }
    }

    return {
      filesChanged: 0, // Will be set later
      insertions,
      deletions,
    };
  }

  private async parseChangedFiles(filePaths: string[], diff: string): Promise<ChangedFile[]> {
    const files: ChangedFile[] = [];

    for (const filePath of filePaths) {
      const fileStatus = this.determineFileStatus(filePath, diff);
      const { additions, deletions } = this.getFileChanges(filePath, diff);

      // Read the current file content for context
      let content: string | undefined;
      try {
        const fullPath = resolve(this.cwd, filePath);
        content = await readFile(fullPath, 'utf-8');
      } catch {
        // File might be deleted or binary
        content = undefined;
      }

      files.push({
        path: filePath,
        status: fileStatus,
        additions,
        deletions,
        content,
      });
    }

    return files;
  }

  private determineFileStatus(filePath: string, diff: string): ChangedFile['status'] {
    // Simple heuristic - check if file appears in diff
    if (diff.includes(`new file mode`)) {
      return 'added';
    } else if (diff.includes(`deleted file mode`)) {
      return 'deleted';
    } else if (diff.includes(`rename from`)) {
      return 'renamed';
    }
    return 'modified';
  }

  private getFileChanges(filePath: string, diff: string): { additions: number; deletions: number } {
    const lines = diff.split('\n');
    let additions = 0;
    let deletions = 0;
    let inFile = false;

    for (const line of lines) {
      if (line.includes(`diff --git`) && line.includes(filePath)) {
        inFile = true;
        continue;
      }

      if (inFile && line.startsWith('diff --git')) {
        // Moved to next file
        break;
      }

      if (inFile) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions++;
        }
      }
    }

    return { additions, deletions };
  }
}
