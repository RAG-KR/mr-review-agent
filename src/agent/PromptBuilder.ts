import type { GitDiff } from '../types.js';

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
Provide your review in markdown format with these sections:
1. **Summary**: Brief overview of the changes
2. **Issues Found**: List specific issues with file:line references
3. **Recommendations**: Actionable suggestions for improvement
4. **Positive Observations**: What was done well

Be thorough but concise. Focus on the most important issues first.`;
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
