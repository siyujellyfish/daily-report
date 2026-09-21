# Decisions

## 2026-09-08 — Application architecture

- Use Next.js App Router as a single deployable application on Vercel.
- Keep the public website read-only and receive ChatGPT Scheduled Task output through Make.
- Do not use the OpenAI API for report generation.
- Use Neon PostgreSQL provisioned through Vercel Native Integration.
- Use Drizzle ORM with the Neon HTTP driver for serverless database access.
- Use Zod for external payload validation.
- Use Asia/Taipei as the business date boundary for reports.

## 2026-09-08 — Ingestion contract

- Accept only schema version `1` during the initial phase.
- Supported report types are `daily-news` and `framework-recommendation`.
- Authenticate Make with `Authorization: Bearer <INGEST_SECRET>`.
- Normalize the validated payload before calculating a SHA-256 hash.
- An exact retry returns HTTP 200 with `duplicate: true`.
- A new report returns HTTP 201.
- A different payload for an already occupied `(report_type, report_date)` returns HTTP 409 rather than overwriting existing content.
- Keep report sources in JSONB until source-level relational querying becomes a real requirement.
- Treat `sources: null` from Make as an empty source array for compatibility with optional empty arrays.

## 2026-09-08 — Database initialization

- The Vercel-provisioned Neon project uses PostgreSQL 18 in `aws-ap-southeast-1`.
- PostgreSQL 18 is accepted because the current Drizzle schema uses standard PostgreSQL types and constraints compatible with the target version.
- Production schema changes should be validated on a temporary Neon branch before being applied to the production branch.

## 2026-09-08 — Vercel access and Make delivery

- The website is intended to be fully public, so Vercel `Require Log in` is disabled for the project.
- The ingestion endpoint remains application-authenticated with `INGEST_SECRET`; public reachability does not make report writes anonymous.
- Preview-specific Vercel Authentication is not currently available through the exposed project setting, so previews are temporarily public as well.
- The Make Scenario `Daily Report - Publish to Vercel` is the bridge between ChatGPT Scheduled Tasks and the project API.
- Make is transport only; no OpenAI/AI content-generation modules are used.

## 2026-09-09 — Phase structure

Development is organized into the following lifecycle:

1. Phase 0 — Initialization.
2. Phase 1 — Ingestion.
3. Phase 2 — Public website and server-side read/query layer.
4. Phase 3 — Automated testing, accessibility and quality verification.
5. Phase 4 — Real ChatGPT Scheduled Tasks integration and content validation.
6. Phase 5 — Final security hardening and production launch.

`AI-build/todo.md` is the source of truth for detailed completion criteria.

## 2026-09-09 — Public website design

- Use React Server Components for report pages by default.
- Query Neon directly from server-side application code; do not create a redundant public read API unless a later client or integration actually requires one.
- Centralize report queries in a dedicated query/repository layer instead of embedding Drizzle queries throughout page components.
- Planned read functions include latest reports, type archives, and report detail by slug.
- Use deterministic slugs derived from `report_date + report_type`; do not add another mutable slug column unless future requirements justify it.
- Render saved Markdown with `react-markdown`; `remark-gfm` may be used for GFM features.
- Do not enable `rehype-raw` or render arbitrary stored HTML.
- Structured sources are rendered separately from Markdown as attribution links.
- Initial public routes are `/`, `/news`, `/frameworks`, and `/reports/[slug]`.

## 2026-09-09 — Testing strategy

- Use Vitest for deterministic application logic such as slug/date handling, normalization and mapping.
- Use Playwright for critical public-page workflows and report rendering.
- Every functional PR should pass its Vercel Preview build before squash merge.
- Avoid premature infrastructure or cache complexity; optimize only when observed traffic/query behavior warrants it.

## 2026-09-09 — Scheduled Task integration

- The two real Scheduled Tasks will reuse the same Make Scenario.
- `每日資訊新聞` maps to `reportType = daily-news`.
- `每日框架工具推薦` maps to `reportType = framework-recommendation`.
- Reports must send full Markdown content and structured source URLs.
- `generatedAt` must be ISO 8601 with an Asia/Taipei (`+08:00`) offset.
- Generation/research instructions should remain in ChatGPT Scheduled Tasks; Make must not reproduce or alter report content beyond transport serialization.

