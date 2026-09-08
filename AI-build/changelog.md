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

### Phase 1 — Ingestion

- Added the `reports` Drizzle schema and report type enum.
- Added the versioned Zod ingest payload contract.
- Added `/api/v1/ingest` with Bearer authentication and JSON content validation.
- Added SHA-256 payload hashing and race-safe idempotent insertion.
- Added duplicate retry handling and same-day/type conflict protection.
- Updated architecture and decision records for the ingestion design.
