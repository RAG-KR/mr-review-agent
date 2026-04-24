import ora from 'ora';
import chalk from 'chalk';
import { ConfigLoader } from '../config/ConfigLoader.js';
import { OllamaClient } from './OllamaClient.js';
import { GitOperations } from '../git/GitOperations.js';
import { DiffAnalyzer } from '../review/DiffAnalyzer.js';
import { SkillsLoader } from '../review/SkillsLoader.js';
import { PromptBuilder } from './PromptBuilder.js';
import { ReportGenerator } from '../review/ReportGenerator.js';
import { ContextBuilder } from '../context/ContextBuilder.js';
import type { ReviewConfig, ReviewMetadata } from '../types.js';

export interface ReviewOptions {
  model?: string;
  baseBranch?: string;
  output?: string;
}

export class ReviewAgent {
  private config: ReviewConfig;
  private ollama: OllamaClient;
  private git: GitOperations;
  private diffAnalyzer: DiffAnalyzer;
  private skillsLoader: SkillsLoader;
  private promptBuilder: PromptBuilder;
  private reportGenerator: ReportGenerator;
  private contextBuilder: ContextBuilder;

  constructor(config: ReviewConfig) {
    this.config = config;
    this.ollama = new OllamaClient(config.model);
    this.git = new GitOperations();
    this.diffAnalyzer = new DiffAnalyzer();
    this.skillsLoader = new SkillsLoader(config.review.skillsPath);
    this.promptBuilder = new PromptBuilder();
    this.reportGenerator = new ReportGenerator();
    this.contextBuilder = new ContextBuilder(15);
  }

  static async create(options?: ReviewOptions): Promise<ReviewAgent> {
    const config = await ConfigLoader.load();

    // Override config with CLI options
    if (options?.model) {
      config.model.name = options.model;
    }
    if (options?.baseBranch) {
      config.review.baseBranch = options.baseBranch;
    }
    if (options?.output) {
      config.review.outputPath = options.output;
    }

    return new ReviewAgent(config);
  }

  async run(): Promise<void> {
    console.log(chalk.bold.blue('\n🔍 MR Review Agent\n'));

    // 1. Validate environment
    await this.validateEnvironment();

    // 2. Get Git information
    const { branch, baseBranch, diff, changedFiles } = await this.getGitInfo();

    // 3. Analyze diff
    const spinner = ora('Analyzing code changes...').start();
    const gitDiff = await this.diffAnalyzer.analyze(diff, changedFiles);
    spinner.succeed(`Analyzed ${gitDiff.files.length} changed files`);

    // 4. Build intelligent context
    const contextSpinner = ora('Building intelligent context...').start();
    const repoRoot = process.cwd();
    const contextBundle = await this.contextBuilder.build(gitDiff, repoRoot);

    contextSpinner.succeed(
      `Built context: ${contextBundle.metadata.totalFiles} files, ` +
      `${contextBundle.metadata.totalLines} lines, ` +
      `~${contextBundle.metadata.estimatedTokens} tokens`
    );

    console.log(chalk.gray(
      `  Phase 1 (Changes): ${contextBundle.metadata.phases.phase1_changes} files\n` +
      `  Phase 2 (Imports): ${contextBundle.metadata.phases.phase2_imports} files\n` +
      `  Phase 3 (Patterns): ${contextBundle.metadata.phases.phase3_patterns} files\n` +
      `  Phase 4 (Duplicates): ${contextBundle.metadata.phases.phase4_duplicates} found`
    ));

    // 5. Load skills
    const hasSkills = await this.skillsLoader.hasSkills();
    const skills = hasSkills ? await this.skillsLoader.loadSkills() : '';
    if (hasSkills) {
      console.log(chalk.gray('✓ Loaded domain knowledge'));
    }

    // 6. Build prompts with context
    const systemPrompt = this.promptBuilder.buildSystemPrompt(skills);
    const reviewPrompt = this.promptBuilder.buildReviewPromptWithContext(
      gitDiff,
      contextBundle,
      branch,
      baseBranch
    );

    // 7. Call Ollama for review
    console.log(chalk.cyan(`\n🤖 Reviewing with ${this.ollama.getModelName()}...\n`));

    const reviewSpinner = ora('Generating review...').start();
    let review: string;

    try {
      // Use streaming for better UX
      review = await this.ollama.reviewWithStreaming(
        reviewPrompt,
        systemPrompt,
        (chunk) => {
          // Update spinner with streaming text
          reviewSpinner.text = chalk.gray(chunk.slice(-50));
        }
      );
      reviewSpinner.succeed('Review generated');
    } catch (error: any) {
      reviewSpinner.fail('Review failed');
      throw error;
    }

    // 8. Generate report
    const metadata: ReviewMetadata = {
      branch,
      baseBranch,
      model: this.ollama.getModelName(),
      timestamp: new Date().toISOString(),
      filesReviewed: gitDiff.files.length,
      linesChanged: gitDiff.stats.insertions + gitDiff.stats.deletions,
    };

    await this.reportGenerator.generate(review, metadata, this.config.review.outputPath);

    // 9. Display summary
    this.displaySummary(metadata);
  }

  private async validateEnvironment(): Promise<void> {
    // Check if we're in a git repository
    const isGitRepo = await this.git.isGitRepository();
    if (!isGitRepo) {
      throw new Error('Not a git repository. Please run this command from a git repository.');
    }

    // Check if Ollama model exists
    const modelExists = await this.ollama.checkModelExists();
    if (!modelExists) {
      throw new Error(
        `Model "${this.config.model.name}" not found. Please run: ollama pull ${this.config.model.name}`
      );
    }

    console.log(chalk.green('✓ Environment validated'));
  }

  private async getGitInfo() {
    const spinner = ora('Getting git information...').start();

    try {
      const branch = await this.git.getCurrentBranch();
      const baseBranch = this.config.review.baseBranch;

      // Check if base branch exists
      const baseBranchExists = await this.git.branchExists(baseBranch);
      if (!baseBranchExists) {
        spinner.fail();
        throw new Error(`Base branch "${baseBranch}" not found`);
      }

      const diff = await this.git.getDiff(baseBranch);
      const changedFiles = await this.git.getChangedFiles(baseBranch);

      if (changedFiles.length === 0) {
        spinner.fail();
        throw new Error(`No changes found between ${baseBranch} and ${branch}`);
      }

      spinner.succeed(`Found ${changedFiles.length} changed files`);

      return { branch, baseBranch, diff, changedFiles };
    } catch (error) {
      spinner.fail();
      throw error;
    }
  }

  private displaySummary(metadata: ReviewMetadata): void {
    console.log(chalk.bold.green('\n✅ Review Complete!\n'));
    console.log(chalk.gray('Summary:'));
    console.log(chalk.gray(`  Branch: ${metadata.branch}`));
    console.log(chalk.gray(`  Files: ${metadata.filesReviewed}`));
    console.log(chalk.gray(`  Lines: ${metadata.linesChanged}`));
    console.log(chalk.gray(`  Model: ${metadata.model}`));
    console.log(chalk.cyan(`\n📄 Read the full review: ${this.config.review.outputPath}\n`));
  }
}