## 2026-09-09 — Secret rotation timing

- The currently configured credential is adequate for continued development but was exposed during diagnostic tool inspection and must not be used as the final production credential.
- The final `INGEST_SECRET` rotation is deliberately deferred until Phase 5, immediately before real recurring Scheduled Tasks are enabled.
- The final secret must be changed in both Vercel Production and the Make HTTP Authorization header, followed by a fresh Vercel Production deployment.
- Final credential verification must use only the high-level Make Scenario outcome and database state. Do not inspect Make HTTP module inputs or headers.
- Secret values must never be committed to Git or copied into `/AI-build`.

## 2026-09-09 — Git and documentation workflow

- All changes intended for `main` go through a feature/documentation branch and pull request.
- All merges into `main` use squash merge.
- `/AI-build` is updated alongside functional changes so architecture, decisions, TODO state and changelog remain synchronized with the deployed system.
- Package additions/upgrades require rechecking current official documentation and selecting the latest stable version compatible with the project before implementation.

## 2026-09-09 — Approved Phase 2 implementation

- Adopt the reviewed HTML demo's off-white/charcoal editorial design with blue news and teal framework categories.
- Use only actual stored reports; do not seed or embed demo reports in Production.
- Extract summaries, heading highlights and reading-time estimates locally from the saved Markdown AST; no AI API or additional generation step.
- Include `remark-gfm` for tables, task lists, footnotes and strikethrough. Keep raw HTML disabled.
- Use `next-themes` for system/light/dark preferences and shadcn Button, Card and Native Select for shared primitives.
- The shadcn registry endpoint was unavailable from the CLI; equivalent source was retrieved from the official shadcn/ui GitHub repository, retaining MIT attribution in `THIRD_PARTY_NOTICES.md`.
- Add a committed pnpm lockfile and explicit esbuild lifecycle approval for reproducible installs; preserve the declared pnpm 12.3.4 and Node 24 runtime.
- Retain TypeScript 5.9 compatibility rather than introducing an unrelated major upgrade.
- Render report pages on request, deduplicating only within the request. Do not mask unavailable database connections as empty data.
- Add canonical, textual Open Graph/Twitter metadata, sitemap and robots now; do not generate a social image. Previews are noindex.
- Preserve missing-report HTTP behavior by omitting a global loading boundary; add skeletons later only when observed latency justifies them.
- Phase 2 is delivered via a feature PR and Preview. Main/Production promotion requires a subsequent merge action; any such merge must use squash.

## 2026-09-10 — Phase 3 quality and verification closure

- Use an isolated Neon `phase3-testing` branch for DB fixtures and integration/browser verification. Phase 3 tests must never delete, truncate or write test fixtures into Production.
- Keep `TEST_DATABASE_URL` only as a GitHub Repository Secret or local environment value; tests refuse execution when it equals `DATABASE_URL`.
- Keep pure logic/unit coverage and real DB integration coverage separate. Do not extract artificial pure query helpers solely to increase unit-test counts when the behavior is more accurately verified against isolated Neon.
- Use Playwright desktop and Pixel 7 projects for public reading flows and responsive behavior.
- Treat empty-state verification as deterministic component rendering so it does not require destructive fixture manipulation.
- Verify unavailable-database behavior with a dedicated Playwright server that omits `DATABASE_URL`; preserve HTTP 500 and expose a retryable user-facing error state instead of treating DB failure as empty data.
- Add automated checks for one visible H1, non-skipped heading levels, meaningful accessible link labels, core light/dark WCAG AA text-token contrast, keyboard/focus behavior and local mobile overflow containment.
- Keep report reads server-side. Public browser navigation must not introduce a browser `/api/*` read layer without a real client requirement.
- Add a production `next start` client-JavaScript guard at 1 MiB uncompressed per tested cold route. Current routes are approximately 505–506 KB, so no additional bundle tooling or architectural rewrite is warranted.
- Do not run EXPLAIN/query-plan work or introduce Redis/cache without observed latency/query evidence. Phase 3 produced no such evidence.
- Use official `pnpm/setup@v2` with pnpm 12.3.4 and Node 24 in Quality CI; retain frozen-lockfile verification.
- Fix concrete framework/accessibility warnings when evidence identifies an application issue, such as Next.js smooth-scroll metadata and ambiguous accessible labels.
- A React script-rendering message that appears only under `next dev`, does not reproduce in the production `next start` verification, and causes no failed behavior is recorded as non-blocking rather than prompting speculative dependency/product changes.
- Phase 3 acceptance requires the final implementation checkpoint to pass TypeScript, unit, isolated DB integration, browser, read-error, production build and client-JS budget checks, with a READY Vercel Preview. PR #8 is delivered to `main` only by squash merge after the final documentation head is reverified.

