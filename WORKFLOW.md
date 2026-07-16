# WORKFLOW.md — MiSlice Build Process

This is how you ship features fast using gstack.

---

## The Sprint Loop (Repeat this)

### Phase 1: Think (15 min)
**Goal:** Reframe the problem, challenge assumptions

```bash
/office-hours
```

This asks 6 forcing questions:
- What's the actual pain? (not the feature request)
- Who benefits? (user, pizzeria owner, both?)
- Success metrics? (speed? price accuracy? volume?)
- Constraints? (time, money, technical)
- What could go wrong?
- Implementation approaches? (3 options, effort estimates)

**Output:** Design doc that feeds into everything else

---

### Phase 2: Plan (10-30 min)
**Goal:** Get design + architecture right before coding

```bash
/autoplan
```

This automatically runs:
1. `/plan-ceo-review` — Scope? Too much? Too little?
2. `/plan-design-review` — Does the design work? Mobile-first?
3. `/plan-eng-review` — Architecture sound? Tests clear?

**Output:** Approved plan, test cases, design mockups

---

### Phase 3: Design (5-15 min for mobile work)
**Goal:** See options, pick one, move fast

```bash
/design-shotgun
```

See 4-6 layout variants side-by-side. You pick the best. Repeat if you want to tweak.

**Then:**
```bash
/design-html
```

Turns your approved design into production Angular components. No mockups to code translation — it outputs actual Tailwind + TypeScript.

---

### Phase 4: Build (depends on scope)
**Goal:** Code what the design said, nothing more

**Rules:**
- Don't "vibe code" — follow the design
- Every feature needs a test
- If you get stuck: `/investigate` (root cause, not guessing)

**Backend changes?** Follow Spring Boot patterns in existing code

**Frontend changes?** Use Angular signals, standalone components (existing pattern)

---

### Phase 5: Review (5-10 min)
**Goal:** Catch bugs before shipping

```bash
/review
```

Auto-fixes obvious issues. Flags edge cases. You verify the fixes.

**If you touched auth or payments:**
```bash
/cso
```

Security audit. OWASP Top 10 + STRIDE threat model.

---

### Phase 6: Test (5-30 min, depends on scope)
**Goal:** Real browser testing, edge cases

```bash
/qa https://localhost:4200
```

Claude opens your actual app in a browser, tests the flow you built, finds edge cases, fixes bugs with regression tests.

**Mobile testing:** Test on actual phone or Chrome mobile emulation

---

### Phase 7: Ship (2 min)
**Goal:** Push, verify tests pass, open PR

```bash
/ship
```

- Syncs main branch
- Runs all tests
- Audits test coverage
- Pushes branch
- Opens PR on GitHub

---

## Task Tracking

Use this format to track what you're working on. Update daily.

### Current Sprint

**Goal:** Mobile-first redesign for user home + pizza comparison

| Task | Status | Notes |
|------|--------|-------|
| Run `/office-hours` on mobile redesign | ⏳ todo | Scheduled for today |
| Run `/design-shotgun` (explore layouts) | ⏳ todo | 4-6 variants, pick favorite |
| Run `/design-html` (build from design) | ⏳ todo | Output: Angular components |
| Backend: Ensure API is mobile-ready | ⏳ todo | Check response sizes, load times |
| Run `/review` (code quality) | ⏳ todo | Catch bugs |
| Run `/qa` (mobile testing) | ⏳ todo | Test on actual phone |
| Run `/ship` (push to GitHub) | ⏳ todo | Open PR |

**Status legend:**
- ⏳ `todo` — Not started
- 🔄 `in_progress` — Currently working
- ✅ `done` — Completed
- ⏸️ `blocked` — Waiting on something

---

## Weekly Metrics

Track these to see if you're getting faster:

| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| Features shipped / week | 2-3 | — | — |
| Bugs found in prod / week | 0-1 | — | — |
| Design → Ship time | <2 hours | — | — |
| Mobile responsiveness | 100% | — | — |
| Test coverage | 80%+ | — | — |

---

## Blockers & Help

**Stuck on design?** Run `/design-consultation` for a design partner brainstorm

**Stuck on architecture?** Run `/plan-eng-review` to audit current design

**Stuck on a bug?** Run `/investigate` (systematic root cause, not guessing)

**Don't know what to do next?** Run `/office-hours` (reframe the problem)

---

## Communication with Claude

When you ask Claude to help:

### ❌ DON'T say:
- "Build me a pizzeria dashboard"
- "Make it work on mobile"
- "Fix the UI"

### ✅ DO say:
- "Run `/office-hours` — I want to redesign the pizzeria dashboard for mobile"
- "Run `/design-shotgun` — show me 4-6 layout options for the dashboard"
- "Run `/qa https://localhost:4200` — test the new dashboard flow on mobile"

**Why?** The skill name tells Claude which methodology to use. Generic requests skip the structure.

---

## Daily Workflow Example

**Monday morning:**
```
1. Run /office-hours (reframe: what are we solving?)
   → Output: design doc

2. Run /autoplan (plan everything)
   → Output: approved design + test plan

3. Sketch in `/design-shotgun` (see options)
   → Pick favorite

4. Rest of week: Implement, review, test, ship
```

**Each day:**
```
1. Pick a task from "Current Sprint" table
2. Run the appropriate gstack skill
3. Update the table (⏳ → 🔄 or ✅)
4. Track time (helps you see if you're getting faster)
```

---

## FAQ

**Q: What if the design doesn't work after I build it?**
A: Run `/design-review` (live audit). If it's broken, `/design-shotgun` again and rebuild. This is normal. Way faster than redoing code.

**Q: What if I break something?**
A: `/ship` runs tests first. If tests break, you fix before pushing. If prod breaks, `/investigate` finds root cause.

**Q: How do I know if I'm going fast enough?**
A: Track features/week. First week = slower (learning). Week 2+ = you'll see acceleration as gstack gets smarter about your codebase.

**Q: Can I "vibe code"?**
A: Sure, but then run `/design-review` after. It audits what you vibe'd and catches issues early. Better than finding bugs in prod.

**Q: What if I don't have time for `/office-hours`?**
A: Skip it for bug fixes. Use it for new features or redesigns. It saves time by preventing wrong direction early.

---

## Next: Start Here

1. **Today:** Read CLAUDE.md + this file
2. **Tomorrow:** Run `/office-hours` on the mobile redesign
3. **This week:** `/design-shotgun` → `/design-html` → `/review` → `/qa` → `/ship`
4. **Track:** Update the "Current Sprint" table daily

---

**Last updated:** 2026-07-16
