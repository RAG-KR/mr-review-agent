import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitOperations {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: this.cwd });
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  async getDiff(baseBranch: string, targetBranch?: string): Promise<string> {
    try {
      const branch = targetBranch || await this.getCurrentBranch();
      const { stdout } = await execAsync(
        `git diff ${baseBranch}...${branch}`,
        { cwd: this.cwd, maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
      );
      return stdout;
    } catch (error: any) {
      throw new Error(`Failed to get diff: ${error.message}`);
    }
  }

  async getDiffStats(baseBranch: string, targetBranch?: string): Promise<string> {
    try {
      const branch = targetBranch || await this.getCurrentBranch();
      const { stdout } = await execAsync(
        `git diff --stat ${baseBranch}...${branch}`,
        { cwd: this.cwd }
      );
      return stdout;
    } catch (error: any) {
      throw new Error(`Failed to get diff stats: ${error.message}`);
    }
  }

  async getChangedFiles(baseBranch: string, targetBranch?: string): Promise<string[]> {
    try {
      const branch = targetBranch || await this.getCurrentBranch();
      const { stdout } = await execAsync(
        `git diff --name-only ${baseBranch}...${branch}`,
        { cwd: this.cwd }
      );
      return stdout.trim().split('\n').filter(f => f.length > 0);
    } catch (error: any) {
      throw new Error(`Failed to get changed files: ${error.message}`);
    }
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --is-inside-work-tree', { cwd: this.cwd });
      return true;
    } catch {
      return false;
    }
  }

  async branchExists(branch: string): Promise<boolean> {
    try {
      await execAsync(`git rev-parse --verify ${branch}`, { cwd: this.cwd });
      return true;
    } catch {
      return false;
    }
  }
}
