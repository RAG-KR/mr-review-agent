# MR Review Agent - Deep Dive Discussion

**Date:** April 21, 2026
**Status:** Published to npm, now defining what makes this truly valuable

---

## 📊 Current State

### What's Built ✅
- **Working POC:** Reviews git diffs using Ollama (Gemma 4:26b)
- **Published:** `npm install -g mr-review-agent` (v0.1.0)
- **GitHub:** https://github.com/RAG-KR/mr-review-agent
- **Speed:** 60-90 seconds per review
- **Output:** REVIEW.md with security, quality, and recommendation findings

### What It Actually Does
```bash
cd /any/git/repo
mr-review
# → Generates REVIEW.md with AI review
```

**Catches:**
- Security issues (SQL injection, hardcoded secrets, XSS)
- Code quality (DRY violations, magic numbers)
- Gives actionable recommendations

---

## 🚨 Critical Problems Identified

### Problem 1: No Codebase Context
**Current behavior:**
- Only sees changed lines in git diff
- No understanding of full codebase
- Can't detect duplicate functions/interfaces with different names
- Misses architectural patterns

**Example of what it misses:**
```typescript
// Existing in auth.ts
function validateUserCredentials(email, password) { ... }

// Existing in profile.ts
function checkUserLogin(username, pwd) { ... }

// Your MR adds in settings.ts
function verifyUserAuth(mail, pass) { ... }

// Agent sees ONLY the new function → misses the duplication!
```

### Problem 2: Static Analysis Only
**What it can't do:**
- Can't catch runtime bugs
- Can't test UI functionality
- Can't verify logic errors that require execution
- No understanding of user flows

**Reality check:** Even if code looks clean, it might still break in production.

### Problem 3: Zero Domain/Product Context
**What human reviewers have that AI doesn't:**
- Meeting discussions and decisions
- Product feature understanding
- Company-specific patterns
- Past architecture decisions
- "Why we did it this way" knowledge

A fresh engineer gets this from:
- Onboarding docs
- Meeting notes
- Confluence/wiki pages
- Talking to team members

**The AI has none of this.**

---

## 💡 Solutions Discussed

### Solution 1: Vector Database for Semantic Search

**How Cursor/Copilot work:**
1. Convert every function/class to vector embeddings
2. Embeddings capture semantic meaning
3. Query for similar code when reviewing
4. Find duplicates even with different names

**Recommended: LanceDB**
- Local, no remote hosting
- TypeScript native
- ~50-500MB storage depending on codebase size
- Fast semantic search

**What this enables:**
```typescript
// When reviewing new code:
1. Get embedding of new function
2. Query: "Find semantically similar code"
3. Returns: All 3 similar functions across codebase
4. AI says: "⚠️ Similar logic exists in auth.ts - consider refactoring"
```

**Value:** Catches 20-30% duplicate code that exists in most codebases

### Solution 2: Multi-Pass Review with Context

Instead of one-shot review:

**Pass 1: Build Context**
- Read changed files
- Read files imported by changed files
- Read files that import changed files
- Build 10-20 file context window

**Pass 2: Deep Review**
- LLM sees: diff + full related files + architecture
- Can detect issues in context
- Suggests architectural improvements

