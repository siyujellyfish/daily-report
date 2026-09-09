# Changelog

## 2026-09-09

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
- Added Neon serverless + Drizzle ORM connection foundation.
- Added Vercel runtime environment variable template.
- Initialized `/AI-build` project documentation.
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
- Applied the validated `reports` schema migration to the Neon production branch and removed the temporary migration branch.
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