## 2026-09-10 — Phase 4 Scheduled Task integration planning

- Reconcile project labels with the actual active automation names: `開發技術每日追蹤` maps to `daily-news`; `每日突破性工具推薦` maps to `framework-recommendation`.
- Use only `Daily Report - Publish to Vercel` for Phase 4. The disabled historical `Scheduled Task POC Test` and old `Daily Report - ChatGPT POC` are not production contract references.
- Freeze the Make on-demand interface as `reportType`, `title`, `contentMarkdown`, `generatedAt`, and structured `sources[]`; do not use the old POC `sourcesJson` convention.
- Keep `contentMarkdown` free of ChatGPT UI citation serialization. Source attribution for persistence/rendering must be transported as structured `{ title, url }` items.
- Use `generatedAt` from the real task execution time with explicit `+08:00`; `report_date` remains derived by the ingest service using Asia/Taipei.
- Title conventions are `開發技術每日追蹤｜YYYY-MM-DD` for `daily-news` and `每日突破性工具推薦｜<工具名稱>` for framework recommendations.
- Preserve the existing generation rules rather than moving research, deduplication, fallback selection, translation, summarization or editorial logic into Make.
- Preserve daily-news no-result semantics, but still publish a deterministic Markdown no-result report with `sources = []` so a scheduled run is observable end to end rather than silently skipped.
- Preserve framework recommendation fallback behavior: if no compelling newly released tool exists, select a recent fast-growing representative tool and explain why rather than emitting an empty report.
- Do not permanently add Make publishing to the two currently enabled recurring Tasks during Phase 4. Doing so would begin recurring production writes before the Phase 5 final credential rotation.
- Validate Phase 4 through two one-shot shadow Scheduled Tasks that copy the real prompts and add only the tested delivery suffix. Each must run from its schedule without run-time manual approval.
- Before each shadow run, read-only check Neon Production for an occupied `(report_type, report_date)`. Never delete/update a Production report to create test space; move validation to a non-colliding business date instead.
- During credential-bearing Make validation, inspect only high-level scenario execution outcome. Do not inspect the HTTP module Authorization input/header.
- An exact duplicate retry may be used to confirm idempotency; a different payload for an occupied type/date must remain a 409 and must not be worked around with manual DB edits.
- Phase 4 completes only after both real report types persist correctly and render on the homepage/archive/detail paths with Markdown, structured sources and Asia/Taipei date intact.
- Phase 5, after final `INGEST_SECRET` rotation and Vercel redeploy, will apply the Phase 4 verified delivery suffix to the two actual recurring Tasks while retaining their existing schedules and research rules.
- Detailed procedure and acceptance are maintained in `phase-4-plan.md`.

## 2026-09-11 — Phase 5 production launch