**Pro:** Uses existing 128k context window (we're only using 8k!)
**Con:** Limited to immediate file neighbors

### Solution 3: Context Enrichment Options

#### Option A: MCP + Confluence Integration
```typescript
// Connect to company wiki/docs
const context = await mcp.confluence.search("feature-name");
// AI now understands product context
```

**Pros:**
- Uses existing documentation
- MCP servers already exist
- Team already documents there

**Cons:**
- Requires API access
- Docs might be outdated

#### Option B: Learning Feedback Loop
After each review, team can add context:

```markdown
## 🤔 Missing Context (teach the AI):
- This feature is part of the new auth redesign
- We decided to use JWT because of X
- Performance is critical here (10k+ users)
```

Store in `.mr-review/learnings.json`
Next reviews include accumulated knowledge!

**Pros:**
- Builds institutional knowledge
- Gets better over time
- Team-specific

**Cons:**
- Requires team buy-in
- Takes time to accumulate

#### Option C: Meeting Notes Integration
Parse Gmail summaries of meetings (Google AI already does this)

**Pros:** Captures real discussions
**Cons:** Privacy concerns, hard to structure, might be noisy

### Solution 4: Testing Integration

**Level 1: Static Analysis**
- Run TypeScript compiler (`tsc --noEmit`)
- Run ESLint with strict rules
- Include results in review

**Level 2: Test Execution**
- Run existing test suite (`npm test`)
- Report failures related to MR changes
- Check test coverage

**Level 3: AI-Generated Tests** (Advanced)
- LLM generates test cases for changed code
- Execute tests
- Report potential bugs

---

## 🎯 The Big Question: What Makes This Impressive?

### What's NOT Impressive (Just Another Vibecode App)
- ❌ Simple git diff → LLM → markdown output
- ❌ Generic "looks good" comments
- ❌ Catches only obvious issues a linter could find
- ❌ No better than running ESLint + manual review
- ❌ Team ignores it after 2 weeks

### What IS Impressive (Worth Building)
- ✅ **Catches issues humans miss** - duplicate code, subtle bugs
- ✅ **Understands architecture** - not just line-by-line review
- ✅ **Has context** - knows product, past decisions, team patterns
- ✅ **Saves real time** - team trusts it, uses it daily
- ✅ **Gets better** - learns from feedback, improves over time
- ✅ **Production ready** - fast, reliable, low maintenance

### The Bar: "Would I Trust This Over a Junior Developer?"

If a junior dev reviewed the MR, they would:
- Read the full context (not just diff)
- Ask questions about unclear logic
- Check for similar code in the codebase
- Consider the product impact
- Verify tests exist
- Think about edge cases

**Can your agent do this?** If not, it's not impressive.

---

## 🔥 Three-Phase Roadmap

### Phase 1: Solid POC (Week 1)
**Goal:** Make it actually useful, not just a demo

**Must have:**
1. ✅ Use full 128k context (not 8k truncation)
2. ✅ Read changed files + imports (multi-file context)
3. ✅ Run TypeScript/ESLint, include results
4. ✅ Improved prompts (focus on architecture, not just style)
5. ✅ Actionable feedback (not generic comments)

**Success metric:**
- Catches 3-5 real issues in actual MR
- Team says "this is actually helpful"
- Better than just running linters

### Phase 2: Semantic Understanding (Week 2)
**Goal:** Detect duplicate code and patterns

**Add:**
1. ✅ LanceDB for local vector embeddings
2. ✅ Index codebase (one-time setup)
3. ✅ Semantic search for similar code
4. ✅ Detect duplicate logic with different names

**Success metric:**
- Finds duplicate code team didn't know existed
- Suggests refactoring to existing utilities
- Prevents code bloat

### Phase 3: Context Layer (Week 3-4)
**Goal:** Understand product and team context

**Add:**
1. ✅ MCP + Confluence integration
2. ✅ Feedback loop (team teaches AI)
3. ✅ Test execution and reporting

**Success metric:**
- Makes product-aware suggestions
- Understands "why" not just "what"
- Gets better with each review

---

## 🎪 The Real Test: Pilot with Team

**Run for 2 weeks with real team:**
1. Review every MR with agent
2. Humans review both AI output AND code
3. Track:
   - Issues AI caught that humans missed
   - Issues humans caught that AI missed
   - False positives (AI wrong)
   - Time saved

**Decision criteria:**
- If AI catches <50% of human issues → Not ready
- If AI catches 50-70% → Good POC, needs improvement
- If AI catches 70%+ → Ship it!

---

## 🤔 Open Questions

### Technical Decisions
1. **Vector DB now or later?**
   - Impact: High (duplicate detection)
   - Complexity: Medium (3-4 days)
   - Storage: ~100-500MB local

2. **Which context source first?**
   - Confluence (easy, existing docs)
   - Feedback loop (builds over time)
   - Meeting notes (complex, privacy concerns)

3. **How deep to go on testing?**
   - Just run existing tests? (easy)
   - Generate new tests? (hard)
   - UI testing? (very hard, maybe skip)

### Product Decisions
1. **What's the minimum to call this "impressive"?**
   - Must catch issues humans miss?
   - Must understand architecture?
   - Must have context awareness?

2. **What's the success criteria for POC?**
   - Team actually uses it?
   - Catches X% of issues?
   - Saves Y hours per week?

3. **When do we know it's worth continuing?**
   - After Phase 1?
   - After Phase 2?
   - After team pilot?

---

## 💭 Key Insights from Discussion

### On Context
> "Humans have context about the product, feature, company, and discussions. A fresher gets meeting summaries, docs, and talks to team. AI needs equivalent."

### On Domain Knowledge
> "Very specific domain knowledge can be added later. First, nail the basics that don't require it: DRY, SOLID, security, performance."

### On Vector DB
> "Want it local, not remotely hosted. But need to know: how much will this actually help?"

**Answer:** Vector DB helps with:
- Finding semantic duplicates (same logic, different names)
- Suggesting existing utilities to reuse
- Detecting similar patterns across codebase
- ~30% of codebase is typically duplicate logic

### On POC Scope
> "If implementation is good, follows clean code principles, minimal tradeoffs - that's sufficient for POC. Enrich later."

**This is the right approach.** Nail basics, then layer on complexity.

---

## 🎯 What "Basics" Actually Means

Not just "runs and outputs something," but:

### Level 1: Functional Basics ✅ (We have this)
- Reads git diff
- Sends to LLM
- Generates review
- Works on any repo

### Level 2: Quality Basics (Need this for impressive POC)
- Uses full model context (128k not 8k)
- Reads related files, not just diff
- Runs static analysis tools
- Gives specific, actionable feedback
- Fast enough (<2 min per review)
- Catches real issues (not just style)

### Level 3: Intelligence Basics (Phase 2)
- Understands codebase patterns
- Detects duplicates
- Suggests architectural improvements
- Learns from feedback

### Level 4: Human-Level Basics (Phase 3)
- Has product context
- Understands "why" not just "what"
- Considers edge cases
- Thinks about user impact

---

## 🚀 Next Session: Define "Impressive POC"

**Questions to answer:**
1. What specific issues must it catch to be valuable?
2. How fast must it be?
3. What's the minimum context needed?
4. Vector DB: Worth the complexity for POC?
5. Should we test on real MR before improving?

**Then build:** Whatever makes it cross from "toy" to "tool"

---

## 📝 Notes

- Published to npm successfully (after 2FA recovery code drama!)
- GitHub repo created and pushed
- Current version: 0.1.0
- Using only 8k of 128k context (huge opportunity)
- Team needs to see value quickly or this is dead

**The bar is high. Let's make it worth building.**

---

## ✅ Decisions Made (End of Session)

### 1. Output Format: Severity Labels
Reviews must categorize findings by severity:
- **🔴 CRITICAL:** Security vulnerabilities, data loss, breaking changes
- **🟡 POSSIBLE BUG:** Logic errors, edge cases, potential runtime issues
- **🔵 CODE QUALITY:** DRY violations, SOLID principles, architecture
- **⚪ NITPICK:** Style, minor improvements, personal preferences

**Example output:**
```markdown
## 🔴 CRITICAL
- **SQL Injection Risk** (auth.ts:45) - User input directly interpolated into query

## 🟡 POSSIBLE BUG
- **Unhandled Promise Rejection** (api.ts:123) - Async function missing error handler

## 🔵 CODE QUALITY
- **Duplicate Logic** (user.service.ts:67) - Similar validation exists in auth.service.ts

## ⚪ NITPICK
- **Magic Number** (config.ts:12) - Consider extracting 3600 to named constant
```

**Why this matters:**
- Reviewers can triage by severity
- Critical issues get immediate attention
- Nitpicks can be safely ignored under time pressure
- Builds trust (not everything is treated as urgent)

### 2. Clean Code Emphasis
Primary focus areas for POC:
1. **DRY (Don't Repeat Yourself)** - Detect duplicate code
2. **SOLID Principles** - Single responsibility, proper abstraction
3. **Security** - Common vulnerabilities (OWASP top 10)
4. **Error Handling** - Try/catch, null checks, edge cases
5. **Performance** - N+1 queries, unnecessary loops, inefficient algorithms

**Not focusing on (for now):**
- Formatting/style (leave to linters)
- Naming conventions (unless truly confusing)
- Comments/documentation (nice to have)

### 3. Roadmap Decision: 1-Day Sprint First
**Decision:** Improve POC to "impressive" level before adding vector DB

**1-Day Sprint Tasks (8 hours):**
- Hour 1-2: Use full 128k context, remove truncation
- Hour 3-4: Multi-file context (read imports)
- Hour 5-6: Rewrite prompts with severity labels
- Hour 7-8: Test on real MR, validate improvements

**Success criteria:**
- Catches 2-3 real issues humans would miss
- Makes 1-2 architectural observations
- Uses severity labels appropriately
- <2 min execution time

**If successful:** Continue to Phase 2 (vector DB)
**If not impressive:** Re-evaluate if this is worth building

### 4. Vector DB: Later, Not Now
**Decision:** Defer vector DB to Phase 2

**Reasoning:**
- Current improvements will get us 20% → 60% value
- Vector DB is 60% → 80% but takes 3-4 days
- Prove value first with quick wins
- Can always add semantic search later

**When to revisit:**
- After 1-day sprint shows promise
- When we see real cases of missed duplicates
- When committed to long-term development

### 5. Context Sources: Confluence First
**Decision:** When adding context (Phase 3), start with MCP + Confluence

**Priority order:**
1. **Confluence/Wiki** (Phase 3) - Existing docs, easy MCP integration
2. **Feedback Loop** (Phase 3) - Team teaches AI over time
3. **Meeting Notes** (Phase 4?) - Complex, privacy concerns, lower priority

**Rationale:**
- Most teams already document in Confluence
- MCP servers already exist
- Low friction integration
- Provides product/architecture context

### 6. Scope for "Impressive POC"
**Realistic bar: Junior Developer Level**

Must achieve:
- ✅ Catches obvious bugs and security issues
- ✅ Spots code duplication
- ✅ Notices missing error handling
- ✅ Checks for test coverage
- ✅ Follows language best practices

Does NOT need (yet):
- ❌ Deep product knowledge
- ❌ Business logic understanding
- ❌ Cross-team impact analysis
- ❌ UI/UX testing
- ❌ Strategic architectural decisions

**This is achievable with 1-day improvements.**

---

## 🗓️ Tomorrow's Session Plan

### Goals:
1. Execute 1-day sprint to improve POC
2. Test on real MR to validate improvements
3. Decide: continue or pivot based on results

### Before Coding:
- Review current prompt in `PromptBuilder.ts`
- Identify truncation code to remove
- Plan multi-file context implementation

### Success Looks Like:
- Test MR review shows 2-3 real findings
- Output uses severity labels
- Team member would actually trust this
- Execution time <2 minutes

### If Impressive:
- Plan Phase 2 (vector DB integration)
- Research LanceDB implementation
- Design codebase indexing strategy

### If Not Impressive:
- Discuss: What's missing?
- Is the problem solvable?
- Should we pivot to different approach?

**Tomorrow we'll know if this is worth building.**
