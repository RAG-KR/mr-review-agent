import type { GitDiff, ContextBundle } from '../types.js';

export class PromptBuilder {
  buildSystemPrompt(skills: string): string {
    return `You are an expert code reviewer. Your role is to review code changes and provide constructive, actionable feedback.

## Your Responsibilities
1. Analyze code changes thoroughly
2. Identify potential issues, bugs, and improvements
3. Provide specific, actionable recommendations
4. Reference exact file paths and line numbers when possible
5. Be constructive and educational in your feedback

## Review Criteria
1. **Code Quality**: Is the code clean, readable, and maintainable?
2. **DRY Principle**: Are there any unnecessary code duplications?
3. **Best Practices**: Does it follow language/framework conventions?
4. **Security**: Are there obvious security vulnerabilities (SQL injection, XSS, hardcoded secrets)?
5. **Performance**: Are there any obvious performance issues?
6. **Error Handling**: Are errors handled appropriately?
7. **Edge Cases**: Are edge cases considered?

${skills ? `## Domain Knowledge\n${skills}\n` : ''}

## Output Format

Use these 7 sections IN ORDER (copy the headers exactly):

## What This MR Does
3-5 sentences: what feature/fix, approach taken, key files modified

## Current Issues
### BLOCKER (must fix): Security, data loss, crashes (file:line with fix)
### SHOULD FIX: Performance, error handling (file:line with fix)

## Future Concerns
Scalability, maintenance risks, edge cases (file:line with recommendation)

## Code Quality
DRY violations, pattern deviations, refactoring (file:line)

## What Was Done Well
Positive observations with examples

## Comments Summary
List ALL issues:
- Must fix: #. file:line
- Should fix: #. file:line
- Consider: #. file:line

## Final Decision
**Status:** APPROVED or COMMENTS TO ADDRESS
**Files:** N | **Risk:** LOW/MEDIUM/HIGH
**Reason:** One sentence why`;
  }

  buildReviewPrompt(diff: GitDiff, branch: string, baseBranch: string): string {
    const { files, stats } = diff;

    let prompt = `# Code Review Request

## Context
- **Current Branch**: ${branch}
- **Base Branch**: ${baseBranch}
- **Files Changed**: ${files.length}
- **Lines Added**: ${stats.insertions}
- **Lines Removed**: ${stats.deletions}

## Changed Files Summary
`;

    // Add file summary
    for (const file of files) {
      prompt += `- \`${file.path}\` (${file.status}): +${file.additions} -${file.deletions}\n`;
    }

    prompt += `\n## Full Diff\n\`\`\`diff\n${this.truncateDiff(diff.rawDiff)}\n\`\`\`\n`;

    // Add full file contents for context
    const filesWithContent = files.filter(f => f.content);
    if (filesWithContent.length > 0) {
      prompt += `\n## Full File Contents (for context)\n\n`;

      for (const file of filesWithContent.slice(0, 5)) { // Limit to 5 files to avoid token limits
        if (file.content) {
          prompt += `### ${file.path}\n\`\`\`\n${this.truncateContent(file.content)}\n\`\`\`\n\n`;
        }
      }
    }

    prompt += `\nPlease provide a thorough code review following the guidelines above.`;

    return prompt;
  }

  buildReviewPromptWithContext(
    diff: GitDiff,
    context: ContextBundle,
    branch: string,
    baseBranch: string
  ): string {
    const { files, stats } = diff;

    let prompt = `# Code Review Request

## Context
- Current Branch: ${branch}
- Base Branch: ${baseBranch}
- Files Changed: ${files.length}
- Lines Added: ${stats.insertions}
- Lines Removed: ${stats.deletions}
- Context Files Analyzed: ${context.metadata.totalFiles}
- Total Lines of Context: ${context.metadata.totalLines}

## Changed Files Summary
`;

    for (const file of files) {
      prompt += `- ${file.path} (${file.status}): +${file.additions} -${file.deletions}\n`;
    }

    prompt += `\n## Git Diff\n\`\`\`diff\n${this.truncateDiff(diff.rawDiff)}\n\`\`\`\n`;

    if (context.changedFiles.length > 0) {
      prompt += `\n## Changed Files (Full Context)\n\n`;
      for (const file of context.changedFiles) {
        prompt += `### ${file.path}${file.truncated ? ' (truncated)' : ''}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      }
    }

    if (context.importContext.length > 0) {
      prompt += `\n## Import Context (Dependencies and Callers)\n`;
      prompt += `These files are imported by or import the changed files.\n\n`;

      for (const file of context.importContext) {
        prompt += `### ${file.path}${file.truncated ? ' (truncated)' : ''}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      }
    }

    if (context.architecturalPatterns.length > 0) {
      prompt += `\n## Architectural Patterns (Similar Implementations)\n`;
      prompt += `These files show how similar features are implemented in this codebase.\n\n`;

      for (const file of context.architecturalPatterns) {
        prompt += `### ${file.path}${file.truncated ? ' (truncated)' : ''}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      }
    }

    if (context.duplicateEvidence.length > 0) {
      prompt += `\n## Potential Duplicates Found\n`;
      prompt += `The following patterns were found in multiple places:\n\n`;

      for (const dup of context.duplicateEvidence) {
        prompt += `### ${dup.pattern}: ${dup.description}\n`;
        prompt += `Found in ${dup.instances.length} locations:\n\n`;

        for (const instance of dup.instances) {
          prompt += `- ${instance.file}:${instance.line}: ${instance.snippet}\n`;
        }
        prompt += `\n`;
      }
    }

    prompt += `\n## Review Instructions

Use the 7-section format from system prompt. Compare to architectural examples provided. Check duplicates found. Reference similar files for suggestions.`;

    return prompt;
  }

  private truncateDiff(diff: string, maxLines: number = 500): string {
    const lines = diff.split('\n');
    if (lines.length <= maxLines) {
      return diff;
    }

    return lines.slice(0, maxLines).join('\n') +
      `\n\n... (truncated ${lines.length - maxLines} lines for brevity)`;
  }

  private truncateContent(content: string, maxLines: number = 200): string {
    const lines = content.split('\n');
    if (lines.length <= maxLines) {
      return content;
    }

    return lines.slice(0, maxLines).join('\n') +
      `\n\n... (truncated ${lines.length - maxLines} lines)`;
  }
}
