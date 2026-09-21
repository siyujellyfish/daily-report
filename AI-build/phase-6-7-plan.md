# Phase 6.7 — UI/UX refinement plan

## Status

Planning only. No UI runtime change is authorized by this document.

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

## Design gate before implementation

Before modifying UI code, confirm these decisions with the user:

1. **Overall density** — keep the current spacious editorial layout, make it moderately denser, or significantly compact it for many categories.
2. **Header emphasis** — keep the current two-row visual weight or make the first row/rail more compact while preserving always-visible categories.
3. **Homepage card strategy** — keep full editorial cards for every category or reduce preview content so 4–6 categories fit more efficiently.
4. **Report-detail direction** — preserve the current newspaper/editorial reading style or increase documentation-like structure around TOC/metadata.

A visual/demo checkpoint should precede final implementation.

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
