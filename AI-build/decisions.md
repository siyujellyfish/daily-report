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
