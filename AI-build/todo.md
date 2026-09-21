# TODO

This file is the primary implementation plan and progress source for Daily Report.

## Phase 0 — Initialization

### Repository and application foundation

- [x] Bootstrap GitHub repository.
- [x] Create initialization branch.
- [x] Add Next.js / React / TypeScript base.
- [x] Add Tailwind CSS base.
- [x] Add shadcn/ui project foundation.
- [x] Add Neon + Drizzle connection layer.
- [x] Add environment variable template.
- [x] Initialize `/AI-build` documentation.
- [x] Set Node.js / package-manager project metadata.

### Hosting and database

- [x] Create Vercel project linked to `siyujellyfish/daily-report`.
- [x] Provision Neon through Vercel Native Integration.
- [x] Confirm Singapore Neon region and PostgreSQL runtime compatibility.
- [x] Confirm `DATABASE_URL` at runtime with a successful ingestion test.
- [x] Complete first successful Vercel Preview build.
- [x] Complete first successful Vercel Production build.

### Phase 0 acceptance

- [x] Application builds on Vercel.
- [x] GitHub → Vercel deployment flow works.
- [x] Neon connection is available to the application runtime.
- [x] Project documentation exists and is maintained under `/AI-build`.

---

## Phase 1 — Ingestion

### Database schema

- [x] Define `report_type` enum.
- [x] Define `reports` table.
- [x] Store sources as JSONB.
- [x] Add unique `payload_hash` constraint.
- [x] Add unique `(report_type, report_date)` constraint.
- [x] Add report/date query indexes.
- [x] Validate migration on a temporary Neon branch.
- [x] Apply validated schema to Neon production.

### API contract

- [x] Define schema version `1` payload with Zod.
- [x] Support `daily-news`.
- [x] Support `framework-recommendation`.
- [x] Validate structured source URLs.
- [x] Normalize Make `sources: null` / omitted sources to `[]`.
- [x] Derive Asia/Taipei report date from `generatedAt`.

### Security and idempotency

- [x] Implement `POST /api/v1/ingest`.
- [x] Add Bearer-secret authentication.
- [x] Add SHA-256 normalized payload hashing.
- [x] Return HTTP 201 for new report creation.
- [x] Return HTTP 200 with `duplicate: true` for exact retries.
- [x] Return HTTP 409 for a different payload on an occupied type/date.
- [x] Ensure retries do not create duplicate database rows.

### Make integration

- [x] Convert the POC into `Daily Report - Publish to Vercel`.
- [x] Use Make JSON serialization rather than manually escaping raw JSON.
- [x] Add HTTP POST to the production ingest endpoint.
- [x] Configure request failure handling for HTTP 4xx/5xx.
- [x] Disable Vercel `Require Log in` so Make can reach the public Production endpoint.
- [x] Complete Make → Vercel → Neon end-to-end test.
- [x] Verify exact duplicate delivery leaves Neon row count unchanged.

### Phase 1 acceptance

- [x] Authenticated Make request persists a report in Neon.
- [x] Database idempotency works under exact retry.
- [x] Invalid/unauthorized requests are rejected.
- [x] Production Vercel deployment successfully executes the ingest route.

---

## Phase 2 — Public website and read layer

### 2.1 Data/read architecture

- [x] Create a dedicated server-side report query/repository module.
- [x] Implement `getLatestReports()` for homepage data.
- [x] Implement `getReportsByType()` for archive pages.
- [x] Implement archive pagination with deterministic ordering by report date / generated time.
- [x] Implement `getReportBySlug()` for detail routes.
- [x] Centralize database-record → presentation-model mapping.
- [x] Centralize Asia/Taipei date formatting and business-date handling.
- [x] Implement deterministic slug generator/parser using `report_date + report_type`.
- [x] Ensure missing/invalid slug lookups resolve safely to Next.js 404 behavior.
- [x] Review existing indexes against actual archive/detail query shapes.

### 2.2 Markdown and sources

