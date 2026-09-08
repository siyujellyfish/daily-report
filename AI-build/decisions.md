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
- The initial production schema change is validated on a temporary Neon branch before being applied to the production branch.

## 2026-09-08 — Vercel access and Make delivery

- The website is intended to be fully public, so Vercel `Require Log in` is disabled for the project.
- The ingestion endpoint remains application-authenticated with `INGEST_SECRET`; public reachability does not make report writes anonymous.
- Preview-specific Vercel Authentication is not currently available through the exposed project setting, so previews are temporarily public as well.
- The Make scenario `Daily Report - Publish to Vercel` is the bridge between ChatGPT Scheduled Tasks and the project API.
- The setup/test ingestion secret must be rotated before enabling the real daily schedules, then updated in both Vercel and Make and validated once more.
