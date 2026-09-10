# Changelog

## 2026-09-10

### Phase 3 — acceptance completed

- Completed the remaining accessibility/content-quality review with Playwright checks for one visible H1, non-skipped heading levels, meaningful accessible link labels, core light/dark WCAG AA normal-text contrast, keyboard/focus behavior and mobile overflow containment.
- Fixed the Next.js smooth-scroll metadata warning by declaring `data-scroll-behavior="smooth"` on the root HTML element.
- Added context-specific accessible labels to homepage actions and duplicate table-of-contents entries while preserving their visible text.
- Replaced `pnpm/action-setup@v4` with official `pnpm/setup@v2`, retaining pnpm 12.3.4, Node 24, cache and frozen-lockfile verification.
- Added isolated empty-state unit coverage without deleting or mutating Neon fixtures. Vitest now passes 17/17 tests across 5 files.
- Added a dedicated DB-unavailable Playwright server and test. It intentionally omits `DATABASE_URL`, verifies HTTP 500, the retryable application error state, retry behavior and home navigation; final result 1/1 passed.
- Added production-mode client JavaScript measurement using the existing `next build` output and `next start`, without adding a bundle-analyzer dependency. Cold-load totals are 505,082 bytes for `/`, 505,082 bytes for `/news`, and 506,241 bytes for the tested report detail, all below the 1 MiB guard.
- Confirmed public reading navigation performs no browser-side `/api/*` reads; Server Component/server-side DB reads remain the architecture boundary.
- No observed query latency or browser behavior justified EXPLAIN/query-plan tuning, Redis or additional cache infrastructure.
- Main Playwright suite completed at 29 passed / 5 viewport-conditional skips / 0 failed across Chromium desktop and Pixel 7 projects.
- Final implementation checkpoint `00bd49ee022e03ad88a117267058466455fcad7a` passed Quality run `34422203392`: frozen install, TypeScript, 17 unit tests, production build, 4/4 isolated DB integration tests, main Playwright suite, read-error suite and production client-JS budget.
- Matching Vercel Preview `dpl_3yqr4rGMSkLtEXazdVso6JaAvEew` reached READY.
- The React script-rendering message observed in `next dev` browser runs does not reproduce in the production `next start` performance run and has no failed behavioral test; it is retained as a non-blocking development-mode warning rather than prompting speculative product changes.
- Updated `/AI-build` README, Phase 3 plan, verification, architecture, decisions and TODO to mark Phase 3 acceptance complete. PR #8 remains subject to one final documentation-head CI/Preview check before required squash merge to `main`.

## 2026-09-09

### Phase 3 — secure DB and browser verification

- User configured GitHub Actions Repository Secret `TEST_DATABASE_URL` for the isolated Neon `phase3-testing` branch; no secret value was copied into chat, Git or documentation.
- Triggered the full `Quality` workflow with DB/E2E steps enabled. Frozen install, TypeScript, 15 Vitest unit tests and the Next.js production build continued to pass.
- The first DB integration run connected successfully and passed 3/4 checks. The remaining detail-rendering check exposed that the two 2026-09-09 test fixtures stored Markdown newlines as literal `\n` sequences.
- After explicit user authorization, modified only the Neon `phase3-testing` fixture rows to replace literal `\n` with real newlines. Verified the literal sequences were removed; Production data was not modified.
- Re-ran DB integration after the fixture correction: all 4 tests passed, covering latest reports, deterministic two-page news pagination, detail heading/source mapping and missing-report behavior.
- The first real Playwright run produced 17 passed / 3 conditional skips / 4 failed. All four failures were the same test-selector ambiguity: archive title selectors also matched the separate `閱讀：標題` arrow link through fuzzy accessible-name matching.
- Tightened only the Playwright archive selectors with `exact: true`; product UI/runtime behavior was unchanged. Commit: `5143e5e2458a2450b663bd2fd8a0d3d123b4e171`.
- GitHub Actions Quality run `34327164875` then completed successfully: 15 unit tests, 4 DB integration tests, production build and Playwright critical paths all passed. Playwright final result: 21 passed / 3 viewport-conditional skips / 0 failed.
- The matching Vercel Preview deployment `dpl_4JzY27ewXd9yirsnaDFnsrh8mosu` for commit `5143e5e` reached READY. PR #8 remains Draft and unmerged while accessibility/content-quality/performance review continues.
- CI surfaced non-blocking follow-up warnings for Next.js smooth-scroll metadata, React script rendering during browser tests, and the Node runtime target of `pnpm/action-setup@v4`; these are not treated as Phase 3 failures and require separate review before any implementation change.

