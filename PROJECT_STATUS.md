# MR Review Agent - Project Status

**Last Updated:** 2026-04-22 (Active Development)
**Status:** Published to npm ✅ - Redesigning context strategy for POC

---

## What's Built ✅

### Core Functionality (Working)
- ✅ Git diff reader
- ✅ Ollama integration (gemma4:26b, 128k context)
- ✅ AI code reviewer
- ✅ Report generator (REVIEW.md)
- ✅ Skills system (loads custom rules)
- ✅ CLI (`mr-review` command)
- ✅ **Works on ANY codebase globally**
- ✅ **Published to npm** as `mr-review-agent` v0.1.0
- ✅ **GitHub repo:** https://github.com/RAG-KR/mr-review-agent

### Tested
- ✅ Catches security issues (hardcoded secrets, SQL injection)
- ✅ Finds code quality issues (DRY, magic numbers)
- ✅ Gives actionable recommendations
- ✅ Works in ~60-90 seconds

### Known Limitations (Being Fixed in Current Sprint)
- ⚠️ **CRITICAL FLAW:** Only looks at git diff - no architectural context
- ⚠️ Can't find similar implementations in same directory
- ⚠️ Can't detect conceptual duplicates (same logic, different names)
- ⚠️ No import-based context (doesn't read dependencies)
- ⚠️ Can't suggest alternative approaches from existing code
- ⚠️ Truncation too aggressive (causing OOM with 9+ files)

---

## Current Workflow

### For Users
```bash
# One-time install
cd /path/to/mr-review-agent
npm install && npm run build && npm link

# Use anywhere
cd /any/git/project
mr-review

# Read review
cat REVIEW.md
```

### For Development
```bash
cd /Users/raghavkumarr/Desktop/coding/localMRagent

# Make changes
# ... edit src/ files ...

# Rebuild
npm run build

# Test locally
npm run review

# Or test global command
mr-review
```

---

## ✅ Completed Sessions

### April 21, 2026
1. ✅ Published to npm as `mr-review-agent@0.1.0`
2. ✅ Created GitHub repo and pushed code
3. ✅ Deep discussion on what makes POC "impressive"
4. ✅ Defined roadmap and priorities
5. ✅ Decided on 1-day sprint approach

### April 22, 2026 - Context Strategy Redesign
1. ✅ Tested on real 9-file MR - hit OOM errors
2. ✅ Debugged Ollama crashes (model runner exhaustion)
3. ✅ Adjusted truncation limits (2000 diff, 250/file → 1000 diff, 250/file)
4. ✅ **MAJOR INSIGHT:** Git diff approach is fundamentally flawed
5. ✅ Deep research on what makes quality code reviews
6. ✅ Redesigned architecture: Multi-phase context gathering
7. ✅ Defined priority system for 15-file context budget

## 🎯 Current Sprint: Multi-Phase Context Architecture

### Goal: Build intelligent context gathering for meaningful reviews

### **NEW ARCHITECTURE: 5-Phase Context Builder**

#### **Phase 1: Understand the Change** ⚡ (Git Operations)
```typescript
Input: Git diff, branch info, commit messages
Output: Changed files list, change type (feat/fix/refactor), "why" context
```
**What we gather:**
- Full git diff
- PR/commit description
- List of changed files with stats
- Change classification

**Implementation:**
- ✅ Already have git diff reader
- 🔧 Need: Parse commit messages for context
- 🔧 Need: Classify change type

---

#### **Phase 2: Build Immediate Context** 🔍 (Import-Based)
```typescript
Priority: HIGH - These are direct dependencies
Target: ~5-8 files
```
**What we gather:**
1. **Direct imports** - Files imported by changed files
2. **Reverse dependencies** - Files that import changed files
3. **Shared utilities** - Common imports across changed files

**Example:**
```
Changed: src/services/user-auth.service.ts
├─ Imports: src/models/user.model.ts ✅ Read this
├─ Imports: src/utils/jwt.util.ts ✅ Read this
└─ Imported by: src/controllers/auth.controller.ts ✅ Read this
```

**Why this matters:**
- Understand data structures (models/types)
- See how changed code is used (callers)
- Catch breaking changes in contracts

---

#### **Phase 3: Find Architectural Patterns** 🏗️ (Directory + Naming)
```typescript
Priority: MEDIUM - Understand how similar problems are solved
Target: ~3-5 files
```
**What we search:**
1. **Same parent directory** - Similar modules/features
2. **Naming patterns** - Other `*.service.ts`, `*.controller.ts`, etc.
3. **Sibling implementations** - Other endpoints/features in same area

**Example:**
```
Changed: src/adaption/content-area/endpoint.ts

Search:
├─ src/adaption/*/endpoint.ts  ✅ Other adaption endpoints
├─ src/adaption/**/*.service.ts ✅ Related services
└─ src/adaption/* (parent dir) ✅ Sibling implementations
```

**Why this matters:**
- Suggest: "Use pattern from print-area/endpoint.ts"
- Warn: "Other adaptions handle errors differently"
- Learn: Existing conventions in this part of codebase

---

#### **Phase 4: Search Conceptual Duplicates** 🔎 (Grep-Based)
```typescript
Priority: MEDIUM-LOW - Find DRY violations
Target: ~2-3 instances (if found)
```
**What we search:**
1. **Validation patterns** - Email regex, phone formats, etc.
2. **Similar function logic** - Grep for similar patterns
3. **Business rules** - Pricing logic, access control, etc.

**Example:**
```typescript
// New code in MR:
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Grep search: /^\s*function.*[Ee]mail.*\{/
// Found: auth.ts:45, profile.ts:89, settings.ts:123

// Review: "🔵 CODE QUALITY: Email validation already exists
// in 3 places - consider shared utility"
```

**Search strategies:**
- Regex patterns (email, phone, dates)
- Function name similarity (validate*, check*, verify*)
- Comment patterns (TODO, FIXME, HACK)

---

#### **Phase 5: Generate Contextual Review** 🤖 (LLM)
```typescript
Context bundle:
- Git diff (the changes)
- Changed files (full content)
- Phase 2 files (imports/callers)
- Phase 3 files (architectural examples)
- Phase 4 evidence (duplicates found)

Total: ~15-20 files, ~15k tokens (manageable!)
```

**LLM can now:**
- Compare to existing patterns
- Suggest: "Use pattern from X.ts"
- Warn: "Similar code in Y.ts - refactor?"
- Validate: "Follows project conventions ✓"

---

### **Context Priority System** (15-file budget)

```
Priority 1 (MUST INCLUDE):
├─ Changed files (all of them)
└─ Total: N files (variable)

Priority 2 (HIGH - fill to ~12 files total):
├─ Direct imports from changed files
├─ Files that import changed files
└─ Shared utilities/types

Priority 3 (MEDIUM - fill to ~15 files total):
├─ Similar files in parent directory
├─ Files matching naming pattern (*.service.ts)
└─ Sibling implementations

Priority 4 (LOW - only if space remains):
└─ Evidence files for duplicates (show examples)
```

**Example distribution for 3 changed files:**
- 3 changed files (Priority 1)
- 6 import-related files (Priority 2)
- 4 architectural pattern files (Priority 3)
- 2 duplicate evidence files (Priority 4)
= **15 files total**

---

#### Task 3: Improved Severity System (Hours 5-6)
**Currently:** Generic "issues found"
**New taxonomy (based on research):**

```markdown
🔴 BLOCKER (Must Fix Before Merge)
- Security: SQL injection, XSS, auth bypass, secrets
- Data loss: Breaking changes, corruption risks
- Production: Memory leaks, crashes, resource exhaustion

🟡 OPTIMIZATION (Should Fix)
- Performance: N+1 queries, O(n²) algorithms
- Scalability: Resource leaks, inefficient loops
- Reliability: Missing error handling, unhandled edge cases

🔵 MENTORSHIP (Consider Fixing - Code Quality)
- DRY violations: Conceptual duplicates across files
- SOLID: Separation of concerns, abstraction issues
- Architecture: Not following existing patterns
- Refactoring: Suggest better approach from codebase

✅ POSITIVE (Recognition)
- Good test coverage
- Follows project patterns
- Clean abstractions
- Elegant solutions

⚪ NITPICK (Optional - Low Priority)
- Naming: Variable/function names
- Style: Minor formatting (if not linter-caught)
- Typos: In comments/docs
```

**What to IGNORE:**
- ❌ Formatting (linters handle this)
- ❌ Personal style preferences
- ❌ Documentation (unless critical)

#### Task 3: Severity Labels + Better Prompts (Hours 5-6)
**Currently:** Generic "review this" prompt
**Improve:**
- Add severity labels: CRITICAL, POSSIBLE BUG, CODE QUALITY, NITPICK
- Focus on: DRY, SOLID, security, error handling, performance
- Ignore: Style issues, personal preferences
- Be specific and actionable

**Impact:** High-signal findings, builds trust

#### Task 4: Test & Validate (Hours 7-8)
**Test on real MR with known issues**
- Measure: What did it catch?
- Compare to human review
- Check: Execution time <2 min?
- Decide: Is this impressive?

**Success criteria:**
- 2-3 real findings
- 1-2 architectural observations
- Appropriate severity labels
- Low false positives

---

## 🗺️ Future Enhancements (Post-POC)

### Option A: Vector DB for Semantic Search (1-2 weeks)
**Status:** DEFERRED - POC first, then evaluate need

**What it would add:**
- Semantic code search (not just grep)
- Find similar logic with different implementations
- Better duplicate detection
- "Find me all validation functions" queries

**Technology:**
- LanceDB (local, TypeScript-native)
- ~50-500MB storage
- One-time indexing, fast queries

**When to revisit:**
- After POC shows promise
- When grep-based duplicate detection proves insufficient
- When we see clear cases of missed semantic duplicates

**Tradeoff analysis:**
- **Pros:** Better duplicate detection, semantic understanding
- **Cons:** 3-4 days to implement, adds complexity, storage overhead
- **Decision:** Prove value with grep first, add this later if needed

---

### Option B: MCP + Confluence Integration (2-3 weeks)
**Status:** DEFERRED - Phase 3 (if we get there)

**What it would add:**
- Product context from wiki/docs
- Architecture decision records
- "Why we did it this way" knowledge
- Business rules and requirements

**Implementation:**
- MCP Confluence connector
- RAG architecture (retrieve relevant docs)
- Include in LLM context

**When to revisit:**
- After Phase 2 (multi-phase context) is working
- When reviews lack product context
- When team is committed to long-term usage

---

### Option C: Test Execution Integration (1 week)
**Status:** FUTURE - Not for POC

**What it would add:**
- Run TypeScript compiler (`tsc --noEmit`)
- Run tests (`npm test`)
- Include results in review
- Catch runtime issues

**When to revisit:**
- After core review quality is proven
- When static analysis isn't catching enough

---

### Option D: Learning Feedback Loop (2 weeks)
**Status:** INTERESTING - Consider for Phase 3

**What it would add:**
- Team can teach AI after reviews
- "This pattern is preferred because X"
- Builds institutional knowledge
- Gets better over time

**Implementation:**
- `.mr-review/learnings.json` file
- Structured feedback after reviews
- Include learnings in future prompts

**When to revisit:**
- After team is actively using the tool
- When we need domain-specific knowledge
- As alternative to Confluence integration

---

## 📊 Decision Framework

### Continue to Phase 2 if:
- ✅ Catches 2+ real issues in test MR
- ✅ Team member says "this is useful"
- ✅ Better than running linters alone
- ✅ Execution time acceptable

### Pivot/Stop if:
- ❌ Mostly generic comments
- ❌ High false positive rate
- ❌ No better than basic tools
- ❌ Too slow to be practical

---

## Key Files

### Documentation
- `MR_REVIEW_AGENT_PLAN.md` - Full planning doc
- `README.md` - User documentation
- `QUICKSTART.md` - 5-min setup guide
- `PROJECT_STATUS.md` - This file

### Core Code
- `src/index.ts` - CLI entry point
- `src/agent/ReviewAgent.ts` - Main orchestrator
- `src/agent/OllamaClient.ts` - AI integration
- `src/git/GitOperations.ts` - Git operations
- `src/review/DiffAnalyzer.ts` - Diff parsing
- `src/agent/PromptBuilder.ts` - Prompt engineering

### Config
- `.reviewrc` - User configuration
- `package.json` - npm package config
- `tsconfig.json` - TypeScript config

### Skills (User-editable)
- `skills/code_standards.md`
- `skills/security_checklist.md`

---

## Important Notes

### Model: Gemma 128k Context
- **Current config:** 8192 tokens max
- **Actual capability:** 128,000 tokens!
- **Opportunity:** Can analyze ENTIRE codebases, not just diffs
- **TODO:** Update config to use full context window

### Current Limitations
- Only reviews diffs (not full context)
- Truncates large diffs
- No MCP servers yet
- No GitLab/Jira integration
- Single model only

### Easy Wins (30 min each)
1. Increase context to 128k
2. Remove diff truncation
3. Add streaming output
4. Auto-detect base branch
5. Add review profiles

---

## ✅ Questions Answered

1. **Publishing:** ✅ Done - published to npm
2. **128k Context:** ✅ Decided - use full context, read changed + imported files
3. **Vector DB:** ✅ Decided - Phase 2, not now
4. **Context Source:** ✅ Decided - Confluence first, then feedback loop
5. **Scope:** ✅ Decided - Junior dev level for POC

## 📋 Key Decisions (April 22, 2026)

### Architecture Decision: Multi-Phase Context Gathering
**Problem:** Just reading git diff is insufficient - no architectural context

**Solution:** 5-phase context builder:
1. **Phase 1:** Parse git diff (the change)
2. **Phase 2:** Read imports + callers (immediate context)
3. **Phase 3:** Find similar files by directory + naming (architectural patterns)
4. **Phase 4:** Grep for duplicates (DRY violations)
5. **Phase 5:** LLM review with full context

**Total budget:** 15-20 files, ~15k tokens (manageable)

---

### Context Priority System
**Priority order for 15-file budget:**
1. **Changed files** (must include all)
2. **Direct imports & callers** (understand relationships)
3. **Similar architectural files** (learn patterns)
4. **Duplicate evidence** (show examples)

---

### Tier 3 Context Strategy
**How to find similar files:**
- ✅ **Imports** - Parse import statements
- ✅ **Naming conventions** - `*.service.ts`, `*.controller.ts`
- ✅ **Parent directory** - Go up one level, look at siblings
- ❌ **Same directory** - Often not useful (too narrow)

**Implementation:**
```typescript
// Changed: src/adaption/content-area/endpoint.ts
// Search:
- src/adaption/*/endpoint.ts (sibling endpoints)
- src/adaption/**/*.service.ts (related services)
- Parent: src/adaption/* (other implementations)
```

---

### Duplicate Detection Strategy
**For POC: Grep-based search**
- Regex patterns (email validation, phone formats)
- Function name similarity (validate*, check*, verify*)
- Logic patterns (loops, conditionals, try/catch)

**Future: Vector DB (if grep proves insufficient)**
- Semantic search for conceptual duplicates
- LanceDB for local embeddings
- Decision: Prove value with grep first

---

### Alternative Suggestions Strategy
**How agent learns patterns:**
1. **From codebase** (primary) - Read similar files
2. **From skills/** (secondary) - User-provided guidelines
3. **From .reviewrc** (optional) - Explicit examples

**Example:**
```
Changed: new validateEmail() function
Context: Read other adaption endpoints
Suggestion: "Consider following pattern from print-area/endpoint.ts
which uses shared validation utility at src/utils/validators.ts"
```

---

### Output Format & Severity
**Research-based taxonomy:**
- 🔴 **BLOCKER** - Security, data loss, production risks
- 🟡 **OPTIMIZATION** - Performance, scalability, reliability
- 🔵 **MENTORSHIP** - DRY, SOLID, architectural improvements
- ✅ **POSITIVE** - Recognition of good practices
- ⚪ **NITPICK** - Optional suggestions

**What to focus on:**
1. DRY violations (conceptual duplicates)
2. Not following existing patterns
3. Security (OWASP top 10)
4. Performance issues
5. Missing error handling

**What to IGNORE:**
- Formatting (linters handle)
- Personal style preferences
- Documentation (unless critical)
- Variable naming (unless confusing)

### Success Bar
**Junior Developer Level** (achievable in 1 day):
- Catches obvious bugs
- Spots security issues
- Notices duplicates
- Checks error handling
- Verifies test coverage

**Not required yet:**
- Product knowledge
- Business logic
- UI/UX testing
- Strategic architecture

---

## To Resume Development

### When you restart after software update:

```bash
# 1. Navigate to project
cd /Users/raghavkumarr/Desktop/coding/localMRagent

# 2. Start Claude Code CLI
claude

# 3. Say something like:
"I'm back! Let's continue improving the MR review agent.
I've read PROJECT_STATUS.md. Let's discuss using the
full 128k context and publishing to npm."
```

**Your entire conversation history will be preserved!**

---

## Current State Summary

**What works:** Everything in POC scope
**What's next:** Improvements + Publishing
**Blocker:** None - ready to enhance
**Time invested:** ~3 hours (planning + building)
**Time to publish:** ~30 min
**Time for improvements:** Variable based on features

---

## Quick Commands Reference

```bash
# Development
npm run build          # Compile TypeScript
npm run dev           # Run without building
npm run review        # Test locally

# Testing
mr-review             # Global command
mr-review --help      # See options

# Git
git status            # Check changes
git add -A && git commit -m "msg"

# Ollama
ollama list           # See installed models
ollama pull MODEL     # Download model
ollama serve          # Start Ollama server
```

---

**Resume Point:** 1-day sprint to make POC impressive (see DISCUSSION_LOG.md for full context)

---

## 🎯 Implementation Plan (Next Steps)

### Step 1: Create Context Gathering Engine
**New file:** `src/context/ContextBuilder.ts`

**Components to build:**
```typescript
class ContextBuilder {
  // Phase 1: Parse changes
  async parseChanges(diff: GitDiff): Promise<ChangeContext>

  // Phase 2: Gather imports
  async gatherImportContext(changedFiles: string[]): Promise<string[]>

  // Phase 3: Find architectural patterns
  async findSimilarFiles(changedFiles: string[]): Promise<string[]>

  // Phase 4: Search duplicates
  async searchDuplicates(changedFiles: string[]): Promise<DuplicateEvidence[]>

  // Phase 5: Build final context
  async buildContextBundle(files: string[], maxFiles: 15): Promise<ContextBundle>
}
```

---

### Step 2: Implement Import Parser
**New file:** `src/context/ImportParser.ts`

**What it does:**
- Parse TypeScript/JavaScript imports
- Extract file paths from import statements
- Resolve relative paths
- Find reverse dependencies (grep for imports of this file)

**Example:**
```typescript
// Input: src/services/auth.service.ts
import { User } from '../models/user.model';
import { jwt } from '../utils/jwt.util';

// Output: ['src/models/user.model.ts', 'src/utils/jwt.util.ts']
```

---

### Step 3: Implement Pattern Finder
**New file:** `src/context/PatternFinder.ts`

**What it does:**
- Find files in parent directory
- Glob for similar naming patterns
- Match by file type (*.service.ts, *.controller.ts)

**Example:**
```typescript
// Input: src/adaption/content-area/endpoint.ts
// Searches:
1. Glob: src/adaption/*/endpoint.ts
2. Glob: src/adaption/**/*.service.ts
3. ReadDir: src/adaption/*
```

---

### Step 4: Implement Duplicate Searcher
**New file:** `src/context/DuplicateSearcher.ts`

**What it does:**
- Extract patterns from changed code (regex, function signatures)
- Grep codebase for similar patterns
- Return evidence with file:line references

**Example:**
```typescript
// Detects: Email validation regex
// Searches: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
// Returns: [
//   { file: 'auth.ts', line: 45, snippet: '...' },
//   { file: 'profile.ts', line: 89, snippet: '...' }
// ]
```

---

### Step 5: Update PromptBuilder
**File:** `src/agent/PromptBuilder.ts`

**Changes:**
- Accept `ContextBundle` instead of just diff
- Include import context in prompt
- Include architectural examples
- Include duplicate evidence
- Update severity system

**New prompt structure:**
```markdown
## Changed Files
[Git diff]

## Import Context
[Files imported by changes + files that import changes]

## Architectural Patterns
[Similar files in codebase - learn from these]

## Potential Duplicates Found
[Evidence of similar code - check for DRY violations]

## Review Guidelines
[Updated severity system]
```

---

### Step 6: Fix Truncation Logic
**Current issue:** OOM with 9+ files

**Solution:**
- Smart truncation per phase priority
- Changed files: 500 lines each
- Import context: 300 lines each
- Pattern files: 200 lines each (just need examples)
- Duplicate evidence: Snippets only (50 lines)

**Total budget calculation:**
```
3 changed files × 500 = 1,500 lines
6 import files × 300 = 1,800 lines
4 pattern files × 200 = 800 lines
2 duplicate evidence × 50 = 100 lines
─────────────────────────────────
Total: ~4,200 lines (~12k tokens) ✅
```

---

## 🧪 Testing Strategy

### Test 1: Small MR (3 files)
- Should gather ~12 files total
- Should find imports
- Should find architectural patterns
- Should complete in <2 min

### Test 2: Medium MR (9 files)
- Should prioritize correctly
- Should stay within 15-file budget
- Should not crash (OOM)
- Should complete in <3 min

### Test 3: Duplicate Detection
- Create test with intentional duplicate
- Should detect via grep
- Should suggest refactoring
- Should provide evidence with file:line

---

## ✅ Success Criteria (POC)

### Functional Requirements
- [ ] Reads git diff + changed files
- [ ] Gathers import context (Phase 2)
- [ ] Finds similar architectural files (Phase 3)
- [ ] Searches for duplicates (Phase 4)
- [ ] Stays within 15-file budget
- [ ] Uses priority system correctly

### Quality Requirements
- [ ] Catches 2-3 real issues in test MR
- [ ] Suggests patterns from existing code
- [ ] Detects at least 1 duplicate (if exists)
- [ ] Uses severity labels appropriately
- [ ] No false positives on basic review
- [ ] Execution time <2 minutes

### Output Requirements
- [ ] Clear severity categories
- [ ] File:line references for all findings
- [ ] Actionable suggestions (not vague)
- [ ] Shows similar code examples
- [ ] Positive recognition included

**If all criteria met → Continue to future enhancements**
**If not → Debug and iterate**
