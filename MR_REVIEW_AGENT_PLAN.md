# MR Review Agent - Product Requirements & Technical Design Document

**Version:** 1.0 (POC Phase)
**Date:** 2026-04-21
**Status:** Planning → POC Development

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Original Concept](#original-concept)
3. [Core Requirements](#core-requirements)
4. [Architecture Decisions](#architecture-decisions)
5. [Developer Workflow](#developer-workflow)
6. [POC Scope](#poc-scope)
7. [Future Enhancements](#future-enhancements)
8. [Technical Implementation](#technical-implementation)
9. [Permission System](#permission-system)
10. [Skills & Domain Knowledge](#skills--domain-knowledge)
11. [Integration Strategy](#integration-strategy)
12. [Deployment Considerations](#deployment-considerations)
13. [Open Questions & Research Items](#open-questions--research-items)
14. [Decision Log](#decision-log)

---

## Executive Summary

### Vision
Build a local AI-powered Merge Request (MR) review agent that runs like `npm run test` or `npm run dev` - a simple command that reviews code changes before they reach production pipelines.

### Key Goals
- **Local-first**: Runs on developer machines using local Ollama models
- **Cost-effective**: No API costs (future: AWS cluster deployment with only infrastructure costs)
- **Context-aware**: Understands codebase, requirements, and domain knowledge
- **Non-invasive**: Suggests improvements without making changes (review-only)
- **Extensible**: Model-agnostic wrapper for easy model upgrades

### Success Criteria (POC)
- Run `npm run review` on changed code
- Generate comprehensive review as markdown file
- Use local Gemma 4 model via Ollama
- Leverage MCP for Git operations and file access
- Complete review in < 5 minutes for typical MR

---

## Original Concept

### Problem Statement
Currently, code reaches production pipelines without thorough local review. Manual reviews are:
- Time-consuming
- Inconsistent in quality
- Easy to skip under pressure
- Lack domain/business context

### Proposed Solution
A command-line agent that:
1. Runs locally before pushing to GitLab
2. Reviews code changes using AI (Gemma 4 via Ollama)
3. Checks against coding standards, domain rules, security issues
4. Generates actionable feedback
5. Requires zero additional infrastructure (for now)

### Inspiration
Similar to `npm run test` but for AI-powered code review:
```bash
npm run test      # Run unit tests
npm run dev       # Start dev server
npm run review    # AI reviews your changes ← NEW
```

---

## Core Requirements

### Functional Requirements

#### Must Have (POC)
1. **Execute via npm command**: `npm run review`
2. **Detect code changes**: Automatically find changes in current branch
3. **Review changed code**: Analyze diffs against main/master branch
4. **Generate report**: Output detailed review as `REVIEW.md`
5. **Use local model**: Gemma 4 via Ollama (no external API calls)
6. **Permission-based**: Config-driven permissions for operations
7. **Model-agnostic wrapper**: Easy to swap models in future

#### Should Have (Future)
1. **MR integration**: Post reviews as GitLab MR comments
2. **Jira integration**: Fetch ticket requirements for context
3. **Web search**: Look up documentation when needed
4. **Codebase indexing**: Vector DB with semantic search
5. **Multi-model pipeline**: One model for context, another for review
6. **Skills system**: Pluggable domain knowledge modules

#### Could Have (Nice to Have)
1. Interactive approval workflow
2. Review history tracking
3. Team-wide review analytics
4. Custom review templates per project
5. Integration with Confluence for documentation

### Non-Functional Requirements

1. **Performance**: Review completes in < 5 minutes
2. **Privacy**: All data stays local (no external API calls)
3. **Reliability**: Graceful failure if Ollama is down
4. **Usability**: Zero config to start, highly configurable if needed
5. **Maintainability**: Clear separation of concerns, MCP-first architecture

---

## Architecture Decisions

### Technology Stack: Node.js (CHOSEN)

#### Decision Rationale
**Python vs Node.js Analysis:**

| Criteria | Python | Node.js | Winner |
|----------|--------|---------|--------|
| AI/Agent Ecosystem | ✅ Mature | ⚠️ Growing | Python |
| npm Integration | ⚠️ Hacky | ✅ Native | **Node.js** |
| MCP Support | ✅ Good | ✅ Good | Tie |
| Team Familiarity | ? | ? | **Node.js** (consistency) |
| CLI Tooling | ⚠️ Click/Typer | ✅ Commander | **Node.js** |
| Ollama SDK | ✅ Official | ✅ Official | Tie |

**Final Decision: Node.js + TypeScript**
- Keeps tooling consistent with existing npm-based workflow
- Native npm command integration (`npm run review`)
- Excellent CLI frameworks (Commander, Inquirer)
- MCP SDK available in TypeScript
- Team consistency prioritized over ecosystem maturity

### MCP-First Architecture (CHOSEN)

Instead of reimplementing Git, filesystem, and API operations, leverage Model Context Protocol (MCP) servers as the agent's "hands."

**Benefits:**
1. **Separation of concerns**: Agent orchestrates, MCP servers execute
2. **Reusability**: MCP servers can be used by other tools
3. **Security**: Permission system built into MCP
4. **Extensibility**: Add new capabilities by adding MCP servers
5. **Maintenance**: Update MCP servers independently

**Architecture Diagram:**
```
┌─────────────────────────────────────────────────┐
│           npm run review (CLI)                  │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Review Agent (Node.js/TS)               │
│  - Orchestration logic                          │
│  - Prompt engineering                           │
│  - Report generation                            │
└─┬──────────┬──────────┬──────────┬──────────────┘
  │          │          │          │
  │ MCP      │ MCP      │ MCP      │ Direct
  │          │          │          │
┌─▼─────┐ ┌─▼──────┐ ┌─▼────────┐ ┌▼──────────┐
│  Git  │ │ File   │ │ GitLab   │ │  Ollama   │
│  MCP  │ │ System │ │   MCP    │ │  (Local)  │
│       │ │  MCP   │ │ (Future) │ │           │
└───────┘ └────────┘ └──────────┘ └───────────┘
```

---

## Developer Workflow

### Target Workflow (What Developers Do)

#### Current State (No Agent)
```bash
# Developer workflow
git checkout -b feature/add-login
# ... make changes ...
git add .
git commit -m "Add login feature"
git push origin feature/add-login
# Create MR in GitLab UI
# Wait for team review
```

#### Future State (With Agent) - POC v1
```bash
# Developer workflow
git checkout -b feature/add-login
# ... make changes ...
git add .
git commit -m "Add login feature"

# NEW: Review before pushing
npm run review

# Agent outputs:
# ✓ Analyzing changes...
# ✓ Found 5 changed files
# ✓ Running review...
# ✓ Review complete! See REVIEW.md

# Developer reads REVIEW.md, fixes issues
git add .
git commit -m "Address review feedback"

# Now push with confidence
git push origin feature/add-login
```

#### Future State (With Agent) - POC v2+
```bash
# After creating MR in GitLab
npm run review --mr=123

# Agent:
# ✓ Fetching MR #123...
# ✓ Found Jira ticket: PROJ-456
# ✓ Analyzing changes against requirements...
# ✓ Review posted as MR comment
```

### Agent Workflow (Internal Process)

#### POC v1 Flow
```
1. User runs: npm run review
2. Agent initializes
   └─ Load config from .reviewrc
   └─ Connect to Ollama
   └─ Initialize MCP clients
3. Permission check
   └─ Read .reviewrc permissions
   └─ Verify required access (git, filesystem)
4. Get current branch
   └─ MCP Git: Get current branch name
5. Get code changes
   └─ MCP Git: git diff main...HEAD
   └─ MCP Git: git diff --stat (summary)
6. Read changed files (context)
   └─ MCP Filesystem: Read full file contents
7. Load review rules
   └─ Read skills/ folder
   └─ Parse review criteria
8. Construct prompt
   └─ System prompt + rules + diff + context
9. Call Ollama
   └─ Send to Gemma model
   └─ Stream response
10. Generate report
    └─ Format as markdown
    └─ Save as REVIEW.md
11. Output summary to terminal
```

#### Future Flow (With GitLab + Jira)
```
1. User runs: npm run review
2. Agent initializes (same as POC v1)
3. Get current branch
4. Find associated MR
   └─ Option A: Parse branch name → query GitLab API
   └─ Option B: User provides --mr=123
   └─ Option C: Check GitLab for MRs from current branch
5. Fetch MR details
   └─ MCP GitLab: Get MR title, description, diff
6. Extract Jira ticket ID
   └─ Parse from branch name (e.g., feature/PROJ-123-add-login)
   └─ Or parse from MR description
7. Fetch Jira ticket
   └─ MCP Jira: Get summary, description, acceptance criteria
8. Get code changes (from GitLab or local)
9. Read changed files + related imports
10. Load review rules
11. Construct enhanced prompt
    └─ Jira requirements + MR description + code changes
12. Call Ollama (or multi-model pipeline)
13. Generate report
14. Post to MR as comment (optional with --post flag)
```

---

## POC Scope

### POC v1: Minimal Viable Agent

**Goal**: Prove the concept works end-to-end locally

#### In Scope
✅ **Core Functionality**
- `npm run review` command
- Detect current Git branch
- Get diff from main branch using MCP Git
- Read changed files using MCP Filesystem
- Send to Ollama (Gemma model)
- Generate `REVIEW.md` file
- Output summary to terminal

✅ **MCP Integration**
- Git MCP server (local Git operations)
- Filesystem MCP server (read files)
- Minimal custom wrappers if needed

✅ **Configuration**
- `.reviewrc` config file for:
  - Model selection (default: `gemma2:9b`)
  - Permission settings (pre-approved read access)
  - Review rules location

✅ **Review Criteria (Basic)**
- Code matches general best practices
- No obvious duplicated code (DRY principle)
- Basic code quality issues
- Simple security checks (hardcoded secrets, SQL injection patterns)

✅ **Tech Stack**
- Node.js + TypeScript
- `@modelcontextprotocol/sdk` - MCP client
- `ollama` - Ollama API client
- `commander` - CLI argument parsing
- `chalk` - Terminal colors
- `ora` - Loading spinners

#### Out of Scope (Future Phases)
❌ GitLab API integration
❌ Jira API integration
❌ Posting comments to MR
❌ Web search MCP
❌ Vector database / codebase indexing
❌ Multi-model pipeline
❌ Interactive approval workflow (config-based only)
❌ Complex permission system

### POC v2: GitLab + Jira Integration

**Goal**: Context-aware reviews using external data

#### Additions to v1
- GitLab MCP integration (read MRs, post comments)
- Jira MCP integration (read tickets)
- Auto-detect MR from branch name
- Extract Jira ticket ID from branch/MR
- Enhanced prompts with requirements
- `--post` flag to comment on MR

### POC v3: Advanced Features

**Goal**: Production-ready agent

#### Additions to v2
- Vector database for codebase indexing
- Web search MCP for documentation lookup
- Multi-model pipeline (context model + review model)
- Interactive permission system
- Skills system with pluggable modules
- Review history tracking
- Team analytics

---

## Technical Implementation

### Project Structure

```
mr-review-agent/
├── package.json                  # npm scripts, dependencies
├── tsconfig.json                 # TypeScript config
├── .reviewrc                     # User configuration
├── .env.example                  # Environment variables template
├── README.md                     # Setup instructions
├── src/
│   ├── index.ts                  # CLI entry point
│   ├── agent/
│   │   ├── ReviewAgent.ts        # Main orchestrator
│   │   ├── OllamaClient.ts       # Ollama wrapper (model-agnostic)
│   │   └── PromptBuilder.ts      # Prompt construction
│   ├── mcp/
│   │   ├── MCPManager.ts         # MCP client manager
│   │   ├── GitMCPClient.ts       # Git MCP wrapper
│   │   ├── FileSystemMCPClient.ts # Filesystem MCP wrapper
│   │   └── (future) GitLabMCPClient.ts
│   ├── config/
│   │   ├── ConfigLoader.ts       # Load .reviewrc
│   │   └── PermissionManager.ts  # Permission handling
│   ├── review/
│   │   ├── DiffAnalyzer.ts       # Parse git diff
│   │   ├── FileReader.ts         # Read changed files
│   │   └── ReportGenerator.ts    # Generate REVIEW.md
│   ├── skills/
│   │   └── SkillsLoader.ts       # Load domain knowledge
│   └── utils/
│       ├── logger.ts             # Logging utilities
│       └── errors.ts             # Error handling
├── skills/                       # Domain knowledge (user-editable)
│   ├── code_standards.md         # Team coding conventions
│   ├── security_checklist.md     # Security review items
│   ├── review_template.md        # Output format template
│   └── domain_knowledge.md       # Business logic rules
├── prompts/                      # System prompts
│   └── system_prompt.txt         # Base review instructions
└── tests/
    └── (TBD)
```

### Core Components

#### 1. CLI Entry Point (`index.ts`)
```typescript
// Pseudocode
import { Command } from 'commander';
import { ReviewAgent } from './agent/ReviewAgent';

const program = new Command();

program
  .name('npm run review')
  .description('AI-powered MR review agent')
  .option('--mr <id>', 'MR ID (future)')
  .option('--post', 'Post review to MR (future)')
  .option('--model <name>', 'Ollama model name')
  .action(async (options) => {
    const agent = new ReviewAgent(options);
    await agent.run();
  });

program.parse();
```

#### 2. Review Agent (`ReviewAgent.ts`)
```typescript
// Pseudocode
class ReviewAgent {
  constructor(options) {
    this.config = loadConfig('.reviewrc', options);
    this.mcp = new MCPManager(this.config);
    this.ollama = new OllamaClient(this.config.model);
  }

  async run() {
    // 1. Initialize
    await this.mcp.initialize();

    // 2. Get current branch
    const branch = await this.mcp.git.getCurrentBranch();

    // 3. Get diff
    const diff = await this.mcp.git.getDiff('main', branch);

    // 4. Read changed files
    const files = await this.readChangedFiles(diff);

    // 5. Load skills
    const skills = await this.loadSkills();

    // 6. Build prompt
    const prompt = this.buildPrompt(diff, files, skills);

    // 7. Call Ollama
    const review = await this.ollama.review(prompt);

    // 8. Generate report
    await this.generateReport(review);

    // 9. Output summary
    console.log('✓ Review complete! See REVIEW.md');
  }
}
```

#### 3. Ollama Client (`OllamaClient.ts`)
```typescript
// Model-agnostic wrapper
class OllamaClient {
  constructor(modelName: string = 'gemma2:9b') {
    this.model = modelName; // Easy to swap
  }

  async review(prompt: string): Promise<string> {
    const response = await ollama.generate({
      model: this.model,
      prompt: prompt,
      options: {
        temperature: 0.2, // Lower for consistent reviews
        num_ctx: 8192,    // Context window
      }
    });
    return response.response;
  }

  // Future: Multi-model support
  async contextModel(prompt: string) { /* ... */ }
  async reviewModel(prompt: string) { /* ... */ }
}
```

#### 4. MCP Manager (`MCPManager.ts`)
```typescript
// Orchestrates MCP servers
class MCPManager {
  constructor(config) {
    this.config = config;
    this.git = null;
    this.filesystem = null;
  }

  async initialize() {
    // Start MCP servers based on permissions
    if (this.config.permissions.read.includes('git')) {
      this.git = await this.startGitMCP();
    }
    if (this.config.permissions.read.includes('filesystem')) {
      this.filesystem = await this.startFilesystemMCP();
    }
  }

  async startGitMCP() {
    // Connect to Git MCP server (local or remote)
    // Return wrapper client
  }
}
```

#### 5. Report Generator (`ReportGenerator.ts`)
```typescript
class ReportGenerator {
  async generate(review: string, metadata: any): Promise<void> {
    const report = this.formatReport(review, metadata);
    await fs.writeFile('REVIEW.md', report);
  }

  formatReport(review: string, metadata: any): string {
    return `
# Code Review Report

**Date:** ${new Date().toISOString()}
**Branch:** ${metadata.branch}
**Model:** ${metadata.model}
**Files Changed:** ${metadata.filesChanged}

---

## Summary
${review}

---

## Recommendations
[Extracted from review]

---

*Generated by MR Review Agent*
`;
  }
}
```

### Configuration File (`.reviewrc`)

```json
{
  "model": {
    "name": "gemma2:9b",
    "temperature": 0.2,
    "maxTokens": 4096
  },
  "permissions": {
    "read": ["git", "filesystem"],
    "write": [],
    "requireApproval": ["web-search"]
  },
  "review": {
    "baseBranch": "main",
    "includeTests": true,
    "skillsPath": "./skills",
    "outputPath": "./REVIEW.md"
  },
  "mcp": {
    "servers": {
      "git": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-git"]
      },
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
      }
    }
  }
}
```

### System Prompt Template

```
You are an expert code reviewer. Your role is to review code changes and provide constructive, actionable feedback.

## Context
- Branch: {branch_name}
- Base branch: {base_branch}
- Files changed: {files_count}

## Review Criteria
1. **Code Quality**: Is the code clean, readable, and maintainable?
2. **DRY Principle**: Are there any unnecessary code duplications?
3. **Best Practices**: Does it follow language/framework conventions?
4. **Security**: Are there obvious security vulnerabilities?
5. **Performance**: Are there any obvious performance issues?

## Domain Knowledge
{skills_content}

## Code Changes
{diff}

## Full File Context
{file_contents}

Please provide a thorough review covering:
1. Overall assessment
2. Specific issues (file:line references)
3. Suggestions for improvement
4. Positive observations

Format your review in markdown with clear sections.
```

---

## Permission System

### Design Philosophy
**POC Approach**: Config-driven, pre-approved permissions (no runtime prompts)

### Permission Levels

#### Read Permissions (Allowed in POC)
- `git`: Read Git repository (diff, status, log, branch info)
- `filesystem`: Read files in repository
- `gitlab`: (Future) Read MR details, comments
- `jira`: (Future) Read ticket information

#### Write Permissions (Blocked in POC)
- `git`: Write operations (commit, push, checkout)
- `filesystem`: Write/modify files
- `gitlab`: Post comments, update MRs
- `jira`: Update tickets

#### Approval-Required (Config-based)
- `web-search`: External API calls
- `terminal`: Execute arbitrary shell commands

### Implementation

```typescript
class PermissionManager {
  constructor(config) {
    this.allowedRead = config.permissions.read || [];
    this.allowedWrite = config.permissions.write || [];
    this.requireApproval = config.permissions.requireApproval || [];
  }

  canRead(resource: string): boolean {
    return this.allowedRead.includes(resource);
  }

  canWrite(resource: string): boolean {
    return this.allowedWrite.includes(resource);
  }

  async requestApproval(action: string): Promise<boolean> {
    // For POC: Check config only
    // Future: Interactive prompt
    if (this.requireApproval.includes(action)) {
      console.log(`Action requires approval: ${action}`);
      return false; // Deny for POC
    }
    return true;
  }
}
```

### Future: Interactive Permissions

```typescript
// Future implementation
async requestApproval(action: string): Promise<boolean> {
  const answer = await inquirer.prompt([{
    type: 'confirm',
    name: 'approved',
    message: `Agent wants to: ${action}\nAllow?`,
    default: false
  }]);
  return answer.approved;
}
```

---

## Skills & Domain Knowledge

### Concept
A pluggable system for domain-specific knowledge, coding standards, and review criteria.

### Skills Folder Structure

```
skills/
├── code_standards.md          # Team coding conventions
├── security_checklist.md      # Security review items
├── domain_knowledge.md        # Business logic rules
├── review_template.md         # Output format guide
└── [custom_skill].md          # Project-specific rules
```

### Example: `code_standards.md`

```markdown
# Code Standards

## Naming Conventions
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Classes: PascalCase
- Files: kebab-case

## Code Organization
- Max file length: 300 lines
- Max function length: 50 lines
- Max function parameters: 4

## Comments
- Use JSDoc for public APIs
- Explain "why", not "what"
- No commented-out code

## Error Handling
- Always use try-catch for async operations
- Log errors with context
- User-facing errors must be clear

## Testing
- Every feature needs tests
- Aim for 80% coverage
- Test edge cases
```

### Example: `security_checklist.md`

```markdown
# Security Checklist

## Common Vulnerabilities
- [ ] No hardcoded secrets/API keys
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation on all user inputs
- [ ] Proper authentication checks
- [ ] Proper authorization checks
- [ ] No sensitive data in logs
- [ ] HTTPS only for external calls
- [ ] Dependencies are up to date
```

### Implementation Strategy

#### POC v1: Inject into System Prompt
```typescript
class SkillsLoader {
  async loadSkills(skillsPath: string): Promise<string> {
    const files = await fs.readdir(skillsPath);
    let skillsContent = '';

    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(skillsPath, file), 'utf-8');
        skillsContent += `\n\n## ${file}\n${content}`;
      }
    }

    return skillsContent;
  }
}
```

#### Future: RAG/Semantic Search
```typescript
// When skills grow large, use vector search
class SkillsLoader {
  async relevantSkills(codeChanges: string): Promise<string> {
    // 1. Embed code changes
    const queryEmbedding = await this.embed(codeChanges);

    // 2. Search skills vector DB
    const relevant = await this.vectorDB.search(queryEmbedding, k=5);

    // 3. Return top relevant skill sections
    return relevant.map(r => r.content).join('\n\n');
  }
}
```

#### Future: Claude-style Skills Framework
Research how Claude Code skills work:
- Skills as reusable modules
- Can invoke other tools
- Have their own prompts/instructions
- Can be composed

**TODO**: Research Claude skills architecture and adapt

---

## Integration Strategy

### GitLab Integration (Future)

#### Finding the MR

**Option A: Parse Branch Name → Query API** (Preferred)
```typescript
async findMR(branchName: string): Promise<number | null> {
  // 1. Get project ID from git remote
  const remote = await git.getRemoteUrl();
  const projectId = parseProjectId(remote);

  // 2. Query GitLab API for MRs with this branch
  const response = await gitlab.mergeRequests.all({
    projectId,
    source_branch: branchName,
    state: 'opened'
  });

  // 3. Return MR ID if found
  return response[0]?.iid || null;
}
```

**Option B: User Provides MR ID**
```bash
npm run review --mr=123
```

**Option C: Fallback - Local Branch Checkout**
```typescript
async reviewLocalChanges(): Promise<void> {
  // 1. Save current state
  const currentBranch = await git.getCurrentBranch();
  const hasUncommitted = await git.hasUncommittedChanges();

  if (hasUncommitted) {
    await git.stash();
  }

  // 2. Get diff
  const diff = await git.diff('main', currentBranch);

  // 3. Review
  await this.review(diff);

  // 4. Restore state
  if (hasUncommitted) {
    await git.stashPop();
  }
}
```

#### Posting Review Comments

**Flag-based**: `npm run review --post`

```typescript
async postReview(mrId: number, review: string): Promise<void> {
  await gitlab.mergeRequestNotes.create({
    projectId: this.projectId,
    mergeRequestIid: mrId,
    body: this.formatForGitLab(review)
  });
}
```

#### Required Setup
- GitLab API token (Personal Access Token or Project Token)
- Token stored in `.env` or config
- Scopes needed: `api`, `read_repository`, `write_repository`

### Jira Integration (Future)

#### Extracting Ticket ID

**From Branch Name** (Most Common)
```typescript
function extractJiraTicket(branchName: string): string | null {
  // Pattern: feature/PROJ-123-description
  const match = branchName.match(/([A-Z]+-\d+)/);
  return match ? match[1] : null;
}

// Examples:
// feature/PROJ-123-add-login → PROJ-123
// bugfix/TEAM-456-fix-crash → TEAM-456
```

**From MR Description**
```typescript
function extractJiraTicketFromDescription(description: string): string | null {
  // Look for patterns like:
  // - "Fixes PROJ-123"
  // - "Closes PROJ-123"
  // - "PROJ-123"
  const match = description.match(/(?:Fixes|Closes|Relates to)?\s*([A-Z]+-\d+)/i);
  return match ? match[1] : null;
}
```

#### Fetching Ticket Data

```typescript
async getJiraContext(ticketId: string): Promise<JiraTicket> {
  const issue = await jira.issues.getIssue({
    issueIdOrKey: ticketId,
    fields: [
      'summary',
      'description',
      'customfield_10016', // Acceptance Criteria (example)
      'issuetype',
      'priority'
    ]
  });

  return {
    summary: issue.fields.summary,
    description: issue.fields.description,
    acceptanceCriteria: issue.fields.customfield_10016,
    type: issue.fields.issuetype.name,
    priority: issue.fields.priority.name
  };
}
```

#### Enhanced Prompt with Jira Context

```
## Requirements (from Jira ticket {ticket_id})

**Summary**: {ticket_summary}

**Description**:
{ticket_description}

**Acceptance Criteria**:
{acceptance_criteria}

## Review Instruction
Please verify that the code changes fulfill the requirements and acceptance criteria above.
```

#### Required Setup
- Jira API token (Cloud: API token, Server: OAuth)
- Jira base URL
- Project key(s)
- Custom field IDs (e.g., acceptance criteria field)

**TODO**: Determine Jira instance type (Cloud vs self-hosted) and custom field names

### Web Search Integration (Future)

**Use Case**: When the agent encounters unfamiliar APIs/libraries

```typescript
// During review, if agent sees unknown library
const libName = detectLibrary(code); // e.g., "react-query"

if (needsDocumentation(libName)) {
  const docs = await mcp.webSearch.search(`${libName} best practices`);
  // Include docs in review context
}
```

**Permission**: Requires approval in config

```json
{
  "permissions": {
    "requireApproval": ["web-search"]
  }
}
```

---

## Deployment Considerations

### Current State: Local-Only (POC)

**Requirements**:
- Developer has Ollama installed
- Developer has chosen model downloaded (`ollama pull gemma2:9b`)
- Developer has Node.js installed
- Developer runs `npm install` in project

**Benefits**:
- Zero infrastructure cost
- Zero API cost
- Complete privacy (code never leaves machine)
- Works offline

### Future State: AWS Cluster Deployment

**Vision**: Scale beyond local machines for CI/CD integration

#### Architecture Options

**Option 1: Ephemeral Review Pods**
```
GitLab CI Job triggers →
Spin up AWS ECS/EKS pod with Ollama →
Pod reviews MR →
Posts comment to GitLab →
Pod terminates
```

**Pros**: Scales automatically, no idle cost
**Cons**: Cold start time (pulling model)

**Option 2: Persistent Review Service**
```
GitLab webhook →
Always-on review service (EC2/ECS) →
Queue-based review processing →
Posts comment to GitLab
```

**Pros**: Faster reviews (model loaded)
**Cons**: Always-on cost

**Option 3: Hybrid**
- Local reviews for developers (POC)
- AWS reviews for CI/CD pipeline
- Shared agent codebase

#### Cost Estimates (Rough)

**Local (Current)**:
- Infrastructure: $0
- API calls: $0
- Developer time: ~2-5 min per review

**AWS Deployment (Future)**:
- EC2 g4dn.xlarge (GPU): ~$0.50/hour (~$360/month if always-on)
- OR ECS Fargate with CPU only: ~$30-50/month (smaller model)
- Storage (models): ~$10/month
- **Total: ~$40-400/month depending on architecture**

**Comparison to API-based**:
- Claude API: ~$3-15 per 1M tokens
- For 100 reviews/day * 4k tokens each = 12M tokens/month = $36-180/month
- Break-even point: ~100 reviews/day

**Decision**: Start local (POC), evaluate AWS if adoption is high

#### Migration Path

1. **POC (Local)**: Prove value to team
2. **Adoption Phase**: Developers use locally for 1-2 months
3. **Metrics Collection**: Track usage, review quality, time saved
4. **Business Case**: Present ROI to leadership
5. **AWS Pilot**: Deploy for CI/CD pipeline only
6. **Full Rollout**: Replace manual reviews in pipeline

---

## Open Questions & Research Items

### Technical Research Needed

#### 1. MCP Servers Availability
- [ ] Research existing Git MCP server (official or community)
- [ ] Research Filesystem MCP server (official available)
- [ ] Research GitLab MCP server (does it exist? or build wrapper?)
- [ ] Research Jira MCP server (build custom wrapper likely needed)
- [ ] Test MCP server performance with large diffs

**Action**: Survey [MCP servers directory](https://github.com/modelcontextprotocol/servers) and test available ones

#### 2. Cursor/Copilot Architecture Study
**Goal**: Understand how established tools handle:
- Codebase indexing
- Context gathering
- File reading
- Git operations
- Commit suggestions

**Questions**:
- How does Cursor maintain codebase context?
- How does Copilot handle large diffs?
- What prompting strategies do they use?
- How do they handle permissions?

**Action**: Research Cursor architecture (docs, blog posts, reverse engineering)

#### 3. Claude Code Skills Framework
**Goal**: Understand and potentially replicate Claude's skills system

**Questions**:
- How are Claude skills structured?
- How do skills access tools?
- How are skills composed/chained?
- Can we adopt a similar pattern?

**Action**:
- Read Claude Code skills documentation
- Examine example skills
- Test how skills interact with MCP

#### 4. Ollama Model Selection
**Question**: Which model is best for code review?

**Candidates**:
| Model | Size | Context | Code Ability | Speed |
|-------|------|---------|--------------|-------|
| `gemma2:2b` | 2GB | 8K | ⭐⭐ | Fast |
| `gemma2:9b` | 5GB | 8K | ⭐⭐⭐ | Medium |
| `gemma2:27b` | 15GB | 8K | ⭐⭐⭐⭐ | Slow |
| `qwen2.5-coder:7b` | 4GB | 32K | ⭐⭐⭐⭐ | Medium |
| `deepseek-coder:6.7b` | 3.8GB | 16K | ⭐⭐⭐⭐ | Medium |

**Initial choice**: `gemma2:9b` for POC (good balance)
**Future**: Benchmark multiple models, let user choose

**Action**:
- Test each model on sample reviews
- Measure quality, speed, context handling
- Document findings

#### 5. Multi-Model Pipeline Design
**Concept**: Use two models in sequence
1. **Context Model** (fast, large context): Digest codebase, summarize changes
2. **Review Model** (powerful, slower): Analyze summarized context, generate review

**Benefits**:
- Faster for large diffs
- More focused reviews
- Better context handling

**Questions**:
- How to split responsibilities?
- How to pass context between models?
- Is the added complexity worth it?

**Action**: Design and prototype after POC v1 works

### GitLab/Jira Setup Questions

#### GitLab
- [ ] Confirm GitLab instance (self-hosted vs gitlab.com)
- [ ] Obtain API token (Project Access Token or Personal Access Token)
- [ ] Test API access (list MRs, read diff, post comment)
- [ ] Determine project ID extraction method
- [ ] Check API rate limits

**Owner**: TBD (Need DevOps/admin help)

#### Jira
- [ ] Confirm Jira instance (Cloud vs Server/Data Center)
- [ ] Determine ticket ID naming convention (project prefixes)
- [ ] Identify custom field IDs (Acceptance Criteria, etc.)
- [ ] Obtain API credentials
- [ ] Test API access

**Owner**: TBD (Need PM/admin help)

### Product/Process Questions

#### 1. Review Criteria Prioritization
**Question**: What matters most in reviews?

**Potential Criteria** (rank by importance):
- Matches requirements (from Jira)
- Code quality (DRY, readability)
- Security vulnerabilities
- Performance issues
- Test coverage
- Documentation
- Breaking changes
- Backwards compatibility

**Action**: Survey team to prioritize (after POC demo)

#### 2. Review Output Format
**Question**: How should reviews be presented?

**Options**:
- Markdown file (POC v1) ✅
- GitLab MR comment (Future)
- Terminal-only output
- HTML report
- JSON for CI/CD parsing

**Action**: Start with markdown, gather feedback

#### 3. False Positive Handling
**Question**: What if the agent is wrong?

**Strategies**:
- Allow "dismiss" comments in code (`// review-agent: ignore`)
- Track feedback (thumbs up/down on suggestions)
- Retrain/tune prompts based on feedback

**Action**: Add feedback mechanism in v2

#### 4. Integration with Existing Tools
**Question**: How does this fit with current workflow?

**Existing tools that might conflict/complement**:
- Pre-commit hooks
- CI/CD linters (ESLint, etc.)
- SonarQube / code quality tools
- Manual reviews by humans

**Philosophy**: Agent is **additive**, not replacement
- Catches issues pre-commit
- Complements human review
- Doesn't replace linters (runs after)

**Action**: Document positioning after POC

---

## Decision Log

### Major Decisions Made

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | **Use Node.js over Python** | Better npm integration, team consistency, adequate AI libraries | 2026-04-21 |
| 2 | **MCP-first architecture** | Separation of concerns, reusability, extensibility | 2026-04-21 |
| 3 | **Local-first deployment** | Zero cost, privacy, prove value before scaling | 2026-04-21 |
| 4 | **Config-based permissions (POC)** | Simpler implementation, faster to build | 2026-04-21 |
| 5 | **Review after MR creation** | Access to richer context (MR description, Jira ticket) | 2026-04-21 |
| 6 | **Skip Jira for POC** | Reduce complexity, focus on core functionality | 2026-04-21 |
| 7 | **Skip vector DB for POC** | Not needed for reviewing diffs only | 2026-04-21 |
| 8 | **Output to markdown file (POC)** | Easier than GitLab API integration, good for testing | 2026-04-21 |
| 9 | **Single model for POC** | Multi-model adds complexity, prove single model first | 2026-04-21 |
| 10 | **Gemma 2 (9B) as default model** | Good balance of quality and speed for POC | 2026-04-21 |

### Technical Choices

| Component | Choice | Alternative Considered | Reason |
|-----------|--------|----------------------|--------|
| Language | Node.js + TypeScript | Python | npm integration, consistency |
| CLI Framework | Commander | Yargs, oclif | Simple, popular |
| MCP SDK | @modelcontextprotocol/sdk | Custom | Official, maintained |
| Ollama Client | `ollama` npm package | Direct API | Simpler |
| Permission System | Config file (.reviewrc) | Runtime prompts | Faster for POC |
| Config Format | JSON | YAML, TOML | Familiar to JS devs |
| Output Format | Markdown | JSON, HTML | Human-readable |
| VCS Operations | MCP Git server | GitPython, nodegit | Separation of concerns |

### Deferred Decisions (Future)

| Decision | Options | When to Decide |
|----------|---------|----------------|
| Multi-model pipeline | Yes/No | After POC v1 testing |
| GitLab comment format | Plain text / Rich markdown / Threaded | POC v2 |
| Jira field mapping | TBD based on instance | When Jira integration starts |
| Vector DB choice | ChromaDB / Qdrant / Pinecone | When indexing is needed |
| AWS deployment architecture | Ephemeral / Persistent / Hybrid | After POC adoption metrics |
| Review history storage | Local DB / Cloud / None | POC v3 |
| Team analytics dashboard | Yes/No | After 3 months usage |

---

## Success Metrics

### POC Success Criteria

**Technical Success**:
- ✅ Agent runs end-to-end without errors
- ✅ Generates meaningful review of code changes
- ✅ Completes review in < 5 minutes
- ✅ Works with multiple Ollama models
- ✅ MCP servers integrate correctly

**User Success**:
- ✅ Developers can install and run with < 10 min setup
- ✅ Review output is actionable (specific file:line issues)
- ✅ Catches at least 1 real issue per 3 reviews (33% hit rate)
- ✅ Developers find it useful enough to run voluntarily

**Business Success**:
- ✅ Reduced bugs reaching production (measure after 1 month)
- ✅ Faster review cycles (measure avg time to merge)
- ✅ Positive developer feedback (survey after 2 weeks)

### Adoption Metrics (Post-POC)

**Usage**:
- Number of reviews run per week
- % of MRs reviewed by agent before merge
- Repeat usage rate (developers running multiple times)

**Quality**:
- Issues caught by agent (categorized)
- False positive rate (issues marked as incorrect)
- Issues that made it to production (agent missed)

**Impact**:
- Time saved per review (estimated)
- Developer satisfaction score (survey)
- Code quality improvement (SonarQube metrics before/after)

---

## Timeline & Milestones

### Phase 0: Research & Setup (Week 1)
- [ ] Research MCP servers (Git, Filesystem)
- [ ] Research Cursor/Copilot architecture
- [ ] Research Claude Code skills framework
- [ ] Test Ollama models for code review
- [ ] Create project repository
- [ ] Write architecture documentation (this doc)

### Phase 1: POC v1 - Core Functionality (Week 2-3)
- [ ] Project scaffolding (TypeScript, package.json)
- [ ] Implement CLI with Commander
- [ ] Implement OllamaClient wrapper
- [ ] Integrate Git MCP server
- [ ] Integrate Filesystem MCP server
- [ ] Implement DiffAnalyzer
- [ ] Implement PromptBuilder
- [ ] Implement ReportGenerator
- [ ] Create basic system prompt
- [ ] End-to-end test on sample MR
- [ ] Documentation (README, setup guide)

**Deliverable**: Working `npm run review` command that outputs `REVIEW.md`

### Phase 2: POC v1 Refinement (Week 4)
- [ ] Add skills system (load .md files)
- [ ] Improve prompt engineering
- [ ] Add configuration file support (.reviewrc)
- [ ] Add CLI options (--model, --output)
- [ ] Error handling and logging
- [ ] Test on multiple projects/languages
- [ ] Create demo for stakeholders

**Deliverable**: Polished POC ready for team testing

### Phase 3: Team Pilot (Week 5-8)
- [ ] Deploy to 3-5 developers
- [ ] Gather feedback (survey)
- [ ] Track metrics (usage, quality)
- [ ] Iterate on prompts based on feedback
- [ ] Fix bugs reported

**Deliverable**: Validation of concept, data for business case

### Phase 4: POC v2 - GitLab Integration (Week 9-10)
*Only if Phase 3 is successful*

- [ ] Obtain GitLab API access
- [ ] Implement GitLab MCP integration
- [ ] Add MR detection (from branch name)
- [ ] Add `--post` flag to comment on MR
- [ ] Test on real MRs

**Deliverable**: Agent can post reviews directly to GitLab

### Phase 5: POC v3 - Advanced Features (Week 11-12)
*Only if team adoption is high*

- [ ] Add Jira integration
- [ ] Add web search MCP
- [ ] Implement multi-model pipeline
- [ ] Add vector DB for codebase indexing
- [ ] Interactive permission system

**Deliverable**: Feature-complete agent

### Phase 6: AWS Deployment (Month 4+)
*Only if approved by leadership*

- [ ] Design AWS architecture
- [ ] Set up infrastructure (ECS/EKS)
- [ ] Deploy to staging
- [ ] Integrate with CI/CD pipeline
- [ ] Production rollout

**Deliverable**: Production-grade review service

---

## Risks & Mitigations

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **MCP servers don't exist/work** | High (blocks POC) | Medium | Research upfront, build minimal wrappers if needed |
| **Ollama too slow locally** | Medium (poor UX) | Low | Test early, optimize prompts, use smaller model |
| **Model quality insufficient** | High (no value) | Medium | Test multiple models, iterate on prompts |
| **Large diffs exceed context** | Medium (incomplete reviews) | High | Implement chunking strategy, summarization |
| **Git operations unreliable** | Medium (incorrect diffs) | Low | Thorough testing, fallback to direct git commands |

### Product Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Developers don't adopt** | High (wasted effort) | Medium | Make setup trivial, prove value early, gather feedback |
| **Too many false positives** | High (lose trust) | Medium | Tune prompts, allow dismissing, track feedback |
| **Leadership doesn't approve AWS** | Medium (stays local) | Medium | Build strong business case with POC metrics |
| **Competes with existing tools** | Low (positioning) | Low | Position as additive, not replacement |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Not approved for production** | Medium (POC only) | Medium | Build incrementally, get early buy-in, show ROI |
| **Team turnover** | Low (maintenance) | Low | Document thoroughly, keep architecture simple |
| **Budget constraints** | Medium (can't deploy) | Low | Local-first keeps costs at zero |

---

## Appendix

### Glossary

- **MCP**: Model Context Protocol - A standard for AI agents to interact with external tools
- **MR**: Merge Request (GitLab's term for Pull Request)
- **POC**: Proof of Concept
- **RAG**: Retrieval-Augmented Generation
- **DRY**: Don't Repeat Yourself
- **Ollama**: Local LLM runtime (like Docker for models)

### References

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Ollama Documentation](https://ollama.ai/docs)
- [GitLab API Documentation](https://docs.gitlab.com/ee/api/)
- [Jira REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Claude Code Skills](https://github.com/anthropics/claude-code)

### Related Tools

**Existing Code Review Tools**:
- SonarQube (static analysis)
- CodeClimate (code quality metrics)
- Codacy (automated reviews)
- GitHub Copilot (code suggestions)
- Cursor (AI code editor)

**How This Differs**:
- Runs locally (privacy + no cost)
- Contextually aware (Jira tickets, domain knowledge)
- Merge request focused (not line-by-line)
- Customizable prompts (team-specific rules)

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Create this planning document
2. [ ] Share with stakeholders for feedback
3. [ ] Research MCP Git server (test locally)
4. [ ] Research MCP Filesystem server (test locally)
5. [ ] Test Ollama with `gemma2:9b` on sample code review
6. [ ] Create GitHub/GitLab repository for project
7. [ ] Begin Phase 1 implementation

### Before Next Meeting
- Confirm GitLab access requirements
- Identify 2-3 pilot developers for testing
- Prepare sample MRs for testing
- Set up Confluence page with this document

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-21 | Initial | Complete planning document created |

---

**Document Status**: ✅ Ready for Review

**Next Review Date**: After POC v1 completion

**Feedback**: Please add comments/questions to Confluence page or create issues in project repository.