### Phase 3 — testing and quality started

- Created implementation branch `phase3/testing-quality`; no Phase 3 code was written directly to `main`.
- Rechecked official Vitest and Playwright documentation before adding dependencies. Adopted Vitest 5.0.0 and Playwright 1.63.0 with the existing Node 24 / pnpm 12.3.4 toolchain.
- Extracted the public report presentation mapping into a pure `report-presenter` module so mapping and source filtering can be covered without a database.
- Added persistent Vitest coverage for Taipei midnight/date validation, slug/page parsing, Markdown summary/headings/reading time, safe source URLs, ingest source normalization and public report mapping.
- First GitHub Actions verification passed TypeScript, all 15 unit tests and the Next.js 16.3.4 production build. The initial temporary lockfile-sync run only failed its final push because the branch advanced concurrently; the next run synchronized the lockfile successfully.
- Changed the Vitest config to `.mts` after the first run surfaced the future Vite native-config CommonJS warning.
- Created Neon branch `phase3-testing` from Production for isolated testing. Production data was not modified. Added non-destructive fixtures only to the test branch: 13 `daily-news` rows and 2 `framework-recommendation` rows, including pagination, GFM, duplicate headings, code and structured-source cases.
- Added guarded DB integration tests. They require `TEST_DATABASE_URL` and reject execution when it matches `DATABASE_URL`.
- Added Playwright desktop/mobile critical-path tests for homepage, archives, pagination, detail, 404, source attributes, mobile menu, Escape focus restore, TOC, theme persistence, code-copy success/fallback and keyboard skip-link behavior.
- Added `.env.example` test settings and a permanent `Quality` workflow. Frozen install, typecheck, unit tests and build always run; DB integration and Playwright only run when a secure `TEST_DATABASE_URL` repository secret exists. Skipped DB/E2E steps are not counted as Phase 3 acceptance.
- Removed the one-time lockfile-sync workflow after the dependency lockfile was synchronized.

### Phase 2 delivery and Phase 3 handoff

- User authorized documentation updates and squash merge of PR #7 into main.
- Final implementation commit `82b5bef` completed Vercel Preview deployment with READY status; homepage HTTP check passed with the existing report.
- Updated the phase status and added `phase-3-plan.md` covering persistent tests, isolated fixtures, browser interactions, accessibility, performance and repeatable verification.
- Expanded Phase 3 TODOs to match the plan; these checks remain pending. Main deployment status is verified after the merge, not inferred from Preview.

### Phase 2 — approved design implementation

- Implemented the approved editorial design, real-data homepage, both paginated archives and slug-addressed report pages.
- Added centralized server-only query/presentation logic, shared Taipei dates and strict date/slug/page validation.
- Added Markdown AST summaries, reading time, collision-free headings, desktop/mobile TOC, GFM rendering, code copy and source attribution.
- Added theme persistence, responsive navigation, empty/error/404 states, canonical metadata, textual OG/Twitter metadata, sitemap and Preview noindex policy.
- Added a dependency lockfile, explicit esbuild build policy and upstream shadcn source attribution.
- Local TypeScript check and Next.js 16.3.4 production build passed.
- One-time verification passed for Taipei midnight and leap-day boundaries, slug round-trips, invalid page inputs, duplicate headings, fenced code, summary extraction, GFM tables and unsafe HTML/URL handling.
- Read-only Neon inspection found one existing `P1 End-to-End Test` framework report with no sources; no demo rows were inserted, and no production data was modified.
- pnpm 12.3.4 frozen-lockfile installation and production build passed, matching the repository package-manager declaration.
- Vercel Preview for implementation commit `b22e119` completed successfully. HTTP checks returned 200 for `/`, `/news`, `/frameworks` and the stored framework detail; news correctly displays its empty state and the detail preserves the stored Markdown with an empty-source message.
- HTTP checks returned 404 for an invalid calendar date, an absent valid report slug, a non-numeric page and an out-of-range archive page.
- Preview robots disallows all crawlers, page metadata is noindex, and sitemap responds successfully without exposing a preview index.
- The actual report renderer also passed a local server-rendered fixture covering code-copy controls, GFM tables, stable heading anchors, external-link attributes, skipped HTML and image-link behavior.
- Added long-title/URL wrapping, minimum action height and a narrow-phone navigation adjustment after static responsive review.
- PR: https://github.com/siyujellyfish/daily-report/pull/7. The final docs/style follow-up is built by the same Preview pipeline; final deployment status is checked before handoff.
- Phase 3 browser/mobile/accessibility interaction tests and persistent Vitest/Playwright suites remain pending. No browser interaction test is claimed in Phase 2.

