# DESIGN.md — MiSlice Design System

This document captures design decisions, principles, and the system that keeps designs consistent across MiSlice.

---

## Design Principles

1. **Mobile-first** — Design for phone first, desktop scales naturally
2. **Clarity over cleverness** — Users should understand instantly what they can do
3. **One-tap actions** — Pizza comparison, add to cart, checkout should be 2-3 taps max
4. **Trust through data** — Show real prices, real pizzeria names, real menus (no fake data)
5. **Speed** — Load times under 2 seconds on 3G

---

## Current State (Before Redesign)

**Problems identified:**
- Cluttered desktop layout (too much info at once)
- Not mobile-responsive
- Navigation unclear (what can I do on this screen?)
- Pizzeria dashboard is too dense
- Price comparison display is confusing

**To be redesigned:**
- [ ] User home (search + map + filter)
- [ ] Pizza comparison view (side-by-side pricing)
- [ ] Pizzeria detail page
- [ ] Pizzeria owner dashboard
- [ ] Checkout flow
- [ ] Mobile navigation (bottom nav? side drawer?)

---

## Color Palette

**Primary:** Dark purple/gold theme (from recent commits)
- Primary dark: `#1a1a1a` or brand color (TBD)
- Accent gold: `#D4AF37` (from profile component)
- Burgundy (favorites): `#7B1B38` (from favorites)

**Semantics:**
- Success: `#10B981` (green, for "order placed")
- Warning: `#F59E0B` (orange, for "high price alert")
- Error: `#EF4444` (red, for errors)
- Neutral: Tailwind gray scale

**Text:**
- On dark: White for contrast
- On light: Dark gray `#1F2937`

---

## Typography

**Font stack:** TBD (check Tailwind config)

**Hierarchy:**
- Heading 1 (XL prices): `text-4xl font-bold`
- Heading 2 (Pizzeria names): `text-2xl font-semibold`
- Body (descriptions): `text-base font-normal`
- Small (metadata): `text-sm text-gray-500`

---

## Components (Tailwind-based)

### Cards
- Pizzeria card: Name, rating, distance, average price
- Pizza card: Image, name, size, price, pizzeria
- Dashboard stat card: Metric + trend

### Buttons
- Primary (CTA): Full width on mobile, `bg-primary text-white rounded-lg`
- Secondary (cancel): Outline style
- Small (filters): Pill-shaped, `rounded-full`

### Forms
- Input: Full width, padding `p-3`, rounded `rounded-lg`
- Labels: Bold, `font-semibold`
- Validation: Red error text below input

### Navigation
- Mobile: Bottom navigation or side drawer (TBD by `/design-shotgun`)
- Desktop: Top nav + sidebar

### Modals
- Full screen on mobile
- Centered, 80% width on desktop
- Animated slide-up on mobile

---

## Layout Grid

**Mobile (0-640px):**
- Single column
- Full bleed images
- Bottom nav for primary actions

**Tablet (641-1024px):**
- Two-column grid for comparison view
- Side nav becomes visible

**Desktop (1025px+):**
- Three-column grid
- Full sidebar navigation
- Expanded detail views

---

## Flows to Redesign (Priority Order)

### 1. User Home (Mobile Priority)
**Current:** Search box, map, filter buttons, pizzeria list below
**Problem:** Too crowded, hard to compare prices

**To determine in `/design-shotgun`:**
- Search bar position (top sticky? or inline?)
- Map size (full screen? half? hidden until needed?)
- Pizza list view (cards? table? tiles?)
- Filter UI (modal? inline chips?)

### 2. Pizza Comparison
**Current:** Side-by-side pizzeria cards
**Problem:** Doesn't scale to 5+ pizzerias, confusing layout

**To determine:**
- How to show 3-10 pizzerias for same pizza?
- Horizontal scroll? Sortable table? Carousel?
- Which columns matter most? (Price, rating, distance, delivery time?)

### 3. Pizzeria Owner Dashboard
**Current:** Metrics, orders, menu management (cluttered)
**Problem:** Too much info, hard to find actions

**To determine:**
- What's the primary action on this screen? (Check orders? Adjust prices?)
- Should it be mobile-friendly for phone orders?
- What metrics actually matter? (Revenue? Order count? Popular items?)

### 4. Checkout Flow
**Current:** TBD (need to see current implementation)
**Problem:** Not tested on mobile

**To determine:**
- Mobile-friendly Stripe integration
- Confirmation UX
- Order status tracking

---

## Design Audit Checklist

Before any screen ships, verify:

- [ ] Readable on phone (small text = no)
- [ ] Touch-friendly (buttons are 44px+ tall)
- [ ] Loading states shown (spinners, skeletons)
- [ ] Error states shown (red text + icon)
- [ ] Empty states shown (no results = tell user why)
- [ ] Keyboard navigation works (tab through form)
- [ ] Form has focus rings (accessibility)
- [ ] Contrast meets WCAG AA (text vs background)

---

## Tools

- **Design**: Figma (optional, `/design-shotgun` generates mockups)
- **Components**: Angular standalone components
- **Styling**: Tailwind CSS (config: `frontend/tailwind.config.ts`)
- **Testing**: Mobile browser (real phone or Chrome DevTools mobile mode)

---

## Next Steps

1. Run `/office-hours` to reframe the mobile redesign problem
2. Run `/design-shotgun` to see 4-6 layout options
3. Pick favorite option
4. Run `/design-html` to turn it into Angular components
5. Update this file with decisions

---

## Decisions Log

| Decision | Date | Rationale | Status |
|----------|------|-----------|--------|
| Mobile-first approach | 2026-07-16 | Solo builder, vibe coder — iterate on design before code | Active |
| Tailwind only (no custom CSS) | 2026-07-16 | Speed + consistency | Active |
| Dark purple/gold theme | (from recent commits) | Brand established in profile/orders components | Active |
| Angular signals for state | (existing stack) | Framework capability, better perf than RxJS alone | Active |

---

**Last updated:** 2026-07-16
**Updated by:** Setup (automated via Claude)
