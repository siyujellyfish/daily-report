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