### Planning and documentation synchronization

- Expanded `AI-build/todo.md` into the complete Phase 0–5 implementation plan with detailed work items and acceptance criteria.
- Defined Phase 2 as the public website and server-side read/query layer, including homepage, archives, report detail, Markdown rendering, source attribution, responsive UI and metadata.
- Defined Phase 3 as Vitest/Playwright coverage, accessibility, quality and performance verification.
- Defined Phase 4 as integration of the real `每日資訊新聞` and `每日框架工具推薦` ChatGPT Scheduled Tasks through the existing Make Scenario.
- Defined Phase 5 as final credential rotation, production hardening, unattended Scheduled Task activation and launch closure.
- Deferred the final `INGEST_SECRET` rotation until Phase 5 immediately before recurring production use, while retaining the requirement that the currently exposed development credential must not become the final production credential.
- Expanded `architecture.md` with the target public-page architecture, centralized query layer, Markdown rendering boundary, testing boundary and production payload flow.
- Expanded `decisions.md` with the agreed phase model, Server Component/read-layer strategy, Markdown safety policy, test strategy, Scheduled Task mapping and final secret-rotation procedure.
- Expanded `README.md` into the `/AI-build` index, current-status summary and working rules.
- Kept post-launch features such as search, RSS, Redis/cache, CMS and source-level analytics outside the launch-critical path until justified by real requirements.

### Security verification

- Redeployed Vercel Production after rotating `INGEST_SECRET` so the runtime loaded the updated environment variable.
- Updated the Make HTTP Authorization header and confirmed the authenticated ingestion returned HTTP 200 with `duplicate: true` for the existing P1 test payload.
- Confirmed Neon still contains exactly one row for that payload, so idempotency remained intact after credential rotation.
- During diagnostic verification, Make execution detail exposed the Authorization header value to the tool output. Treat that credential as compromised and rotate it once more before enabling production Scheduled Tasks.
- Future post-rotation verification must use only the high-level Scenario result and database row count; do not inspect module input/header data.

## 2026-09-08

### Initialization

- Bootstrapped the repository and created the `init/project-foundation` branch.
- Added Next.js 16, React 19, TypeScript, Tailwind CSS 4 and shadcn/ui project metadata.
- Added Neon serverless + Drizzle connection foundation.
- Added Vercel runtime environment variable template.
- Initialized `/AI-build` documentation.
- Connected the GitHub repository to Vercel.
- Provisioned the `daily-report` Neon project through the Vercel integration in Singapore.
- Completed the first successful Vercel Preview deployment.
- Squash-merged the initialization and Phase 1 foundation to `main`.
- Completed the first successful Vercel Production deployment.

### Phase 1 — Ingestion

- Added the `reports` Drizzle schema and report type enum.
- Added the versioned Zod ingest payload contract.
- Added `/api/v1/ingest` with Bearer authentication and JSON content validation.
- Added SHA-256 payload hashing and race-safe idempotent insertion.
- Added duplicate retry handling and same-day/type conflict protection.
- Validated the initial reports migration on a temporary Neon branch.
- Applied the validated `reports` schema migration to Neon production branch and removed the temporary migration branch.
- Converted the Make POC scenario into `Daily Report - Publish to Vercel` with JSON serialization and an HTTP POST step.
- Verified Make serializes populated sources correctly and observed that an empty sources input is emitted as `null`.
- Updated the ingest schema to normalize `sources: null` or an omitted sources field to an empty array.
- Disabled Vercel `Require Log in` to allow the fully public production site and Make ingestion endpoint.
- Completed the first successful Make → Vercel → Neon ingestion.
- Confirmed the runtime `DATABASE_URL` is valid by persisting the test report to Neon production.
- Re-sent the exact same payload and confirmed the API returned `duplicate: true` while Neon retained exactly one row.
- Recorded pre-live secret rotation as a hardening requirement before enabling real ChatGPT Scheduled Tasks.
- Rotated the setup/test `INGEST_SECRET` in Vercel and Make without recording the secret value in the repository.
- Confirmed the pre-redeploy runtime still rejected the rotated Make credential with HTTP 401, proving Vercel Production must be redeployed after the environment variable change.
- Updated architecture and decision records for the ingestion design.
