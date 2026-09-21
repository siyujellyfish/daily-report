# Phase 6.7 — UI/UX refinement plan

## Status

First implementation slice approved on 2026-09-21. The user confirmed the recommended direction and explicitly requested the Phase 6.7 Preview be rebound to Neon `phase6-adaptive-isolated`.

Branch:

```text
phase6.7/ui-ux
```

## Objective

Refine the presentation introduced through Phases 2 and 6 so the site remains easy to scan when the number of categories grows, without changing the adaptive-category architecture.

Phase 6.7 should improve hierarchy, density, responsiveness and interaction polish rather than introduce new product features.

## Current surfaces to review

### Header and category navigation

Current structure:

```text
row 1: brand | home | theme
row 2: horizontally scrollable category rail
```

Review:

- visual weight of the two-row sticky Header;
- active-category visibility;
- long category labels;
- discoverability that the rail can scroll horizontally;
- mobile theme-control density;
- whether the rail needs subtle edge/fade affordances without hiding semantic links.

The category rail remains semantic navigation; it does not become an ARIA tab widget or hamburger-only menu.

### Homepage

Review:

- hero/intro vertical space;
- card density when 3–6 categories are present;
- consistency of card height and footer placement;
- summary/highlight length;
- visual hierarchy among category, date, title, summary and highlights;
- desktop 2/3-column rhythm versus readability;
- mobile one-column scan speed.

The homepage must still show the latest report for every published category.

### Category archive

Review:

- date/title hierarchy;
- row spacing and divider rhythm;
- summary line length;
- arrow/action clarity;
- pagination affordance on desktop and narrow screens.

Do not add search/filter controls unless a later content-volume requirement justifies them.

### Report detail

Review:

- title and metadata hierarchy;
- comfortable reading width;
- desktop TOC prominence and sticky behavior;
- mobile TOC discoverability;
- heading spacing;
- code/table treatment;
- source-list readability;
- return-to-category and back-to-top actions.

### Responsive and accessibility polish

Retain or improve:

- no document-level horizontal overflow;
- minimum 44px interactive targets where relevant;
- visible keyboard focus;
- WCAG AA palette checks;
- reduced-motion behavior;
- sticky Header anchor visibility;
- semantic links/navigation;
- no browser-side public read API.

## Non-goals

Phase 6.7 does not automatically include:

- database/schema changes;
- category CMS/admin;
- user accounts;
- search;
- RSS;
- new client state infrastructure;
- a new component framework;
- animation libraries;
- arbitrary category colors/icons from payloads.

## Approved first-slice decisions

- Replace the category rail's raw CSS overflow with the existing `radix-ui` Scroll Area primitive; no package addition is required.
- Keep category navigation as semantic links, not tabs.
- Render navigation labels at a maximum of five visible Unicode characters and append `…` when longer.
- Preserve each category's complete persisted label in the link's accessible name and native title.
- Give category links a minimum inline width so the mobile rail still presents an intentional horizontal-scroll affordance.
- Convert archive rows into compact card-like links: the whole article block navigates to the report detail.
- Keep homepage editorial report cards unchanged in this slice because they already contain two distinct destinations (detail + archive).
- Rebind only the `phase6.7/ui-ux` Vercel Preview to Neon `phase6-adaptive-isolated` for four-published-category UX acceptance.
- The Preview database host override is verification-only and must be removed before any Phase 6.7 merge to `main`.


## Implementation constraints

- Prefer CSS/layout refactoring over adding dependencies.
- Preserve Next.js Server Components and current public query layer.
- Preserve category-driven routes and deterministic application-owned tones.
- Keep client JavaScript within the existing 1 MiB cold-route budget.
- Update tests only to reflect approved UX behavior, not to weaken overflow/accessibility guards.

## Acceptance

Phase 6.7 implementation is complete only when:

- approved desktop and mobile visual direction is implemented;
- 2, 4 and 6-category layouts remain coherent;
- long labels remain usable;
- desktop and Pixel 7 critical interactions pass;
- keyboard/focus and contrast checks pass;
- no document-level horizontal overflow returns;
- sticky header/TOC anchors remain correct;
- public browser reads remain free of redundant `/api/*` calls;
- production client JavaScript budget does not regress materially;
- `/AI-build` records the final design decisions and verification.


## First-slice implementation

The implementation uses the project's existing `radix-ui` package and follows the official Scroll Area primitive composition:

```text
ScrollArea.Root
└─ ScrollArea.Viewport
   └─ category links
└─ ScrollArea.Scrollbar (horizontal)
   └─ ScrollArea.Thumb
```

The official Radix guidance retains native scrolling and keyboard scrolling behavior; Phase 6.7 adds no custom wheel/drag state.

Preview database routing is scoped to:

```text
VERCEL_ENV=preview
VERCEL_GIT_COMMIT_REF=phase6.7/ui-ux
        ↓
Neon phase6-adaptive-isolated
```

Production and unrelated Preview branches continue using their configured `DATABASE_URL` unchanged.
