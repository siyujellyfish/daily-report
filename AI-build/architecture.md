# Architecture

## Data flow

```text
ChatGPT Scheduled Tasks
	↓
Make App
	↓
Make Scenario
	↓
HTTPS POST /api/v1/ingest
	↓
Bearer authentication
	↓
Zod payload validation
	↓
SHA-256 idempotency check
	↓
Drizzle ORM / Neon HTTP
	↓
Neon PostgreSQL
	↓
Next.js Server Components
	↓
Public website
```

## Runtime boundaries

- Vercel hosts the Next.js application and Route Handlers.
- Neon is provisioned through the Vercel Native Integration.
- `DATABASE_URL` and `INGEST_SECRET` are runtime secrets and must never be committed.
- The public website is read-only; only `/api/v1/ingest` writes report data.
- The application uses Node.js runtime for the ingest endpoint because it uses Node cryptography primitives.

## Report storage

The initial data model uses a single `reports` table. Source links are stored as JSONB because the current product only renders source attribution and does not require relational analytics on individual sources.

Idempotency is enforced at two levels:

1. `payload_hash` is globally unique, so retries of the exact same payload are safe.
2. `(report_type, report_date)` is unique, so a second, different report cannot silently replace the day's existing report.
