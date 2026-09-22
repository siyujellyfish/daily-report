# Phase 8 — Loading performance verification

## Status

Implementation is active on branch `phase8/loading-performance`.

Completed so far:

- Cache Components and tagged public data caches implemented.
- Ingest-derived presentation persistence and creation-only invalidation implemented.
- Homepage/archive projections and query counts reduced.
- Speed Insights, structured cache-fill timing logs and ingest `Server-Timing` implemented.
- Exact additive migration tested on a temporary Neon branch, explicitly promoted to Production `main`, and backfilled.
- Isolated CI branch aligned and full DB integration passed with ephemeral fixtures cleaned afterward.

Remaining delivery gate:

- run Playwright critical paths, browser read-error and production client-JS budget in branch Quality;
- retain PR + squash merge as the only path to repository `main` after branch Quality passes.

## Migration acceptance

Prepared migration:

```text
project: shiny-fire-00063440
database: neondb
parent: main / br-empty-shape-b3x5225o
migration id: faa4ed7c-83ce-4777-aaab-0efe0abe2f77
temporary branch: mcp-migration-2026-09-22T07-14-51
temporary branch id: br-bitter-fog-b3n13wom
```

The SQL is additive only:

```sql
ALTER TABLE "reports"
  ADD COLUMN "summary" text,
  ADD COLUMN "reading_minutes" integer,
  ADD COLUMN "headings" jsonb;
```

Temporary-branch backfill result:

```text
reports: 27
updated: 27
missing presentation values: 0
invalid non-array headings: 0
reading_minutes range: 1–26
```

No report title, Markdown, sources, hash, date or category value was changed.

After the temporary result was reviewed, the user explicitly approved Production promotion. The migration workflow applied the exact SQL above to parent branch `br-empty-shape-b3x5225o` and deleted temporary branch `br-bitter-fog-b3n13wom`.

Production `main` verification:

```text
reports: 27
missing presentation values: 0
invalid non-array headings: 0
reading_minutes range: 1–26
published categories: 3
```

The same additive columns were applied to `phase6-adaptive-isolated` without resetting or copying Production data. Its 24 at-rest reports were backfilled through the canonical repository script. After the acceptance fixture lifecycle completed:

```text
categories: 2
reports: 24
missing presentation values: 0
fixture categories: 0
fixture reports: 0
```

## Query verification

The migrated temporary branch returned three real published categories through the ranked latest query:

```text
daily-news
framework-recommendation
app-store-limited-free
```

The archive query returned 10 rows and `total = 13` through the same `COUNT(*) OVER()` result set.

Across all 27 rows, the selected presentation payload comparison was:

```text
full Markdown + sources: 215,706 bytes
summary + headings + reading time: 38,608 bytes
reduction: approximately 82.1%
```

The runtime retains a targeted fallback only for nullable rolling-deployment rows that have not yet been backfilled.

## Build and application verification

Passed:

```text
TypeScript: passed
unit: 28 / 28
production build without DB prerender: passed
production build against migrated temporary Neon branch: passed
production build against migrated/backfilled Production main: passed
performance-query integration smoke against migrated temporary branch: passed
isolated DB integration: 10 / 10
isolated fixture seed and always-cleanup: passed
manual no-DB homepage response: HTTP 500
main-backed production route smoke: home/category/detail/sitemap all HTTP 200
```

The main-backed build prerendered `/` and `/sitemap.xml` with a 1-hour revalidation / 1-day expiry profile. Dynamic category and detail routes retained partial-prerender shells and cached data functions.

Neon compute had to resume during verification, which produced intentionally visible cold cache-fill logs. Those logs confirmed the new structured `server_timing` event shape. A same-process repeat-request check produced:

| Route | First total | Second total |
| --- | ---: | ---: |
| `/category/framework-recommendation` | 9.403 s | 0.028 s |
| `/reports/2026-09-22-framework-recommendation` | 0.551 s | 0.091 s |

Only the first request emitted its corresponding DB cache-fill timing. The second request reused the cross-request cache. These local timings include the unusually slow workspace-to-Neon network path and are evidence of cache behavior, not a replacement for post-deploy Speed Insights data.

## Browser gate

The local Playwright command started the Next.js server and both direct HTTP 308 tests passed. Browser-backed cases did not launch because no Chromium binary exists in the container. Installing the exact Playwright 1.63 Chromium build was attempted, but the restricted download proxy returned a 0 MiB invalid archive; the optional managed `agent-browser` CLI is also unavailable.

No browser assertion failure is recorded as a product failure, and no browser suite is claimed as passed. GitHub Quality already installs Chromium before its Playwright steps and remains the required gate for:

- desktop and Pixel 7 critical paths/accessibility;
- interactive retryable read-error UI;
- production client-JavaScript budget.

The HTTP portion of the read-error contract was checked independently: a no-DB request to `/` returned 500 and logged the expected missing `DATABASE_URL` failure.

## Dependency checkpoint

Official Vercel guidance was rechecked on 2026-09-22. The implementation pins the current stable `@vercel/speed-insights` 2.0.0 package and mounts its official Next.js component in the root layout. The injected collection script is deferred by the package.
