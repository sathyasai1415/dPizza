# CLAUDE.md — MiSlice AI Workflow

This file tells Claude Code how to help build MiSlice. Use this before any coding session.

---

## Project Overview

**MiSlice** — Pizza price comparison webapp. Users compare pizzas across pizzerias in real-time. Pizzeria owners get visibility, users get better deals.

**Tech stack:**
- Frontend: Angular 22 (standalone components, signals) + Tailwind CSS
- Backend: Spring Boot 3.3 + Java 21 + PostgreSQL
- Auth: Firebase (Email/Google)
- Payments: Stripe
- Maps: Leaflet
- Status: UI done, mobile redesign needed

**Current pain:** UI is cluttered on mobile. Need mobile-first redesign + faster workflow.

---

## How to Work With This Repo

### Before Coding
1. Read this file
2. Understand the problem (not just the task)
3. Check `/DESIGN.md` for design decisions
4. If starting something new, run `/office-hours` first

### Code Quality Standards
- All changes must pass `/review` before shipping
- Security audit (`/cso`) for any auth/payment changes
- Mobile-first design (test on phone, not desktop first)
- Tailwind classes only (no custom CSS unless DESIGN.md approves)

### Testing
- Angular tests: `npm test` (frontend)
- Must pass before `/ship`
- New features = new tests (no exceptions)

---

## gstack Skills

Install gstack: `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`

**Use these skills in this order:**

### 1. Planning (Before you code)
- `/office-hours` — Reframe the problem. Six forcing questions.
  - Use this when starting: mobile redesign, new dashboard, new flow
  - Saves design doc that feeds into next steps
  
- `/autoplan` — Turn vague idea into executable spec
  - Runs `/plan-ceo-review` + `/plan-design-review` + `/plan-eng-review` automatically
  - Outputs: design decisions, architecture, test plan

### 2. Design (For mobile UI work)
- `/plan-design-review` — Audit design before building
  - Run this on the design doc from `/office-hours`
  - Checks: colors, spacing, readability, mobile-first

- `/design-shotgun` — Generate 4-6 mobile layout variants
  - Use this to explore options visually
  - You pick the best one
  - Takes ~2-5 min per variant

- `/design-html` — Turn approved design into production code
  - Outputs: Tailwind-based Angular components
  - Shippable HTML/CSS (not a demo)

### 3. Building
- No code changes without design-first pass
- If you "vibe code" → run `/design-review` after to audit what you built

### 4. Review (Before shipping)
- `/review` — Code quality + bug detection
  - Auto-fixes obvious issues
  - Flags edge cases

- `/cso` — Security audit
  - Run this if you touch: auth, payments, user data
  - OWASP Top 10 + STRIDE threat model

- `/qa` — Real browser testing
  - Test user flows, edge cases
  - Finds bugs `/review` misses
  - Mobile: test on actual phone (via phone browser or Chrome mobile emulation)

### 5. Ship
- `/ship` — Sync, test, push, open PR
  - Runs all tests
  - Coverage audit
  - Opens PR on GitHub

---

## Quick Reference: Your Typical Day

### Scenario 1: "I want to redesign the pizzeria dashboard for mobile"
```
1. Run /office-hours
   → Describes pain, constraints, success metrics
   → Outputs design doc

2. Run /autoplan
   → Reviews doc, generates design options
   → Outputs design decisions + test plan

3. Run /design-shotgun
   → See 4-6 dashboard layouts side-by-side
   → Pick favorite

4. Run /design-html
   → Code → production Angular components

5. Implement backend changes (if needed)

6. Run /review + /cso
   → Catch bugs + security issues

7. Run /qa
   → Test flows on phone

8. Run /ship
   → Tests, coverage, PR
```

### Scenario 2: "I found a bug in user search"
```
1. Run /investigate
   → Traces root cause
   → Suggests fix

2. Run /review
   → Tests fix + regression tests

3. Run /ship
```

### Scenario 3: "I don't know where to start"
```
1. Run /office-hours
   → Forces you to ask: What problem am I solving?
   → Output: Design doc
   
2. Everything else follows from that
```

---

## File Structure

```
/Applications/MISLICE/dPizza/
├── CLAUDE.md                 (this file)
├── DESIGN.md                 (design system + decisions)
├── WORKFLOW.md               (task tracking + process)
├── README.md
├── backend/
│   ├── pom.xml
│   ├── src/main/java/...
│   └── src/main/resources/db/migration/
├── frontend/
│   ├── package.json
│   ├── src/app/
│   │   ├── features/            (user pages)
│   │   ├── shared/              (reusable components)
│   │   ├── services/            (API calls)
│   │   └── app.component.ts
│   └── tailwind.config.ts
└── .claude/                  (Claude Code config)
```

---

## Key Constraints

1. **Mobile-first always** — desktop will work if mobile works
2. **No custom CSS** — Tailwind only (unless documented in DESIGN.md)
3. **Test on actual phone** — emulation lies sometimes
4. **Firebase is source of truth for auth** — don't duplicate user data
5. **Stripe integration** — PCI compliance required (no sensitive data in frontend)

---

## Running Locally

```bash
# Terminal 1: Backend
cd backend
JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./mvnw spring-boot:run

# Terminal 2: Frontend
cd frontend
npm install
npm start

# Terminal 3: Claude Code
# Any of your gstack skills
/office-hours
/design-shotgun
/qa https://localhost:4200
```

---

## Success Metrics

Track these to know if the workflow is working:

1. **Speed:** How many features shipped per week?
2. **Quality:** Bugs found in prod (should trend to zero)
3. **Mobile:** Does it look good on phone? (ask real users)
4. **Design:** Are design docs keeping up with code?

---

## Questions?

Run `/office-hours` — that's where confusion gets resolved.

Everything else follows from clear thinking about the problem.
