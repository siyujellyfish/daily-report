# Architecture

## System data flow

```text
ChatGPT Scheduled Tasks
    ├─ 每日資訊新聞
    └─ 每日框架工具推薦
            ↓
          Make App
            ↓
  Daily Report - Publish to Vercel
            ↓
   HTTPS POST /api/v1/ingest
            ↓
     Bearer authentication
            ↓
      Zod payload validation
            ↓
     payload normalization
            ↓
     SHA-256 idempotency
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

- Vercel hosts the single Next.js App Router application and Route Handlers.
- Neon is provisioned through the Vercel Native Integration.
- Database access uses `drizzle-orm/neon-http` with `@neondatabase/serverless`.
- `DATABASE_URL` and `INGEST_SECRET` are runtime secrets and must never be committed.
- The public website is read-only; only `/api/v1/ingest` writes report data.
- The ingest endpoint runs on the Node.js runtime because SHA-256 hashing uses Node cryptography primitives.
- Make only transports report data. It does not generate content and does not call the OpenAI API.
- ChatGPT Scheduled Tasks remain responsible for research and Markdown report generation.

## Report storage

The initial data model uses one `reports` table:

```text
reports
├─ id UUID
├─ schema_version
├─ report_type
├─ report_date
├─ title
├─ content_markdown
├─ sources JSONB
├─ generated_at
├─ received_at
└─ payload_hash
```

Supported `report_type` values:

- `daily-news`
- `framework-recommendation`

Source links remain JSONB because the product only needs attribution/rendering. A relational source table should be introduced only if source-level analytics, filtering, deduplication or cross-report queries become real requirements.

## Ingestion behavior

Idempotency is enforced at two levels:

1. `payload_hash` is globally unique. An exact Make/ChatGPT retry returns HTTP 200 with `duplicate: true`.
2. `(report_type, report_date)` is unique. A different payload for an already occupied type/date returns HTTP 409 and never silently overwrites the stored report.

Other ingestion constraints:

- Only schema version `1` is currently accepted.
- `sources: null` or omitted sources are normalized to `[]` for Make compatibility.
- Source URLs must remain structured data rather than ChatGPT UI citation serialization.
- Business date boundaries use `Asia/Taipei`.

## Phase 2 — implemented public read architecture

Pages:

```text
/
  latest daily-news
  latest framework-recommendation

/news
  daily-news archive

/frameworks
  framework-recommendation archive

/reports/[slug]
  full report detail
```

Expected slug format:

```text
YYYY-MM-DD-daily-news
YYYY-MM-DD-framework-recommendation
```

The public read path should use React Server Components and direct server-side database queries. Do not introduce a browser-side REST API solely for pages that can query Neon on the server.

## Query layer

Database access for pages should be centralized outside page components. Planned query functions include:

```text
getLatestReports()
getReportsByType(reportType, pagination)
getReportBySlug(slug)
```

Responsibilities of the query layer:

- centralize Drizzle query construction;
- consistently map database records into presentation-friendly report objects;
- keep Asia/Taipei date and slug conversion in one place;
- support pagination without duplicating SQL/Drizzle logic across routes;
- make later unit testing possible without coupling rendering directly to database syntax.

## Markdown rendering

- Persist source content as Markdown, never rendered HTML.
- Render with `react-markdown`.
- Use `remark-gfm` if GitHub Flavored Markdown support is required.
- Do not enable `rehype-raw` or arbitrary raw HTML rendering.
- Render source links in a dedicated attribution section based on structured `sources` data.

## Phase 3 target — quality boundary

Vitest should cover pure application logic such as:

- slug generation/parsing;
- Asia/Taipei report-date handling;
- payload/report mapping;
- source normalization;
- query helper behavior where practical.

Playwright should cover critical public flows:

- home page;
- news archive;
- framework archive;
- report detail;
- missing report / 404;
- mobile/basic responsive behavior where material.

## Phase 4 target — production content delivery

Both Scheduled Tasks will invoke the same Make Scenario using different `reportType` values:

```text
每日資訊新聞
→ daily-news

每日框架工具推薦
→ framework-recommendation
```

Production payload:

```json
{
  "schemaVersion": 1,
  "reportType": "daily-news | framework-recommendation",
  "generatedAt": "ISO 8601 with +08:00 offset",
  "title": "...",
  "contentMarkdown": "...",
  "sources": [
    { "title": "...", "url": "https://..." }
  ]
}
```

## Phase 5 target — launch hardening

Before enabling recurring production delivery:

- rotate `INGEST_SECRET` one final time in both Vercel and Make;
- redeploy Vercel Production after environment-variable rotation;
- verify only through the high-level Make Scenario result and database state;
- do not inspect Make module input/header data during final credential verification;
- confirm Production deployment is READY and the public domain is reachable;
- confirm both real report types can be ingested and rendered;
- complete `/AI-build` records and final launch checklist.

## Phase 2 implementation details (2026-09-09)

- Central query layer: `src/lib/reports.ts` (`server-only`), with explicit public fields and request-scoped React cache.
- Presentation helpers: `report-date.ts`, `report-types.ts`, `report-markdown.ts`; ingestion reuses the centralized Taipei date helper.
- Markdown parser and renderer share one AST heading transform; no browser-side Markdown processor or public read API.
- Client code is limited to navigation/theme and code-copy feedback. Report bodies and database reads remain server-rendered.
- `next-themes` sets the `data-theme` attribute before hydration; only the HTML theme mismatch is suppressed.
- UI uses the approved HTML demo's editorial tokens with shadcn Button, Card and Native Select primitives.
- Metadata utilities live in `src/lib/site.ts`; robots and sitemap use the same canonical origin and Preview policy.
- Existing ingestion contract, production database schema and Make Scenario are unchanged.
- Detailed design: `phase-2-design.md`. Validation evidence is recorded in `changelog.md`.