- [x] Add `react-markdown` using the latest compatible stable version after checking official docs.
- [x] Add `remark-gfm` if required for tables/task lists/strikethrough.
- [x] Do not add `rehype-raw`.
- [x] Build a reusable report Markdown renderer.
- [x] Style headings, paragraphs, lists, code, blockquotes, tables and links.
- [x] Render structured `sources` as a dedicated source-attribution section.
- [x] Handle empty source arrays gracefully.
- [x] Ensure external links use safe attributes where appropriate.

### 2.3 Public pages

- [x] Build `/` homepage.
- [x] Show latest `daily-news` report summary/card on homepage.
- [x] Show latest `framework-recommendation` report summary/card on homepage.
- [x] Add clear links to each archive and full report.
- [x] Build `/news` archive for `daily-news`.
- [x] Build `/frameworks` archive for `framework-recommendation`.
- [x] Build `/reports/[slug]` full report page.
- [x] Add empty state when a report type has no published data.
- [x] Add loading/skeleton behavior only where it materially improves UX.
- [x] Add consistent header/navigation/footer structure.
- [x] Add mobile navigation if required by final layout.

### 2.4 Visual and responsive implementation

- [x] Establish site typography, spacing and content-width system.
- [x] Use Tailwind CSS and a minimal shadcn/ui component set; avoid unnecessary component dependencies.
- [x] Ensure long Markdown/code/URLs do not break mobile layout.
- [x] Verify archive cards/lists at desktop, tablet and mobile widths.
- [x] Maintain readable long-form report line length.
- [x] Add basic hover/focus/active states.

### 2.5 Metadata and discoverability

- [x] Add site-level Next.js metadata.
- [x] Add per-report title/description metadata.
- [x] Add archive metadata for `/news` and `/frameworks`.
- [x] Add canonical URLs when Production domain is finalized.
- [x] Decide and add Open Graph metadata where useful.
- [x] Decide whether sitemap/robots generation is required for launch and implement if appropriate.

