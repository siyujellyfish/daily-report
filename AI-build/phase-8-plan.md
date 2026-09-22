# Phase 8 — Loading performance plan

## Goal

Phase 8 implements the approved P0/P1 loading improvements after the Vercel runtime was moved to `sin1`. The application keeps the existing Server Component → Drizzle Neon HTTP architecture and uses Neon Production `main` as the application database.

This phase does not add Redis, a second database driver, new indexes, a browser-side read API, or client state for server data.

## Measured baseline — 2026-09-22

Reused-connection Production samples after the `sin1` move:

| Route | Average TTFB | Average total | Compressed HTML |
| --- | ---: | ---: | ---: |
| `/` | 0.284 s | 0.337 s | 7,156 B |
| `/category/framework-recommendation` | 0.493 s | 0.540 s | 7,038 B |
| representative report detail | 0.305 s | 0.414 s | 14,670 B |

Observed response state was `cache-control: no-store` and `x-vercel-cache: MISS`. Neon SQL execution itself was approximately 0.05–0.18 ms for the inspected core queries, so the first priority is removing repeated request/network/render work rather than adding indexes.

The former 10-row archive projection fetched complete Markdown and source JSON even though the UI only renders title/date/summary. One measured page selected 118,092 Markdown bytes plus 5,231 source bytes.

## P0 — Cross-request cache and precise invalidation

- Enable Next.js 16 Cache Components.
- Replace public `force-dynamic` route configuration with `"use cache"` data functions.
- Apply one broad `public-reports` tag and an explicit cache life:
  - stale: 5 minutes;
  - revalidate: 1 hour;
  - expire: 1 day.
- Production/Vercel builds with `DATABASE_URL` may prerender the homepage and sitemap.
- Local/CI builds without a reachable database set `SKIP_DATABASE_PRERENDER=1`, postponing DB work until request time instead of contacting Production.
- A newly created report (`201`) immediately calls `revalidateTag("public-reports", { expire: 0 })`.
- Exact retries (`200 duplicate`) and conflicts do not invalidate because public output did not change.
- Cache invalidation failure is logged but does not turn a committed insert into a false failure/retry loop.

## P1 — Query and payload reduction

### Persist presentation metadata

Add nullable rolling-deployment columns to `reports`:

```text
summary text
reading_minutes integer
headings jsonb
```

The ingest endpoint derives these values once with the same Markdown AST transform used by the renderer. Existing rows are backfilled with the repository script. Columns remain nullable during this rollout so the old Production runtime can continue inserting safely between schema promotion and application deployment.

The new runtime has a compatibility fallback: only rows still missing presentation data trigger a targeted Markdown fetch and parse. Normal list queries never select full Markdown or sources.

### Reduce query count

- Published category validation reuses the cached ordered category list.
- Homepage latest report + category metadata is returned by one ranked/window query rather than a category query followed by a report query.
- Archive rows and total count use one `COUNT(*) OVER()` query.
- Header categories use the same cross-request cache.
- Sitemap reads participate in the same tag invalidation.

### Detail rendering

Detail queries still fetch full Markdown and sources, but summary/headings/reading time come from persisted values. Markdown is parsed only by the actual React Markdown render path, except for rolling-deployment fallback rows.

## Observability

- Add `@vercel/speed-insights` 2.0.0 using the official Next.js root-layout integration.
- Emit structured `server_timing` JSON logs around cache-fill DB operations. Cache hits do not execute or log the wrapped DB query.
- Add `Server-Timing` response headers to ingest responses for total application and persistence-path duration.
- Retain the existing production client-JavaScript budget.

## Database rollout

1. Keep the migration as reviewed source in `drizzle/phase8_report_presentations.sql`.
2. Prepare the exact additive SQL on a temporary Neon branch from `main`.
3. Backfill all temporary-branch reports with `scripts/backfill-report-presentations.mjs`.
4. Execute the new latest/archive/detail queries and production build against the migrated temporary branch.
5. After explicit promotion confirmation, apply the exact prepared migration to Neon `main`.
6. Backfill every current `main` row and verify no presentation field is missing.
7. Apply the same additive schema/backfill to the clean isolated CI branch so integration and browser acceptance remain write-isolated.

## Acceptance

- Next.js production build passes with and without build-time DB prerendering.
- Homepage/archive models contain no `contentMarkdown` or `sources`.
- Existing detail output, headings, summaries and source safety remain unchanged.
- Latest-per-category is one report query; category archive is one rows+count query.
- New ingest rows persist presentation metadata and invalidate only after creation.
- Exact retry hash/idempotency remains unchanged.
- Temporary migration preserves all report rows and backfills every presentation field.
- Neon Production `main` is migrated/backfilled only after the prepared migration is accepted.
- TypeScript, unit, isolated integration, Playwright, read-error, build and client-JS budget pass before merge.
- Final merge to `main` uses squash.
