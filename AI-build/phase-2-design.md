# Phase 2 — Adopted public website design

## Approval and scope

The user approved the `daily-report-demo.html` design on 2026-09-09 and authorized Phase 2 implementation. The demo is a visual/interaction reference only; its synthetic reports, fictional tools, preview banner and fixed dates are not production content.

## Visual system

- Editorial technology publication with the approved `dr.` wordmark and Daily Report / 每日推播 navigation.
- Light: off-white `#f7f7f2`, white cards, dark text `#202725`.
- Dark: charcoal `#151a18`, cards `#1d2420`, soft white text `#e8eee9`.
- News uses blue; framework recommendations use teal, with textual category labels.
- System fonts, comfortable paragraph line height, 16–18px body text, 12px card corners.
- Main width 1160px; long-form article width 760px; responsive switch at 720px.
- Two equal homepage cards on desktop, stacked cards on mobile.
- Light / dark / system theme preference stored only in the reader's browser.

## Page details

- Homepage: latest report per type; each card shows its own report date, title, extracted summary, estimated reading time and up to three real headings.
- Latest issue date derives from actual stored report dates, never the current clock or a demo constant.
- Archives: newest first, 10 reports per page, addressable page query; first/last/current-neighbour page navigation stays bounded.
- Detail: breadcrumbs, category, title, Taipei generation time, full Markdown and structured source links.
- Table of contents appears for at least three meaningful level 2/3 headings; sticky on desktop, native collapsible details on mobile.
- Duplicate leading Markdown H1 matching the record title is omitted from presentation; other H1 headings become H2. Stored Markdown remains unchanged.
- Shared AST transform assigns collision-free heading IDs; code fences are never mistaken for headings.
- GFM tables, task lists, footnotes and strikethrough are supported; raw stored HTML is skipped.
- Code blocks have a copy button with success/fallback feedback; code and tables scroll within their container.
- Markdown image references are presented as external image links; the site does not automatically load third-party media.
- Source URLs are validated as HTTP(S) at ingest and checked again for presentation; empty source lists have explicit copy.
- No report means an empty state. Read failures propagate to a retryable error page. Invalid/missing reports and invalid/out-of-range page numbers produce not-found behavior.
- No root loading boundary is added in Phase 2: preserve accurate missing-report HTTP status before streaming. Loading treatment can be revisited based on observed latency.

## Data and metadata

- Public pages use direct server-side Drizzle queries against Neon, with explicit public column projection.
- React request-scoped cache deduplicates repeated detail reads by page and metadata; no cross-request cache or Redis.
- Query order: report date descending, then generation time descending. Type/date uniqueness eliminates ties within each archive.
- Existing type/date and date indexes cover these query shapes; no schema change is required.
- Canonical origin defaults to the verified current Production domain; `SITE_URL` can override it.
- Per-page title/description/canonical, textual Open Graph and Twitter metadata; no generated social image.
- Production sitemap includes the public routes and actual report slugs. Vercel Preview uses noindex and disallow-all robots.

## Remaining phases

- Phase 3 owns persistent Vitest/Playwright suites, browser/mobile/accessibility verification and performance review.
- Phase 4 owns both real Scheduled Task payloads and production-content validation.
- Phase 5 owns the final secret rotation and production activation.
- Search, RSS, tags, accounts, CMS and new ingestion behavior remain outside this phase.

## Implementation verification

The Next.js build, pnpm 12.3.4 frozen install, pure date/slug/Markdown checks, actual server-renderer fixture and Vercel Preview HTTP route checks passed. Native mobile-menu, theme and clipboard interactions still receive browser verification in Phase 3. Current live data is the original P1 framework test report; no fictional content was written to Neon.
