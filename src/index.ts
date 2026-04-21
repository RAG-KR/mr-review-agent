#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ReviewAgent } from './agent/ReviewAgent.js';

const program = new Command();

program
  .name('mr-review')
  .description('AI-powered merge request review agent')
  .version('0.1.0')
  .option('-m, --model <name>', 'Ollama model name (e.g., gemma4:26b)')
  .option('-b, --base-branch <branch>', 'Base branch to compare against', 'main')
  .option('-o, --output <path>', 'Output file path', './REVIEW.md')
  .action(async (options) => {
    try {
      const agent = await ReviewAgent.create({
        model: options.model,
        baseBranch: options.baseBranch,
        output: options.output,
      });

      await agent.run();
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program.parse();