- The final `INGEST_SECRET` is maintained only in Vercel Production and the Make HTTP Authorization configuration. Its value is deliberately never read back into ChatGPT, Git, Issue/PR text or `/AI-build`.
- The final Make HTTP module is not edited through ChatGPT tooling because safe full-config replacement would require first reading the credential-bearing module configuration. Credential rotation therefore remains a manual Vercel/Make UI operation; automated verification is limited to high-level Make outcomes plus independent Neon checks.
- A rotation-era mismatched Bearer produced `Unauthorized` without creating a new Production row; after Make and Vercel were synchronized, the same exact-retry payload succeeded and remained exactly once. This is accepted as the final Bearer enforcement/idempotency gate without inspecting the header value.
- The Phase 4 verified delivery contract is now attached to the two actual recurring Tasks. Only their prompts were extended; original research/selection rules, `flexible_schedule`, daily RRULE and enabled state remain unchanged.
- `開發技術每日追蹤` is the canonical `daily-news` task and publishes deterministic no-result Markdown on empty days rather than silently skipping delivery.
- `每日突破性工具推薦` is the canonical `framework-recommendation` task and retains the representative fast-growing-tool fallback rather than publishing an empty report.
- Launch acceptance requires the original recurring schedules to trigger automatically; manual runs or temporary high-frequency schedules are not substitutes.
- The first live unattended recurring cycle on 2026-09-11 passed for both types: Make reported `startedBy = auto`, Neon contained exactly one row for each type/business-date, persisted Markdown contained no ChatGPT UI tokens, and the homepage/archive/detail routes rendered successfully.
- Production verification remains non-destructive. No report is UPDATE/DELETE-ed for acceptance, collision handling or retry testing.
- Phase 5 release documentation is delivered through PR #11 and all changes entering `main` remain subject to the repository-wide squash-merge rule.

## 2026-09-17 — Phase 6 adaptive categories planning

- Introduce Phase 6 as a post-launch functional phase for data-driven report categories rather than extending the fixed two-value enum each time a new push type is added.
- Make `report_categories` the future category source of truth. Keep `reports.report_type` as the existing column name for compatibility, but migrate it from the fixed PostgreSQL enum to a string column with a foreign key to category `slug`.
- Keep category slug as an immutable machine identifier and separate it from user-facing `label` and `description`.
- Seed the two current categories with stable ordering; later automatically created categories use deterministic created-time/slug ordering unless an explicit server-side sort order is later assigned.
- Do not derive categories by AI from report content. A new category is introduced only by an authenticated, validated schema-v2 ingest payload.
- Keep schema version 1 fully compatible for the two currently enabled recurring Scheduled Tasks. Do not require an atomic migration of Tasks, Make and application code.
- Add schema version 2 with generic safe `reportType` slug plus bounded `categoryLabel` and `categoryDescription`; do not accept arbitrary CSS, color, icon, visibility or route metadata from payloads.
- Existing category metadata is canonical. Normal report ingest must not silently rename an existing category because a Scheduled Task sends a typo or changed label.
- Preserve v1 normalized payload hashing behavior so an exact retry created before/after the Phase 6 application deployment remains idempotent.
- The target canonical archive route is `/category/[slug]`. `/news` and `/frameworks` remain as permanent redirects to their corresponding category routes; existing `/reports/YYYY-MM-DD-<type>` URLs remain unchanged.
- The public read path remains Server Components → Drizzle → Neon. Dynamic category navigation must not introduce a browser-side `/api/categories` layer.
- Refactor the Header into a stable first row and a horizontally scrollable category rail. Treat category entries as navigation links, not ARIA tabs, because each category has its own URL and browser history entry.
- Make the homepage latest-report cards data-driven and responsive to 1/2/3+ categories; remove copy and CSS assumptions that exactly two categories always exist.
- Keep `daily-news` blue and `framework-recommendation` teal. Future category visual tones come only from an application-controlled, accessibility-checked deterministic palette rather than external payload styles.
- Add one shared sticky-header offset token so TOC and anchor scrolling remain correct after the Header gains a second row.
- Only visible categories with at least one stored report appear publicly. An empty category row created before a failed report insert must not produce an empty public tab.
- Phase 6 does not require a new package, CMS, Redis, global client state library or alternate DB driver by default. Validate current Neon HTTP non-interactive transaction/batch capabilities first; change drivers only if a demonstrated implementation requirement exists.
- Validate the enum-to-varchar/FK migration on a temporary Neon branch and prove the old application remains functional before using a schema-first Production rollout.
- Third-category UI/ingest verification uses isolated Neon/Preview data. Do not create a synthetic Production category/report solely to prove the feature.
- Detailed implementation and acceptance criteria are maintained in `phase-6-plan.md` and `todo.md`.


## 2026-09-18 — Phase 6.2 ingestion implementation

