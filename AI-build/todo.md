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

### 3.1 Unit tests with Vitest

- [ ] Recheck current Vitest official docs/version before implementation.
- [ ] Add slug generation tests.
- [ ] Add slug parsing/invalid-input tests.
- [ ] Add Asia/Taipei date-boundary tests.
- [ ] Add report mapper/normalization tests.
- [ ] Add source normalization tests.
- [ ] Add pure query-helper tests where practical.
- [ ] Keep DB integration concerns separate from pure logic tests.

### 3.2 End-to-end tests with Playwright

- [ ] Recheck current Playwright official docs/version before implementation.
- [ ] Test homepage loading and latest-report links.
- [ ] Test `/news` archive.
- [ ] Test `/frameworks` archive.
- [ ] Test report-detail rendering.
- [ ] Test report 404 behavior.
- [ ] Test critical navigation flow.
- [ ] Test one representative mobile viewport.
- [ ] Test external source links render correctly.

### 3.3 Accessibility and content quality

- [ ] Verify semantic heading hierarchy.
- [ ] Verify keyboard navigation and visible focus states.
- [ ] Verify link labels are meaningful.
- [ ] Verify sufficient basic color contrast.
- [ ] Verify Markdown tables/code blocks remain usable on narrow screens.
- [ ] Verify empty-state and error-state copy.

### 3.4 Performance and database checks

- [ ] Confirm Server Component queries do not create unnecessary client requests.
- [ ] Inspect actual query plans/index usage only if observed behavior warrants it.
- [ ] Avoid adding Redis/cache infrastructure without a demonstrated need.
- [ ] Check generated page/deployment size for avoidable client-side JavaScript.
- [ ] Confirm public pages do not expose server environment variables.

### Phase 3 acceptance

- [ ] Vitest suite passes.
- [ ] Playwright critical-path suite passes.
- [ ] Vercel Preview succeeds without blocking errors.
- [ ] No critical accessibility or mobile-layout issue remains.
- [ ] Public read path does not expose credentials or unnecessary API surfaces.

---

## Phase 4 — Real Scheduled Tasks integration

### 4.1 `每日資訊新聞`

- [ ] Review the current Scheduled Task instructions without weakening its existing research requirements.
- [ ] Keep daily duplicate-avoidance behavior.
- [ ] Set `reportType = daily-news`.
- [ ] Set appropriate report title.
- [ ] Send full generated Markdown as `contentMarkdown`.
- [ ] Send `generatedAt` as actual execution time in ISO 8601 with `+08:00`.
- [ ] Send structured `sources` with explicit title and URL.
- [ ] Ensure no ChatGPT UI citation serialization is used as the data contract.
- [ ] If there are no relevant results, publish the defined no-result content rather than silently skipping the run.

### 4.2 `每日框架工具推薦`

- [ ] Review the current Scheduled Task instructions without weakening its selection/analysis requirements.
- [ ] Preserve historical recommendation deduplication.
- [ ] Set `reportType = framework-recommendation`.
- [ ] Set appropriate report title.
- [ ] Send full generated Markdown as `contentMarkdown`.
- [ ] Send `generatedAt` as actual execution time in ISO 8601 with `+08:00`.
- [ ] Send structured `sources` with explicit title and URL.
- [ ] Preserve the fallback rule for days without a compelling newly released tool.

### 4.3 End-to-end production-content validation

- [ ] Run `每日資訊新聞` once against the Make Scenario.
- [ ] Confirm the corresponding Neon row is created.
- [ ] Confirm it appears on `/`, `/news`, and its detail route.
- [ ] Run `每日框架工具推薦` once against the Make Scenario.
- [ ] Confirm the corresponding Neon row is created.
- [ ] Confirm it appears on `/`, `/frameworks`, and its detail route.
- [ ] Verify Markdown formatting survives ChatGPT → Make → Vercel → Neon → website.
- [ ] Verify source attribution survives the full data path.
- [ ] Verify report dates use Asia/Taipei correctly.

### Phase 4 acceptance

- [ ] Both real report types publish successfully through the same Make Scenario.
- [ ] Both are persisted and visible on the correct public routes.
- [ ] Scheduled Task generation remains independent of the OpenAI API.
- [ ] No manual approval is required for normal Scheduled Task → Make execution.

---

## Phase 5 — Production hardening and launch

### 5.1 Final credential rotation

- [ ] Generate a final new `INGEST_SECRET` immediately before recurring production use.
- [ ] Update Vercel Production `INGEST_SECRET`.
- [ ] Update the Make HTTP Authorization header with the same final secret.
- [ ] Do not paste or store the final secret in chat, Git, documentation or issue/PR text.
- [ ] Trigger a fresh Vercel Production deployment so the new environment variable is loaded.
- [ ] Verify the new credential using only the high-level Make Scenario result.
- [ ] Confirm database state separately without inspecting Make module/header input data.

### 5.2 Production deployment validation

- [ ] Confirm latest `main` Production deployment is READY.
- [ ] Confirm Production aliases/domain resolve publicly.
- [ ] Confirm `/api/v1/ingest` rejects requests without valid Bearer authentication.
- [ ] Confirm website routes remain publicly readable.
- [ ] Confirm Neon Production schema matches application expectations.
- [ ] Confirm no secret values exist in repository history introduced by this project workflow.

### 5.3 Enable recurring production delivery

- [ ] Confirm both Scheduled Tasks point to `Daily Report - Publish to Vercel`.
- [ ] Confirm both tasks use the final production contract.
- [ ] Enable/retain their intended recurring schedules.
- [ ] Observe the first unattended real daily executions at high level.
- [ ] Confirm each resulting report appears on the public website.

### 5.4 Documentation and release closure

- [ ] Update `architecture.md` to the final deployed architecture if implementation differs from plan.
- [ ] Update `decisions.md` with any final deviations.
- [ ] Mark completed TODO items.
- [ ] Add final launch entry to `changelog.md`.
- [ ] Review `/AI-build` for stale temporary notes.
- [ ] Ensure final merge to `main` is squash merge.

### Phase 5 acceptance

- [ ] Final credential is rotated and not exposed in diagnostic output.
- [ ] Both recurring Scheduled Tasks operate unattended.
- [ ] Public website displays newly generated reports correctly.
- [ ] Production deployment and database are healthy.
- [ ] `/AI-build` accurately represents the live system.

---

## Post-launch backlog — only when justified

These are not launch blockers and should not be implemented preemptively:

- [ ] Custom domain, if desired.
- [ ] RSS/Atom feeds.
- [ ] Search across report content.
- [ ] Tag/topic filtering.
- [ ] Source-level relational model and analytics.
- [ ] Admin/CMS tooling.
- [ ] Redis or application caching based on measured traffic.
- [ ] Monitoring/alerting beyond Vercel/Neon/Make built-in observability.
- [ ] Additional report types/schema versions.
