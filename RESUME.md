# 🔄 Resume: MR Review Agent

**Last Session:** April 22, 2026
**Status:** Architecture Redesigned - Multi-Phase Context Strategy

---

## 📅 Session Log

### April 22, 2026 - The Context Problem

#### 🎯 What We Accomplished Today

1. ✅ **Tested on real 9-file MR** - Hit OOM errors (Ollama crash)
2. ✅ **Debugged model exhaustion** - gemma4:26b ran out of memory
3. ✅ **Adjusted truncation** - Made limits more conservative
4. ✅ **CRITICAL INSIGHT:** Git diff approach is fundamentally insufficient
5. ✅ **Deep research** - Studied what makes quality code reviews
6. ✅ **Redesigned architecture** - Multi-phase context gathering
7. ✅ **Defined implementation plan** - Clear path to POC
8. ✅ **Updated documentation** - PROJECT_STATUS.md reflects new strategy

#### 🚨 The Fundamental Problem Discovered

**What we thought:**
> "Just need to increase context and add severity labels"

**What we learned:**
> "Git diff is like reviewing a book by only reading edited sentences - you miss the entire story"

**The research showed:**
- Human reviewers read related files, not just changes
- Junior devs check for similar implementations
- Good reviews suggest existing patterns
- Quality reviews detect conceptual duplicates
- Context comes from imports, architecture, and patterns

**Real example from test MR:**
```
Changed: src/adaption/content-area/endpoint.ts
AI sees: Just the new endpoint code
AI misses:
- How other adaptions work (print-area, image-area)
- What utilities already exist
- Similar validation code in 3 other files
- Patterns for error handling
```

---

### April 21, 2026 - Initial Sprint Planning

## 🎯 What We Accomplished

1. ✅ **Published to npm** as `mr-review-agent@0.1.0`
2. ✅ **Created GitHub repo** and pushed code
3. ✅ **Deep dive discussion** on what makes this impressive
4. ✅ **Defined clear roadmap** with 3 phases
5. ✅ **Decided on 1-day sprint** approach

**Package:** https://www.npmjs.com/package/mr-review-agent
**GitHub:** https://github.com/RAG-KR/mr-review-agent

---

## 🚨 The Core Problem (REDEFINED)

**Root cause identified: Architecture is fundamentally flawed**

### What's Wrong with Current Approach:
- ❌ **Only reads git diff** - No architectural context
- ❌ **Can't find similar implementations** - Doesn't look at rest of codebase
- ❌ **Can't detect conceptual duplicates** - Same logic, different names
- ❌ **No import-based context** - Doesn't understand dependencies
- ❌ **Can't suggest alternatives** - Doesn't know what already exists
- ❌ **Truncation too aggressive** - Causes OOM with 9+ files

### The Real Bar:
**"Can this review like a junior developer?"**

**What junior devs do:**
1. Read the full context (not just diff)
2. Check similar files in the codebase
3. Look for duplicate logic
4. Understand how imports/dependencies work
5. Suggest existing utilities to reuse
6. Learn patterns from existing code

**What our agent currently does:**
1. Read git diff ❌
2. That's it ❌

**Decision:** Need to redesign context gathering from scratch

---

## 🎪 NEW Architecture: Multi-Phase Context Gathering

### The 5-Phase Strategy

#### **Phase 1: Understand the Change** (Git Operations)
**What:** Parse git diff, commit messages, change type
**Output:** List of changed files, change classification (feat/fix/refactor)

#### **Phase 2: Build Immediate Context** (Import-Based) 🔍
**What:** Read files directly related to changes
**Strategy:**
- Parse imports from changed files
- Find files that import changed files (reverse deps)
- Read shared utilities

**Example:**
```
Changed: src/services/auth.service.ts
├─ Imports: src/models/user.model.ts ✅
├─ Imports: src/utils/jwt.util.ts ✅
└─ Imported by: src/controllers/auth.controller.ts ✅
```

**Priority:** HIGH (essential to understand change impact)
**Budget:** ~5-8 files

---

#### **Phase 3: Find Architectural Patterns** (Directory + Naming) 🏗️
**What:** Find similar implementations in codebase
**Strategy:**
- Search parent directory for sibling files
- Glob for similar naming patterns (*.service.ts)
- Find other implementations in same area

**Example:**
```
Changed: src/adaption/content-area/endpoint.ts
Search:
├─ src/adaption/*/endpoint.ts (other endpoints)
├─ src/adaption/**/*.service.ts (related services)
└─ src/adaption/* (sibling implementations)
```

**Priority:** MEDIUM (learn existing patterns)
**Budget:** ~3-5 files

---

