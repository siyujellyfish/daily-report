# P0 — Automatic daily report recovery

Date: 2026-10-09. Status: implementation branch / pre-production acceptance.

## Incident and scope

2026-10-08 framework recommendation did not reach Make until manually published.
2026-10-09 at approximately 18:42 Asia/Taipei: Neon had daily-news but no framework-recommendation, and Make had only the news execution. Root cause before Make is not yet isolated. Avoid claiming a confirmed upstream root cause.

Scope is the two daily report types only. App Store weekly publication is not changed.

## Design

- Primary ChatGPT Scheduled Tasks continue to run at their existing 08:00 Asia/Taipei flexible schedule.
- Independent 10:00 Asia/Taipei recovery Task checks the **current Taipei business date** for both daily types via `GET /api/v1/reports/status?reportType=<type>&reportDate=YYYY-MM-DD`.
- Status endpoint returns only `reportType`, `reportDate`, `published` (200), generic 400 or 503; `Cache-Control: private, no-store`. The existence bit is already publicly derivable from the report archive. No secret or private content is exposed; no write permission is granted.
- A failed/malformed status lookup is **unknown**, not `published=false`: retry status twice with bounded waits, then report failure. Never publish on unknown status.
- If published, skip. If missing, independently research/generate a complete report using the existing category-specific research rules; verify sources; send the existing schema-v2 Make fields, preserving reportType, category metadata, Markdown and sources.
- Immediately before publishing, check status again. If now present, skip.
- Submit exactly one payload. On transient Make failure, retry at most twice with the **same payload**, never regenerate between retries. Check status after ambiguous errors before retrying.
- Treat a Make response as provisional: require success=true and receivedType to match. Finally query status and require published=true. If Make returned error/409 but the correct slot is now present, classify as already-published (not an overwrite); never claim the replacement payload was stored.
- A 409 means a different report won the race. Never overwrite/delete a Production report.
- Retry status on transient failure; alert in the Task's result if verification remains unknown or missing.
- No OpenAI API purchase or Make content-generation module. Recovery research occurs inside the independent ChatGPT Scheduled Task.

## Limits

- The status API is read-only and intentionally unauthenticated because ChatGPT Tasks cannot securely inject the Vercel ingest secret; existence of a published report is already public. Restricting response to two fixed daily categories avoids metadata leakage.
- There is no claim of durable queueing or guaranteed exactly-once execution of content generation. The DB uniqueness constraints guarantee at most one persisted report per type/day.
- Status checks must use the same Asia/Taipei business date. Do not publish yesterday's content using today's generatedAt; historic backfill requires a separate controlled workflow.
- No changes to Make's credential-bearing HTTP module; secret rotation is a separate coordinated operation.
- This branch adds no new packages and no DB migration.

## Acceptance checklist

- [ ] TypeScript, unit suite, build and isolated integration CI pass.
- [ ] Preview status route: missing/present/invalid/unavailable and no-store behavior verified.
- [ ] One-shot shadow recovery task runs unattended, detects a safe missing test slot, publishes via Make and verifies Neon without modifying existing Production rows.
- [ ] Race/409 and ambiguous Make success/error are verified without overwriting any report.
- [ ] Production deploy and 10:00 daily recovery Task are enabled only after CI and one-shot acceptance.
- [ ] First unattended production recovery cycle observed.

## Reference docs

- https://nextjs.org/docs/app/api-reference/file-conventions/route
- https://orm.drizzle.team/docs/select
- https://vitest.dev/guide/mocking/modules
