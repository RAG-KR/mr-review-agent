// Core types for the review agent

export interface ReviewConfig {
  model: ModelConfig;
  permissions: PermissionsConfig;
  review: ReviewSettings;
}

export interface ModelConfig {
  name: string;
  temperature: number;
  maxTokens: number;
}

export interface PermissionsConfig {
  read: string[];
  write: string[];
  requireApproval: string[];
}

export interface ReviewSettings {
  baseBranch: string;
  includeTests: boolean;
  skillsPath: string;
  outputPath: string;
}

export interface GitDiff {
  files: ChangedFile[];
  stats: DiffStats;
  rawDiff: string;
}

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  content?: string;
}

export interface DiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface ReviewResult {
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  metadata: ReviewMetadata;
}

export interface ReviewIssue {
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface ReviewMetadata {
  branch: string;
  baseBranch: string;
  model: string;
  timestamp: string;
  filesReviewed: number;
  linesChanged: number;
}