#### **Phase 4: Search Conceptual Duplicates** (Grep-Based) 🔎
**What:** Find DRY violations via pattern matching
**Strategy:**
- Extract regex patterns (email, phone, dates)
- Search for similar function names
- Find repeated validation logic

**Example:**
```typescript
// New code:
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Grep finds:
- auth.ts:45: Similar regex
- profile.ts:89: Different name, same logic
- settings.ts:123: Another variant

// Review: "🔵 Email validation exists in 3 places - refactor"
```

**Priority:** MEDIUM-LOW (important but not blocking)
**Budget:** ~2-3 instances (evidence only)

---

#### **Phase 5: Generate Contextual Review** (LLM) 🤖
**What:** Review with full context bundle
**Context includes:**
- Git diff (what changed)
- Changed files (full content)
- Import context (Phase 2)
- Architectural examples (Phase 3)
- Duplicate evidence (Phase 4)

**Total:** ~15-20 files, ~15k tokens

**LLM can now:**
- ✅ Compare to existing patterns
- ✅ Suggest: "Use pattern from X.ts"
- ✅ Warn: "Similar code in Y.ts"
- ✅ Validate: "Follows project conventions"

---

### Context Priority System (15-File Budget)

```
Priority 1 (MUST): Changed files (all)
Priority 2 (HIGH): Imports + callers (~6 files)
Priority 3 (MEDIUM): Architectural patterns (~4 files)
Priority 4 (LOW): Duplicate evidence (~2 files)
────────────────────────────────────
Total: ~15 files
```

---

### Improved Severity Taxonomy (Research-Based)

```markdown
🔴 BLOCKER (Must Fix)
- Security: SQL injection, XSS, secrets, auth bypass
- Data loss: Breaking changes, corruption
- Production: Memory leaks, crashes

🟡 OPTIMIZATION (Should Fix)
- Performance: N+1, O(n²) algorithms
- Scalability: Resource leaks
- Reliability: Missing error handling

🔵 MENTORSHIP (Consider - Code Quality)
- DRY violations: Conceptual duplicates
- SOLID: Architecture, abstraction
- Patterns: Not following existing code
- Refactoring: Better approach exists

✅ POSITIVE (Recognition)
- Good tests, clean code, follows patterns

⚪ NITPICK (Optional)
- Naming, minor style, typos
```

**Focus areas:**
1. DRY violations (conceptual duplicates)
2. Not following existing patterns
3. Security (OWASP)
4. Performance issues
5. Missing error handling

**Ignore:**
- Formatting (linters handle)
- Style preferences
- Documentation (unless critical)

---

## ✅ Success Criteria

After 1-day sprint, it should:
- ✅ Catch 2-3 real issues humans would miss
- ✅ Make 1-2 architectural observations
- ✅ Use severity labels appropriately
- ✅ Execute in <2 minutes
- ✅ Low false positive rate

**If successful:** Continue to Phase 2 (vector DB)
**If not:** Re-evaluate if worth building

---

## 🗺️ Implementation Roadmap

### **Current Sprint: Multi-Phase Context (POC)**
**Goal:** Build intelligent context gathering

**What to build:**
1. ✅ ContextBuilder engine (5 phases)
2. ✅ ImportParser (Phase 2)
3. ✅ PatternFinder (Phase 3)
4. ✅ DuplicateSearcher (Phase 4)
5. ✅ Update PromptBuilder for new context
6. ✅ Smart truncation by priority

**Success criteria:**
- Gathers 15-20 files intelligently
- Finds similar implementations
- Detects duplicates via grep
- Suggests patterns from codebase
- Stays within token budget
- Completes in <2 min

---

### **Future Options (Post-POC)**

#### Option A: Vector DB Semantic Search (DEFERRED)
**Status:** Wait until grep-based duplicate detection proves insufficient

**What it would add:**
- Semantic code search (not just text matching)
- Find similar logic with different implementations
- Better "find all validation functions" queries

**Technology:**
- LanceDB (local, TypeScript)
- 50-500MB storage
- One-time indexing

**When to revisit:**
- After POC proves valuable
- When grep misses semantic duplicates
- When we need "concepts" not "keywords"

**Tradeoff:**
- **Pro:** Better semantic understanding
- **Con:** 3-4 days work, adds complexity
- **Decision:** Prove need first with grep

---

#### Option B: MCP + Confluence Integration (PHASE 3)
**Status:** After core review quality is proven

**What it would add:**
- Product context from wiki/docs
- Architecture decision records
- Business rules and requirements

**When to revisit:**
- After multi-phase context works
- When reviews lack product knowledge
- When team commits to long-term usage

---

#### Option C: Test Execution Integration (FUTURE)
**Status:** Not for POC

