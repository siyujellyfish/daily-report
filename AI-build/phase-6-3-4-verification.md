# Phase 6.3–6.4 — Dynamic read layer and adaptive UI verification

## Current status

Phase 6.3 and Phase 6.4 are complete on `phase6/adaptive-categories`.

Production runtime has not been upgraded to the Phase 6 application. The Production database remains on the already-approved backward-compatible Phase 6.1 schema, while Phase 6.3–6.4 implementation and synthetic third-category data remain isolated.

## Phase 6.3 implementation

Implemented data-driven server reads:

```text
getPublishedCategories()
getPublishedCategory(slug)
getLatestPublishedReports()
getReportsByCategory(slug, page)
getReportBySlug(slug)
getCategorySitemapEntries()
getReportSitemapEntries()
```

Published category definition:

```text
is_visible = true
AND EXISTS(report)
ORDER BY
  sort_order ASC NULLS LAST,
  created_at ASC,
  slug ASC
```

The public category projection intentionally excludes internal ordering, visibility and timestamps.

Canonical routing is now:

```text
/category/[slug]
```

Legacy routes remain:

```text
/news
→ permanentRedirect(/category/daily-news)

/frameworks
→ permanentRedirect(/category/framework-recommendation)
```

Valid pagination is preserved through the redirect.

Report URLs remain unchanged:

```text
/reports/YYYY-MM-DD-<category-slug>
```

The parser now validates a fixed calendar-date prefix plus the shared generic safe category slug rather than enumerating two report types.

Report detail queries join persisted category metadata so breadcrumb/category links no longer depend on a hard-coded category table.

The Production sitemap now consists of:

```text
/
published /category/[slug] routes
visible-category report detail routes
```

Legacy redirect URLs are no longer canonical sitemap entries. Preview noindex behavior was not changed.

## Phase 6.4 implementation

Header structure:

```text
row 1: brand | home | theme control
row 2: horizontally scrollable category rail
```

The Server Component reads categories and passes only:

```text
slug
label
href
```

to the Client navigation boundary.

The old mobile hamburger/open-state/Escape-focus behavior was removed. Category links remain semantic navigation links and are always visible on mobile.

Active category state works for:

- `/category/[slug]`;
- `/reports/YYYY-MM-DD-<slug>`.

Homepage rendering now uses the ordered latest report for each published category rather than `REPORT_TYPES.map()`.

The card grid uses responsive auto-fit/minmax behavior:

- one card fills the available row;
- two categories render as two columns when space permits;
- 3+ categories can form additional columns without source-code changes;
- mobile remains one column.

Hard-coded two-category copy was generalized.

### Category tones

Legacy identities remain:

```text
daily-news → blue
framework-recommendation → teal
```

Future safe categories are deterministically mapped to the application-owned palette:

```text
violet
amber
rose
cyan
```

No payload can provide CSS, arbitrary color or icon values.

Light/dark token pairs are included in the existing automated WCAG AA normal-text contrast check.

### Sticky Header

A shared CSS variable is now used:

```text
--sticky-header-offset
```

It drives:

- document `scroll-padding-top`;
- report heading/source `scroll-margin-top`;
- desktop TOC sticky `top`.

### Header failure boundary

Category loading in the Header is guarded. If the category query fails, the Header keeps the static brand/home/theme shell while the page's own data read continues to determine the page-level error state.

The existing read-error Playwright suite passed with this behavior.

## Isolated database evidence

Canonical Phase 6 synthetic-data branch:

```text
name: phase6-adaptive-isolated
branch id: br-lingering-boat-b3czfbqx
```

Read-only published-category verification returned:

```text
1. daily-news
   sort_order: 10
   reports: 9

2. framework-recommendation
   sort_order: 20
   reports: 10

3. security-news
   sort_order: NULL
   reports: 1
```

This confirms a third v2 category is discoverable using the same ordering rule without application source enumeration.

### Legacy CI branch compatibility at the Phase 6.4 checkpoint

At the Phase 6.4 checkpoint, GitHub `TEST_DATABASE_URL` still targeted the older isolated `phase3-testing` branch, whose `reports.report_type` remained the original PostgreSQL enum. This paragraph is historical evidence for that checkpoint; Phase 6.5 subsequently moved `TEST_DATABASE_URL` to canonical `phase6-adaptive-isolated`.

To keep that historical fixture environment usable without Production access, only these additive changes were made to that isolated branch:

```text
create report_categories
seed daily-news
seed framework-recommendation
```

No enum conversion, DROP, report UPDATE/DELETE or synthetic Phase 6 category was performed there.

Verification:

```text
categories: 2
reports: 15
orphan legacy reports: 0
```

The new read layer compares legacy enum report types through `report_type::text` when joining category metadata, so it works against both the legacy isolated fixture schema and migrated Production varchar schema.

## Automated verification

Final implementation checkpoint before documentation closure:

```text
commit: 0b7a4acc4e889b529afcbc27e9eb7f7cd5f3e667
Quality run: 35548140378
result: success
```

Results:

```text
frozen install: passed
typecheck: passed
unit: 25 / 25 passed across 7 files
build: passed
isolated DB integration: 4 / 4 passed
Playwright main: 30 passed / 4 viewport-conditional skips / 0 failed
read-error: 1 / 1 passed
production client JS budget: 1 / 1 passed
```

Measured cold-load client JavaScript:

```text
/: 504,993 bytes
/news: 504,993 bytes
/reports/2026-09-09-daily-news: 511,609 bytes
guard: 1 MiB
```

The performance route still enters through `/news`; Next.js follows the permanent redirect and the measured client bundle remains within the existing guard.

The prior React development-mode script-rendering message remains non-blocking and unchanged; it does not fail browser behavior or the production `next start` budget run.

## Phase 6.5 boundary

The following remain intentionally open for Phase 6.5 rather than being claimed by 6.4:

- browser verification with 3+ published categories from the canonical Phase 6 test branch;
- long category labels;
- explicit empty and invisible category fixtures;
- explicit HTTP 308 status assertions;
- dynamic category metadata/canonical and sitemap output assertions;
- mobile rail document-overflow checks with 3+ categories;
- TOC physical anchor-position checks under the two-row sticky Header;
- full isolated v1/v2 write-path integration suite using the canonical Phase 6 test database.

## Conclusion

Phase 6.3 and 6.4 are complete:

- public category reads are data-driven;
- canonical category routes are dynamic;
- legacy archive paths remain compatible;
- report detail and sitemap use persisted category metadata;
- Header/navigation and homepage automatically adapt to category data;
- mobile no longer depends on a hamburger menu;
- visual tones are deterministic and application-owned;
- sticky offsets are centralized;
- current Quality remains green;
- Production runtime and synthetic Production content remain unchanged.

Phase 6.5 was subsequently completed using canonical `phase6-adaptive-isolated`; see `phase-6-5-verification.md`.
