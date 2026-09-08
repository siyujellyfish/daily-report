# Changelog

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
- Updated architecture and decision records for the ingestion design.