**What it would add:**
- Run TypeScript compiler
- Execute test suite
- Include results in review

**When to revisit:**
- After static analysis is solid
- When we need runtime validation

---

#### Option D: Learning Feedback Loop (INTERESTING)
**Status:** Consider for Phase 3

**What it would add:**
- Team teaches AI after reviews
- Builds institutional knowledge
- Gets better over time

**Implementation:**
- `.mr-review/learnings.json`
- Structured feedback mechanism
- Include in future prompts

**When to revisit:**
- After team is actively using tool
- As alternative to Confluence integration

---

## 📂 Key Files to Review Tomorrow

Before starting:
- `src/agent/PromptBuilder.ts` - Current prompts & truncation logic
- `src/git/GitOperations.ts` - Git diff reading
- `src/agent/ReviewAgent.ts` - Main orchestrator
- `.reviewrc` - Config (model settings)

---

## 💡 Key Insights & Decisions

### Critical Insight: Git Diff Is Insufficient
> "Git diff approach is like reviewing a book by only reading edited sentences - you miss the entire story."

**What this means:**
- Can't find similar implementations (no architectural context)
- Can't detect conceptual duplicates (different names, same logic)
- Can't suggest alternatives (doesn't know what exists)
- Can't understand relationships (no import context)

**Solution:** Multi-phase context gathering

---

### Decision: Tier 3 Context Strategy
**Question:** How to find similar files?

**Answers:**
1. ✅ **Imports** - Parse import statements (HIGH priority)
2. ✅ **Naming conventions** - `*.service.ts`, `*.controller.ts`
3. ✅ **Parent directory** - Go up one level, look at siblings
4. ❌ **Same directory** - Often too narrow, not useful

**Example:**
```
Changed: src/adaption/content-area/endpoint.ts
Search:
- Imports from changed file
- src/adaption/*/endpoint.ts (sibling endpoints)
- src/adaption/* (other implementations)
```

---

### Decision: Duplicate Detection via Grep (For Now)
**Question:** How to find DRY violations?

**Answer:** Pattern-based grep search
- Extract regex patterns (email, phone validation)
- Search for similar function names
- Find repeated logic blocks

**Future consideration:** Vector DB if grep proves insufficient

**Reasoning:**
- Grep is fast and simple
- Catches most common duplicates
- No storage overhead
- Prove need before adding complexity

---

### Decision: Alternative Suggestions from Codebase
**Question:** How does agent learn patterns?