- Keep `POST /api/v1/ingest` as the single authenticated write endpoint; schema versioning happens inside the payload contract rather than by adding a second route.
- Use Zod `z.discriminatedUnion("schemaVersion", ...)` so schema v1 and v2 have explicit independent contracts.
- Preserve the schema-v1 field order, trimming behavior, `sources: null/omitted → []` normalization and SHA-256 serialization behavior. A fixed regression fixture protects the pre-Phase-6 normalized hash.
- Schema v1 remains limited to `daily-news` and `framework-recommendation` so the two live recurring Tasks do not silently change semantics.
- Schema v2 accepts category slugs matching `^[a-z0-9]+(?:-[a-z0-9]+)*$` with maximum length 80, plus trimmed label up to 120 characters and description up to 500 characters.
- Do not accept `sort_order`, `is_visible`, arbitrary colors/styles/icons or route metadata from v2 payloads.
- Treat the first stored category metadata as canonical. Subsequent report ingestion for the same slug may report a metadata mismatch but must not UPDATE the stored label/description.
- Use the existing Neon HTTP driver and Drizzle `db.batch()` for v2 category create/reuse, canonical metadata read and report insert. The batch uses Neon HTTP's non-interactive transaction primitive, so no WebSocket driver is introduced.
- Preserve the existing `payload_hash` and `(report_type, report_date)` conflict semantics: exact retry remains HTTP 200 + `duplicate: true`; different same-category/date content remains HTTP 409.
- Keep all Phase 6 synthetic v2 data on `phase6-adaptive-isolated`. The isolated `security-news` fixture is intentionally absent from Production.
- No package was added or upgraded for Phase 6.2.


## 2026-09-21 — Phase 6.3/6.4 dynamic read and adaptive UI

- Treat persisted `report_categories` rows as the public category source of truth; public categories must be visible and have at least one report.
- Order categories by `sort_order ASC NULLS LAST`, then `created_at ASC`, then `slug ASC`.
- Keep public category projections minimal: slug, label and description from the database; tone, route, icon, eyebrow and issue labels are application-owned presentation values.
- Keep the existing report URL shape and generalize only the parser to a validated category slug after the fixed date prefix.
- Make `/category/[slug]` canonical. Keep `/news` and `/frameworks` as permanent redirects rather than duplicated archive pages.
- Generate category archive metadata and Production sitemap entries from persisted categories; do not list legacy redirect URLs as canonical sitemap entries.
- Keep category reads server-side. The Client navigation receives only minimal serialized category navigation data and never fetches a browser `/api/categories`.
- Replace the mobile hamburger with an always-visible horizontally scrollable category rail. Category navigation remains semantic links, not ARIA tabs.
- Determine active category from the canonical category path or the report-detail category suffix.
- Preserve blue/teal for the two legacy categories. Future category colors come from a deterministic application-owned palette; payloads remain unable to control visual presentation.
- Use one `--sticky-header-offset` CSS token for scroll padding, report anchors and TOC positioning after introducing the second Header row.
- Catch Header category-query failures so the navigation shell can degrade without replacing the intended page-level database error state.
- Keep the legacy Phase 3 CI database isolated. To support current CI reads, add only the category table and two legacy category rows there; do not use it as the canonical Phase 6 synthetic-data branch and do not alter Production.


## 2026-09-21 — Phase 6.5 canonical acceptance

- GitHub `TEST_DATABASE_URL` now points to Neon `phase6-adaptive-isolated`; the Quality integration suite proves that connection by asserting the canonical ordered published-category fixture set before write-path tests.
- Do not read or print the Repository Secret value to verify it. Re-running the existing Quality workflow after the secret change is sufficient evidence because the old Phase 3 assertions fail against the canonical Phase 6 row counts/category set.
- Keep persistent acceptance fixtures isolated: four published categories, one visible-empty category and one hidden-published category exist only on `phase6-adaptive-isolated`.
- Keep integration write fixtures ephemeral and run-scoped. Use `GITHUB_RUN_ID` to derive a unique v2 category slug and v1 report date so runs cannot delete or collide with each other's fixtures; cleanup remains mandatory in `afterAll`.
- Serialize the complete Quality workflow with GitHub Actions concurrency group `daily-report-canonical-test-db` and `queue: max`. Run-scoped identities prevent direct row collisions, while workflow serialization prevents one run's briefly-visible v2 category from entering another run's public-category/browser assertions.
- Treat long labels as a real responsive input, not a test-only edge case. Category rail max-content width must be contained, and report detail actions must be allowed to shrink/wrap.
- Preserve local overflow behavior for tables/code/rails; do not mask document overflow with `body { overflow-x: hidden }`.
- Phase 6.5 acceptance is automated and does not require manual UI sign-off because desktop + Pixel 7, redirects, metadata/sitemap, anchor positioning, accessibility, read-error and client-JS budget are all covered by the final Quality gate.
- Production remains excluded from synthetic acceptance writes; no Phase 6 fixture category/report is present there.