Implementation and Preview/runtime acceptance are complete (PR #7). The current database contains one framework test report and no news rows: live checks verified the real report plus category empty states; populated GFM/source behavior was also checked with a local server-renderer fixture. Real daily content validation remains Phase 4. Evidence and limits are recorded in `changelog.md`. The skeleton item is resolved by an explicit decision to omit a global loading boundary, documented in `phase-2-design.md`.

### Phase 2 acceptance

- [x] Homepage renders both report categories from Neon.
- [x] Both archive routes render correct filtered report lists.
- [x] Detail route renders complete saved Markdown and structured sources.
- [x] Invalid report slug returns 404.
- [x] Website remains read-only from the browser.
- [x] No raw stored HTML execution is enabled.
- [x] Vercel Preview build succeeds.

---

## Phase 3 — Testing, quality and performance

Phase 3 implementation and acceptance are complete. Verified implementation checkpoint: `00bd49ee022e03ad88a117267058466455fcad7a`; Quality run `34422203392` passed frozen install, TypeScript, 17 unit tests, production build, 4 isolated DB integration tests, Playwright main suite (29 passed / 5 conditional skips / 0 failed), isolated read-error test (1/1), and production client-JS budget (1/1). Matching Vercel Preview `dpl_3yqr4rGMSkLtEXazdVso6JaAvEew` is READY. Production data was not modified by Phase 3 tests.

### 3.1 Unit tests with Vitest

- [x] Recheck current Vitest official docs/version before implementation.
- [x] Add slug generation tests.
- [x] Add slug parsing/invalid-input tests.
- [x] Add Asia/Taipei date-boundary tests.
- [x] Add report mapper/normalization tests.
- [x] Add source normalization tests.
- [x] Resolve pure query-helper coverage where practical. Date/slug/page helpers are unit-tested; DB query construction is intentionally covered by isolated integration tests rather than extracting artificial pure helpers.
- [x] Keep DB integration concerns separate from pure logic tests.
- [x] Cover Markdown summaries, heading anchors and unsafe URLs.
- [x] Verify read queries against isolated fixtures without modifying Production. DB integration 4/4 passed against `phase3-testing`.
- [x] Cover homepage and archive empty-state rendering without deleting or mutating Neon fixtures.

### 3.2 End-to-end tests with Playwright

- [x] Recheck current Playwright official docs/version before implementation.
- [x] Test homepage loading and latest-report links.
- [x] Test `/news` archive.
- [x] Test `/frameworks` archive.
- [x] Test report-detail rendering.
- [x] Test report 404 behavior.
- [x] Test critical navigation flow.
- [x] Test one representative mobile viewport. Pixel 7 project passed its applicable cases.
- [x] Test external source links render correctly.
- [x] Test pagination, mobile menu, TOC, theme persistence and code-copy feedback.
- [x] Test empty/error states in isolated environments. Empty-state render tests pass; DB-unavailable HTTP 500/retryable error UI passes 1/1.

### 3.3 Accessibility and content quality

- [x] Verify semantic heading hierarchy. Automated public-route checks confirm one H1 and no skipped visible heading levels.
- [x] Verify keyboard navigation and visible focus states. Skip-link focus and mobile Escape/focus restoration passed in Playwright.
- [x] Verify link labels are meaningful. Distinct destinations do not reuse ambiguous accessible labels; homepage and duplicate TOC links were disambiguated without visual text changes.
- [x] Verify sufficient basic color contrast. Core light/dark text-token pairs meet WCAG AA 4.5:1 normal-text threshold in automated checks.
- [x] Verify Markdown tables/code blocks remain usable on narrow screens. Pixel 7 has no document-level horizontal overflow; table/code overflow stays in local scroll containers.
- [x] Verify empty-state and error-state copy. Empty render tests and isolated DB read-error UI both pass.

### 3.4 Performance and database checks

- [x] Confirm Server Component queries do not create unnecessary client requests. Public reading flow generates no browser-side `/api/*` read requests.
- [x] Inspect actual query plans/index usage only if observed behavior warrants it. No query latency or functional bottleneck was observed in isolated integration/browser verification, so no speculative query-plan change was introduced.
- [x] Avoid adding Redis/cache infrastructure without a demonstrated need.
- [x] Check generated page/deployment size for avoidable client-side JavaScript. Production `next start` cold-load totals are about 505–506 KB uncompressed and remain below the 1 MiB CI guard.
- [x] Confirm Phase 3 test design does not add a new public write API or expose test credentials in code/configuration.

### 3.5 Repeatable verification

- [x] Add documented test commands and CI checks with isolated test configuration.
- [x] Record the verified commit, environment, results and limitations at Phase 3 acceptance in `phase-3-verification.md`.
- [x] Replace the deprecated-warning-prone CI setup path with official `pnpm/setup@v2` + Node 24 and retain frozen lockfile verification.

### Phase 3 acceptance

- [x] TypeScript and production build pass for the verified Phase 3 implementation.
- [x] Vitest suite passes (17 tests in 5 files).
- [x] Isolated database read integration checks pass (4 tests).
- [x] Playwright critical-path/accessibility suite passes (29 passed / 5 conditional skips / 0 failed).
- [x] Isolated DB read-error state passes (1 test).
- [x] Production client JavaScript budget passes (1 test; approximately 505–506 KB cold-load JS, limit 1 MiB).
- [x] Vercel Preview succeeds without blocking errors for verified implementation commit `00bd49ee`.
- [x] No critical accessibility or mobile-layout issue remains.
- [x] Current Phase 3 implementation adds no public credentials or unnecessary write API surface.
- [x] Remaining React script-rendering message is limited to `next dev` browser runs, does not reproduce in the production `next start` budget run, and is recorded as a non-blocking development-mode warning rather than prompting an unverified product change.

---

## Phase 4 — Real Scheduled Tasks integration

Detailed execution contract: `phase-4-plan.md`. Actual Production evidence: `phase-4-verification.md`. Phase 4 implementation and acceptance are complete.

### 4.0 Planning and safety boundary

- [x] Inspect the actual active recurring Scheduled Tasks and preserve their current research/selection rules.
- [x] Map `開發技術每日追蹤` → `daily-news`.
- [x] Map `每日突破性工具推薦` → `framework-recommendation`.
- [x] Inspect the high-level Make `Daily Report - Publish to Vercel` interface without opening credential-bearing HTTP module inputs.
- [x] Freeze the Make input contract as `reportType`, `title`, `contentMarkdown`, `generatedAt`, `sources[]`; do not use the old POC `sourcesJson` contract.
- [x] Define title conventions, clean Markdown/citation boundary, structured-source rules and Asia/Taipei timestamp requirements.
- [x] Preserve Phase 5 security boundary by choosing one-shot shadow Scheduled Tasks for Phase 4 validation instead of permanently adding publishing to the currently enabled recurring Tasks.
- [x] Before shadow execution, confirm the target Production `(report_type, report_date)` is unoccupied. Both 2026-09-10 targets were empty before execution.

### 4.1 `開發技術每日追蹤` → `daily-news`

- [x] Copy the current real research prompt into a one-shot shadow Scheduled Task without weakening the existing scope or source-quality rules.
- [x] Keep historical/daily duplicate-avoidance behavior.
- [x] Add `reportType = daily-news` delivery mapping.
- [x] Use title `開發技術每日追蹤｜YYYY-MM-DD`.
- [x] Send full clean Markdown as `contentMarkdown`, without ChatGPT UI citation serialization.
- [x] Send `generatedAt` as actual execution time in ISO 8601 with explicit `+08:00` at generation time; Neon stores the equivalent timestamptz instant in UTC.
- [x] Send structured `sources[]` with explicit title and URL, deduplicated by URL and biased toward primary/official sources.
- [x] If there are no relevant results, still publish deterministic no-result Markdown with `sources = []` rather than silently skipping the run. This path was exercised on 2026-09-10.
- [x] Schedule the shadow as a one-time automation; no run-time manual approval. The task completed and automatically became disabled.

### 4.2 `每日突破性工具推薦` → `framework-recommendation`

- [x] Copy the current real recommendation prompt into a one-shot shadow Scheduled Task without weakening selection/analysis requirements.
- [x] Preserve historical recommendation deduplication.
- [x] Add `reportType = framework-recommendation` delivery mapping.
- [x] Use title `每日突破性工具推薦｜<工具名稱>`.
- [x] Send full clean Markdown as `contentMarkdown`, without ChatGPT UI citation serialization.
- [x] Send `generatedAt` as actual execution time in ISO 8601 with explicit `+08:00` at generation time; Neon stores the equivalent timestamptz instant in UTC.
- [x] Send structured `sources[]` with explicit title and URL, deduplicated by URL and biased toward primary/official sources. The 2026-09-10 TypeSpec report persisted 7 official/primary sources.
- [x] Preserve the fallback rule for days without a compelling newly released tool: select a recent fast-growing representative tool and explain why rather than publishing an empty report.
- [x] Schedule the shadow as a one-time automation; no run-time manual approval. The task completed and automatically became disabled.

### 4.3 End-to-end Production content validation

- [x] Let the `daily-news` shadow Scheduled Task run automatically against `Daily Report - Publish to Vercel`.
- [x] Inspect only the high-level Make execution outcome; do not inspect HTTP Authorization input/header.
- [x] Confirm the corresponding Neon Production row is created exactly once.
- [x] Confirm it appears on `/`, `/news`, and its detail route.
- [x] Let the `framework-recommendation` shadow Scheduled Task run automatically against the same Make Scenario.
- [x] Inspect only the high-level Make execution outcome; do not inspect HTTP Authorization input/header.
- [x] Confirm the corresponding Neon Production row is created exactly once.
- [x] Confirm it appears on `/`, `/frameworks`, and its detail route.
- [x] Verify Markdown formatting survives ChatGPT → Make → Vercel → Neon → website.
- [x] Verify structured source attribution survives the full data path and links remain correct/safe.
- [x] Verify `generatedAt` and derived report dates use Asia/Taipei correctly.
- [x] Verify persisted Markdown contains no ChatGPT UI citation tokens.
- [x] Exact retry was not needed during Phase 4; existing Phase 1 exact-retry idempotency remains the verified control and no unnecessary Production retry was introduced.
- [x] Do not overwrite/delete a Production report to resolve a same-day/type collision; no Production UPDATE/DELETE was performed.

### Phase 4 acceptance

- [x] Both one-shot shadow Scheduled Tasks publish successfully using the real generation rules.
- [x] Both report types pass through the same `Daily Report - Publish to Vercel` Scenario.
- [x] Both are persisted exactly once and visible on the correct public routes.
- [x] Markdown, structured sources, title, generatedAt and Asia/Taipei business date remain correct end to end.
- [x] Scheduled Task → Make execution requires no run-time manual approval; both Make executions report `startedBy = auto`.
- [x] Scheduled Task generation/research remains independent of the OpenAI API.
- [x] Existing recurring Tasks remain behaviorally unchanged during Phase 4; recurring Production publishing is not enabled before Phase 5 final credential rotation.
- [x] Record execution IDs/results/deviations in `/AI-build` before Phase 4 closure. See `phase-4-verification.md`.

---

## Phase 5 — Production hardening and launch

### 5.1 Final credential rotation

- [x] Generate a final new `INGEST_SECRET` immediately before recurring production use.
- [x] Update Vercel Production `INGEST_SECRET`.
- [x] Update the Make HTTP Authorization header with the same final secret.
- [x] Do not paste or store the final secret in chat, Git, documentation or issue/PR text.
- [x] Trigger a fresh Vercel Production deployment so the new environment variable is loaded.
- [x] Verify the new credential using only the high-level Make Scenario result.
- [x] Confirm database state separately without inspecting Make module/header input data.

### 5.2 Production deployment validation

- [x] Confirm latest `main` Production deployment is READY after the Phase 5 squash merge.
- [x] Confirm Production aliases/domain resolve publicly.
- [x] Confirm `/api/v1/ingest` rejects requests without valid Bearer authentication. Rotation-era mismatched Bearer returned `Unauthorized` without persistence.
- [x] Confirm website routes remain publicly readable.
- [x] Confirm Neon Production schema matches application expectations.
- [x] Confirm no final secret value was introduced into Git or `/AI-build`; the final value was never exposed to ChatGPT tooling.

### 5.3 Enable recurring production delivery

- [x] Apply the Phase 4 verified delivery suffix to `開發技術每日追蹤` and map it to `daily-news`.
- [x] Apply the Phase 4 verified delivery suffix to `每日突破性工具推薦` and map it to `framework-recommendation`.
- [x] Preserve both Tasks' current research/selection rules and intended recurring schedules.
- [x] Confirm both Tasks point to `Daily Report - Publish to Vercel` through the final production contract.
- [x] Enable/retain their intended recurring schedules only after final credential rotation and Vercel redeploy.
- [x] Observe the first unattended real daily executions at high level.
- [x] Confirm each resulting report appears on the public website.

### 5.4 Documentation and release closure

- [x] Update `architecture.md` to the final deployed architecture if implementation differs from plan.
- [x] Update `decisions.md` with final security/rollout decisions and deviations.
- [x] Mark completed TODO items.
- [x] Add final launch acceptance entry to `changelog.md`.
- [x] Review `/AI-build` for stale temporary notes; retain Phase 4 shadow and Phase 5 preflight records as historical audit evidence.
- [x] Ensure final merge to `main` is squash merge.

### Phase 5 acceptance

- [x] Final credential is rotated and not exposed in diagnostic output.
- [x] Both recurring Scheduled Tasks operate unattended.
- [x] Public website displays newly generated reports correctly.
- [x] Production runtime and database are healthy before release merge.
- [x] `/AI-build` accurately represents the live system.
- [x] Phase 5 release is squash-merged to `main` and the resulting Production deployment is READY.

---

## Phase 6 — Adaptive categories

Detailed design and rollout contract: `phase-6-plan.md`. Phase 6.1 database migration and isolation are complete; Phase 6.2 ingestion work is next.

### 6.0 Planning and compatibility boundary

- [x] Audit current fixed-category coupling across DB enum, Zod, TypeScript, slug parser, queries, routes, navigation, homepage, detail and sitemap.
- [x] Recheck current official Next.js / Drizzle / Neon documentation relevant to dynamic routes, permanent redirects, migrations and Neon HTTP transaction boundaries.
- [x] Approve data-driven category model rather than `SELECT DISTINCT report_type` only.
- [x] Approve `/category/[slug]` as canonical archive route.
- [x] Approve permanent redirects from `/news` and `/frameworks`.
- [x] Approve two-row Header with a horizontal adaptive category rail.
- [x] Approve schema v1/v2 transition rather than breaking the two active Production Scheduled Tasks.
- [x] Define that Phase 6 adds no CMS/admin UI, no browser read API and no arbitrary payload-controlled presentation values.
- [x] Define that synthetic third-category verification remains isolated from Production.

### 6.1 Category database model and migration

- [x] Add `report_categories` table with slug, label, description, optional sort order, visibility and timestamps.
- [x] Seed `daily-news` and `framework-recommendation` with current UI labels/descriptions and stable sort order.
- [x] Replace the fixed PostgreSQL `report_type` enum dependency with a string-compatible `reports.report_type` column.
- [x] Add FK from `reports.report_type` to `report_categories.slug`.
- [x] Preserve payload-hash uniqueness, `(report_type, report_date)` uniqueness and existing query indexes.
- [x] Generate and manually review the schema migration; use custom SQL where enum → varchar/data-preserving conversion requires it.
- [x] Validate migration first on a temporary Neon branch.
- [x] Confirm all existing report rows, hashes, dates and sources survive migration unchanged.
- [x] Confirm the pre-Phase-6 application can still read/write its two legacy report types after the schema-first migration.
- [x] Remove the old PostgreSQL enum only after confirming there are no remaining references.
- [x] Do not UPDATE/DELETE Production report content for migration acceptance.

### 6.2 Ingestion schema v2 and legacy v1

- [x] Refactor ingest validation into a schema-version discriminated contract.
- [x] Preserve v1 accepted payloads and legacy report-type validation.
- [x] Add a regression fixture proving v1 normalized payload hashing remains byte-for-byte behaviorally compatible for exact retries.
- [x] Add v2 `reportType` generic safe slug validation.
- [x] Add bounded `categoryLabel` and `categoryDescription` to v2.
- [x] Keep `title`, `generatedAt`, Markdown and sources validation/safety boundaries.
- [x] Create category metadata on first valid v2 publication when the slug does not exist.
- [x] Treat existing stored category metadata as canonical; daily report ingest must not silently rename existing categories.
- [x] Keep `sort_order` and `is_visible` server/database-controlled rather than payload-controlled.
- [x] Validate current Neon HTTP non-interactive transaction/batch support for category-create + report-insert flow.
- [x] If no suitable atomic primitive is used, ensure empty category rows remain publicly invisible through `EXISTS(report)` filtering rather than adding a new DB driver solely for this feature. Not required for persistence safety because Phase 6.2 uses atomic Neon HTTP `db.batch()`; the published-category `EXISTS(report)` filter remains planned in 6.3.
- [x] Preserve HTTP 200 exact duplicate and HTTP 409 same-category/date different-payload semantics.

### 6.3 Dynamic server read layer and routes

- [x] Add `getPublishedCategories()`.
- [x] Add data-driven latest-report-per-category query for homepage.
- [x] Replace fixed type archive query with category-slug query.
- [x] Add category presentation mapping without exposing internal ingest metadata.
- [x] Add `/category/[slug]` dynamic archive page.
- [x] Return 404 for invalid, absent, invisible or unpublished categories.
- [x] Change report slug parser from fixed enum regex to date + validated generic category slug.
- [x] Keep existing report detail URLs unchanged.
- [x] Make report detail breadcrumb/category link use the data-driven category row.
- [x] Convert `/news` to permanent redirect → `/category/daily-news`.
- [x] Convert `/frameworks` to permanent redirect → `/category/framework-recommendation`.
- [x] Update canonical metadata to use dynamic category routes.
- [x] Update sitemap to enumerate published categories + reports dynamically.
- [x] Keep Preview noindex behavior intact.

### 6.4 Adaptive UI/UX

- [x] Refactor Header into stable first row (brand/home/theme) plus dynamic category rail.
- [x] Fetch categories server-side and pass minimal data to the navigation client boundary; do not add `/api/categories`.
- [x] Make category rail horizontally overflow-safe on desktop and mobile.
- [x] Keep semantic navigation links rather than implementing ARIA tabs for URL navigation.
- [x] Remove obsolete mobile hamburger state if category rail makes it unnecessary; update focus/Escape behavior accordingly.
- [x] Add active category state for category archive and report detail routes.
- [x] Change homepage from fixed two-card rendering to data-driven latest cards.
- [x] Change homepage grid to responsive 1 / 2 / 3-column behavior without assuming two categories.
- [x] Generalize homepage copy that currently refers to exactly two content types.
- [x] Preserve blue identity for `daily-news` and teal for `framework-recommendation`.
- [x] Add deterministic safe palette mapping for later categories without accepting CSS/colors/icons from ingest payload.
- [x] Replace category-specific `.frameworks` styling assumptions with reusable category tone semantics where needed.
- [x] Introduce shared sticky-header offset token for document scroll padding, report headings and TOC positioning.
- [x] Ensure category-navigation DB failure can degrade without breaking static error/404 shell rendering.
- [x] Verify light/dark contrast for every built-in category tone.

### 6.5 Automated verification

- [x] Add unit coverage for category slug validator and generic report slug round-trip/rejection.
- [x] Add unit coverage for v1/v2 ingest validation and v1 payload hash regression.
- [x] Add unit coverage for deterministic category tone mapping and category presentation.
- [x] Add isolated Neon integration fixtures with at least three published categories plus one empty/invisible category.
- [x] Verify migrated legacy rows and existing queries against isolated Neon.
- [x] Verify v1 legacy insertion and v2 first-category publication against isolated Neon.
- [x] Verify existing category metadata is not silently overwritten by recurring report payloads.
- [x] Verify unpublished/invisible categories do not appear in public category navigation.
- [x] Update Playwright desktop + Pixel 7 flows for dynamic category navigation.
- [x] Verify 3+ category homepage layout and long category labels.
- [x] Verify mobile category rail causes no document-level horizontal overflow.
- [x] Verify keyboard focus and navigation remain accessible after removing/reworking mobile menu behavior.
- [x] Verify TOC anchor positions remain visible under the two-row sticky header.
- [x] Verify `/news` and `/frameworks` permanent redirects.
- [x] Verify dynamic category metadata/canonical and sitemap output.
- [x] Confirm public browser navigation still performs no `/api/*` read requests.
- [x] Re-run read-error behavior and confirm Header fallback does not mask the intended application error state.
- [x] Retain production client JavaScript budget and verify Phase 6 does not materially regress it.

Phase 6.5 automated verification passed on branch head `a8cab16c1903f19d305a7c34063be84183956d37`: GitHub Quality run `35553333899` completed successfully, including frozen install, typecheck, unit tests, production build, isolated DB integration, Playwright critical paths, read-error coverage and production client-JavaScript budget. Matching Vercel Preview deployment `dpl_FEzvnXDLAEzBCV18CEgTyBgU1rMa` is READY. Synthetic dynamic-category fixtures remain isolated from Production.

### 6.6 Rollout and Production acceptance

- [x] Complete temporary Neon migration acceptance before Production schema changes.
- [x] Complete full TypeScript, unit, isolated DB integration, Playwright, read-error, production build and JS-budget checks.
- [x] Confirm Vercel Preview READY with isolated third-category UX verification.
- [x] Apply only the previously validated backward-compatible migration to Neon Production.
- [x] Before new app deployment, verify the current Production app and both recurring schema-v1 Tasks still operate on the migrated DB.
- [x] Deploy Phase 6 application to Production after schema-first compatibility passes.
- [x] Verify Production `/`, both canonical category pages, existing report detail and sitemap; legacy 308 behavior remains covered by the deployed `permanentRedirect()` implementation and Phase 6.5 direct-response Playwright checks.
- [x] Verify the deployed schema-v1 ingest path by exact-retrying both 2026-09-21 original Make payloads; both succeeded and Neon remained exactly one row per type/date.
- [x] Do not create a synthetic third-category Production report solely for acceptance.
- [x] Define the first future real v2 category publication as post-Phase-6 operational evidence; it must require no application redeploy.
- [x] Remove the Phase-6-verification-only Preview database host override before final delivery.
- [x] Squash-merge Phase 6 PR #13 to `main` as `d2c1711b00ff15fefef2991b177c8bc7b9dbea2a`.
- [x] Confirm Vercel Production deployment `dpl_CcpigyPQ7vsvZz8EkPjie5nZLP7K` READY.
- [ ] Confirm post-merge `main` Quality run `35554750408` after the serialized canonical-test queue drains.
- [x] Create the Phase 6.7 UI/UX planning branch without changing Production runtime.

# Phase 6 acceptance

- [ ] Category source of truth is data-driven and existing report data is intact.
- [ ] New safe v2 category slugs no longer require application source changes.
- [ ] Existing recurring v1 Tasks remain backward compatible and unattended.
- [ ] v1 exact-retry hashing and conflict behavior remain unchanged.
- [ ] Dynamic category navigation/home/archive/detail/metadata/sitemap are generated from persisted categories.
- [ ] Legacy `/news` and `/frameworks` remain reachable through permanent redirects.
- [ ] Mobile/desktop navigation, accessibility, sticky-header/TOC behavior and performance tests pass with 3+ categories.
- [ ] No unnecessary package, CMS, Redis, public read API or arbitrary payload-controlled UI surface was added.
- [ ] Production rollout is migration-safe and non-destructive.
- [ ] `/AI-build` matches the deployed system.
- [ ] Phase 6 is squash-merged to `main` and resulting Production deployment is READY.

---

## Post-launch backlog — only when justified

These are not launch blockers and should not be implemented preemptively:

- [ ] Custom domain, if desired.
- [ ] RSS/Atom feeds.
- [ ] Search across report content.
- [ ] Tag/topic filtering.
- [ ] Source-level relational model and analytics.
- [ ] Admin/CMS tooling, including category rename/reorder UI if a real operating need emerges.
- [ ] Redis or application caching based on measured traffic.
- [ ] Monitoring/alerting beyond Vercel/Neon/Make built-in observability.


## Phase 6.7 — UI/UX refinement

- [x] Create `phase6.7/ui-ux` from the Phase 6 Production merge.
- [x] Record the UI/UX refinement scope and non-goals in `phase-6-7-plan.md`.
- [x] Confirm visual direction and priorities with the user before implementation.
- [x] Replace the category rail with Radix Scroll Area, keep semantic links, and truncate only visible navigation labels to 5 characters + ellipsis.
- [x] Truncate homepage card category labels to 5 visible characters + ellipsis while retaining full accessible/title text.
- [x] Refine homepage 3+ category rhythm into a desktop horizontal Scroll Area so report cards never wrap to a second row; retain mobile vertical cards.
- [x] Convert category archive rows into compact whole-card links while preserving pagination.
- [ ] Refine report-detail reading hierarchy, TOC and source presentation.
- [ ] Recheck mobile/desktop overflow, focus, contrast, reduced-motion and sticky-anchor behavior.
- [ ] Preserve Server Components, dynamic categories, current ingest contract and client-JS budget.
- [x] Rebind `phase6.7/ui-ux` Preview to Neon `phase6-adaptive-isolated` for multi-category UI acceptance only.
- [ ] Remove the Phase 6.7 Preview-only isolated Neon routing helper before squash merge to `main`.
- [x] Update Playwright/unit acceptance for Scroll Area, visible-label truncation and whole-card archive navigation.