**Priority order:**
1. **From codebase** (PRIMARY) - Read similar files in Phase 3
2. **From skills/** (SECONDARY) - User-provided guidelines
3. **From .reviewrc** (OPTIONAL) - Explicit examples

**Example:**
```
Agent reads: src/adaption/print-area/endpoint.ts
Learns: How other adaptions handle validation
Suggests: "Follow pattern from print-area - uses shared validator"
```

---

### Decision: 15-File Priority System
**Question:** How to prioritize within budget?

**Priority order:**
1. **Changed files** - Must include all (N files)
2. **Imports + callers** - Understand relationships (~6 files)
3. **Architectural patterns** - Learn conventions (~4 files)
4. **Duplicate evidence** - Show examples (~2 files)

**Total:** ~15-20 files, ~15k tokens

**Smart truncation:**
- Changed files: 500 lines each (most important)
- Import context: 300 lines each
- Pattern files: 200 lines each (just need examples)
- Evidence: 50 lines (snippets only)

---

### Decision: Vector DB Deferred
**Question:** Should we add vector DB now?

**Answer:** NO - Defer to post-POC

**Reasoning:**
- Grep-based approach should catch most duplicates
- 3-4 days of work
- Adds complexity and storage overhead
- Prove value with simpler approach first
- Can always add later if needed

**When to revisit:**
- After POC shows promise
- When grep misses semantic duplicates
- When we see clear benefit cases

---

### Research-Backed Severity System
**Based on:** Industry research on PR review best practices

**Categories:**
- 🔴 **BLOCKER** - Security, data loss, production risks (MUST FIX)
- 🟡 **OPTIMIZATION** - Performance, scalability (SHOULD FIX)
- 🔵 **MENTORSHIP** - Code quality, patterns (CONSIDER)
- ✅ **POSITIVE** - Recognition of good work
- ⚪ **NITPICK** - Optional suggestions

**Why this matters:**
- Helps reviewers triage by severity
- Critical issues get immediate attention
- Nitpicks can be safely ignored
- Builds trust (not everything is urgent)

---

## 🎯 Quick Start (Next Session)

```bash
# 1. Navigate to project
cd /Users/raghavkumarr/Desktop/coding/localMRagent

# 2. Start Claude Code
claude

# 3. Say:
"Let's implement the multi-phase context gathering system.
I've read PROJECT_STATUS.md and RESUME.md.
Let's start by creating the ContextBuilder engine."
```

### Implementation Order:

**Step 1:** Create core architecture
- `src/context/ContextBuilder.ts` - Main orchestrator
- `src/types.ts` - Add ContextBundle types

**Step 2:** Implement Phase 2 (Imports)
- `src/context/ImportParser.ts` - Parse imports
- Extract file paths, resolve relative paths
- Find reverse dependencies

**Step 3:** Implement Phase 3 (Patterns)
- `src/context/PatternFinder.ts` - Find similar files
- Glob by naming convention
- Search parent directory

**Step 4:** Implement Phase 4 (Duplicates)
- `src/context/DuplicateSearcher.ts` - Grep-based search
- Extract patterns from code
- Find similar logic

**Step 5:** Integration
- Update `ReviewAgent.ts` to use ContextBuilder
- Update `PromptBuilder.ts` for new context format
- Fix truncation logic with priority system

**Step 6:** Test
- Test on 3-file MR
- Test on 9-file MR (the one that crashed)
- Validate findings quality

---

## 🔍 Decision Framework

After sprint, evaluate:

### Continue if:
- ✅ Catches real issues (not just linter stuff)
- ✅ Makes architectural observations
- ✅ Someone says "this is actually useful"
- ✅ Fast enough to use regularly

### Pivot if:
- ❌ Still generic comments
- ❌ High false positives
- ❌ No better than ESLint
- ❌ Too slow (>2-3 minutes)

### Stop if:
- ❌ After improvements, still not impressive
- ❌ Can't reach "junior dev" quality level
- ❌ Team wouldn't trust it

---

## 📊 Current Stats

- **Version:** 0.1.0
- **Published:** April 21, 2026
- **Architecture:** Single-phase (git diff only) ❌
- **Context strategy:** Redesigned to multi-phase ✅
- **Last test:** 9-file MR caused OOM
- **Truncation:** 1000 diff lines, 250/file
- **Status:** Architecture designed, implementation pending

---

## 🎪 The Big Picture

**Why this matters:**
- Most code review tools are just linters
- Cursor/Copilot don't do MR reviews well
- Teams waste hours reviewing code
- Junior devs make same mistakes repeatedly

**What success looks like:**
- Team uses it on every MR
- Catches bugs before production
- Saves 2-3 hours per week per dev
- Builds team knowledge over time

**What failure looks like:**
- Team tries it once, ignores it
- Just another vibecode toy app
- Doesn't solve real problems
- Gets abandoned after a week

---

## 🚀 Next Session Goals

After implementing multi-phase context:
- ✅ Can we find similar implementations?
- ✅ Can we detect conceptual duplicates?
- ✅ Can we suggest patterns from codebase?
- ✅ Does it stay within budget (15 files)?
- ✅ Does it complete in <2 minutes?

**If yes to all → POC is valuable**
**If no → Iterate or pivot**

**The bar is high. But now we have a clear path.**

---

## 📚 Documentation Files

All context is captured in:
1. **DISCUSSION_LOG.md** - Full conversation & decisions
2. **PROJECT_STATUS.md** - Current state & next steps
3. **RESUME.md** - This file (session summary)
4. **MR_REVIEW_AGENT_PLAN.md** - Original plan
5. **README.md** - User documentation
6. **QUICKSTART.md** - 5-min setup guide

**Your conversation is auto-saved. Just run `claude` in this directory.**

---

## 📝 Summary of Key Decisions (April 22)

### ✅ Architecture Decisions
1. **Multi-phase context gathering** (5 phases)
2. **Priority system** for 15-file budget
3. **Grep-based duplicate detection** (vector DB deferred)
4. **Import + naming + directory** for Tier 3 context
5. **Learn from codebase** for alternative suggestions

### ✅ Implementation Decisions
1. Create **ContextBuilder** as main engine
2. Separate classes for each phase
3. Smart truncation by priority
4. Research-backed severity taxonomy

### ✅ Future Options Identified
1. **Vector DB** - Deferred, prove need with grep first
2. **Confluence/MCP** - Phase 3, after core works
3. **Test execution** - Future enhancement
4. **Learning loop** - Interesting, consider later

### ✅ What Changed from April 21
**Before:** "Just increase context and add labels"
**After:** "Need intelligent context gathering with architectural awareness"

**Impact:** Complete redesign of context strategy

---

**Next Session:** Implement multi-phase context system
**Goal:** Build POC that reviews like a junior developer
**Timeline:** Implementation sprint
**Decision Point:** Test on real MRs, validate approach

**Documentation is complete. Ready to build.** 🚀