## 2026-09-21 — Phase 6.6 rollout and Phase 6.7 handoff

- Phase 6 is delivered through PR #13 using squash merge only; Production commit is `d2c1711b00ff15fefef2991b177c8bc7b9dbea2a`.
- The temporary branch-specific Preview database-host override was verification-only and was removed before Production delivery.
- Production must contain only real categories/content; synthetic third-category acceptance remains isolated in Neon `phase6-adaptive-isolated`.
- Post-deploy schema-v1 compatibility may be verified with exact retries of already-persisted original payloads; this must not create replacement or synthetic Production content.
- Phase 6.7 is a UI/UX refinement phase. It does not reopen the category data model, route architecture, v1/v2 ingest contract, Make transport role or Server Component read boundary by default.
- Phase 6.7 implementation starts only after visual direction and priorities are confirmed; no dependency addition is assumed.


## 2026-09-21 — Remove persistent test data

- Phase 6.7 acceptance allows the temporary Preview database routing override to be removed before merge.
- `phase6-adaptive-isolated` remains the CI database target but must be clean at rest.
- Quality owns fixture lifecycle: deterministic synthetic rows are seeded before DB/browser acceptance and removed in an `always()` cleanup step.
- Obsolete Neon test branches may be removed once no active configuration references them.
- The historical Production setup report titled `P1 End-to-End Test` is test data and should be deleted during this explicitly authorized cleanup; normal Production reports are not modified.

## 2026-09-21 — Phase 7 App Store limited-free weekly publishing

- Add one recurring Sunday Scheduled Task for Taiwan App Store temporary paid-to-free recommendations, including both games and applications.
- Treat `app-store-limited-free` as a real dynamic schema-v2 category with label `App限免`; do not add a hard-coded application enum or route.
- Upgrade the existing Make JSON serialization to schema v2 and require category label/description. Keep the API's schema-v1 compatibility path intact.
- Update both existing daily Scheduled Tasks with their already-canonical category metadata before making the new Make fields required, preventing a transport-interface regression.
- Do not inspect or rewrite the Make HTTP request module while changing the Scenario interface/JSON mapper; the final Authorization secret remains outside readable tooling.
- Define limited-free strictly as a previously paid App becoming directly free for a temporary period. Permanent-free, freemium, free trials, subscription promotions and in-app-purchase discounts are not equivalent.
- Require Taiwan App Store availability plus price/promotion-history evidence before including an item. Exclude uncertain candidates instead of weakening the definition.
- Use the public category/history pages as the published-state ledger for cross-run deduplication rather than adding a new database table solely for App tracking.
- Do not re-present an already pushed App as new. Revalidate historical active items every Sunday and list only those still free in Taiwan.
- Unknown end dates must be explicit and rechecked on each later run. Do not infer a clock time from date-only evidence.
- Always publish the weekly check, including weeks with no new qualifying items, so active/unknown-limit state remains observable.
- Use exactly two stable Markdown sections: new never-pushed items, then an already-pushed still-active summary table. Do not add a redundant third status table.
- Because the request specifies Sunday but no exact time, use a flexible morning schedule with an 08:00 baseline in Asia/Taipei rather than inventing an exact execution time.
- Do not create a synthetic Production report to validate the new category. First Production acceptance is the original Sunday run on 2026-09-27.
- No application dependency, code path, schema migration or database branch change is required for this phase.
