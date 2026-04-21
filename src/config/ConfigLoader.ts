import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { ReviewConfig } from '../types.js';

export class ConfigLoader {
  private static DEFAULT_CONFIG: ReviewConfig = {
    model: {
      name: 'gemma4:26b',
      temperature: 0.2,
      maxTokens: 8192,
    },
    permissions: {
      read: ['git', 'filesystem'],
      write: [],
      requireApproval: [],
    },
    review: {
      baseBranch: 'main',
      includeTests: true,
      skillsPath: './skills',
      outputPath: './REVIEW.md',
    },
  };

  static async load(configPath: string = '.reviewrc'): Promise<ReviewConfig> {
    const fullPath = resolve(process.cwd(), configPath);

    if (!existsSync(fullPath)) {
      console.log('⚠️  No .reviewrc found, using defaults');
      return this.DEFAULT_CONFIG;
    }

    try {
      const content = await readFile(fullPath, 'utf-8');
      const userConfig = JSON.parse(content);

      // Merge with defaults
      return this.mergeConfig(this.DEFAULT_CONFIG, userConfig);
    } catch (error) {
      console.error('❌ Error loading config:', error);
      console.log('Using default configuration');
      return this.DEFAULT_CONFIG;
    }
  }

  private static mergeConfig(defaults: ReviewConfig, user: Partial<ReviewConfig>): ReviewConfig {
    return {
      model: { ...defaults.model, ...user.model },
      permissions: { ...defaults.permissions, ...user.permissions },
      review: { ...defaults.review, ...user.review },
    };
  }
}
