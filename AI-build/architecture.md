# Architecture

## System data flow

```text
ChatGPT Scheduled Tasks
    ├─ 開發技術每日追蹤
    │    └─ reportType: daily-news
    └─ 每日突破性工具推薦
         └─ reportType: framework-recommendation
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

The public read path uses React Server Components and direct server-side database queries. No browser-side REST API is used for public report reads.

## Query layer

Database access for pages is centralized in `src/lib/reports.ts` with an explicit public projection and presentation mapping outside page components.

Implemented query functions:

```text
getLatestReports()
getReportsByType(reportType, page)
getReportBySlug(slug)
getReportSitemapEntries()
```

Responsibilities of the query layer:

- centralize Drizzle query construction;
- consistently map database records into presentation-friendly report objects;
- keep Asia/Taipei date and slug conversion in one place;
- support pagination without duplicating SQL/Drizzle logic across routes;
- expose only public report fields to rendering code.

## Markdown rendering

- Persist source content as Markdown, never rendered HTML.
- Render with `react-markdown` + `remark-gfm`.
- Do not enable `rehype-raw` or arbitrary raw HTML rendering.
- Render source links in a dedicated attribution section based on structured `sources` data.
- Heading IDs are deterministic and collision-free; duplicate visible headings receive distinct anchors and accessible TOC labels.
- Wide Markdown tables and code blocks scroll locally rather than forcing document-level mobile overflow.

## Phase 3 — implemented quality boundary

Testing layers are intentionally separated:

```text
Vitest unit
  pure date / slug / Markdown / schema / presentation logic
  isolated component empty-state rendering

Vitest integration
  Neon phase3-testing read queries only
  TEST_DATABASE_URL safety guard

Playwright main
  desktop + Pixel 7 public flows
  navigation / archives / detail / 404
  accessibility / theme / TOC / clipboard / overflow

Playwright read-error
  independent Next.js server without DATABASE_URL
  HTTP 500 + retryable application error UI

Playwright performance
  production next start
  cold-load client JavaScript budget
```

CI behavior:

- `pnpm/setup@v2` supplies pnpm 12.3.4 and Node 24.
- Frozen lockfile, TypeScript, unit tests and `next build` always run.
- DB integration and browser suites require repository secret `TEST_DATABASE_URL`.
- Production build uses an intentionally invalid localhost database URL and does not access Production.
- DB integration rejects `TEST_DATABASE_URL === DATABASE_URL`.
- Public browser reading flow is verified to perform no `/api/*` read requests.
- Client JavaScript budget is 1 MiB uncompressed per tested cold route; current measured totals are approximately 505–506 KB.

Observed behavior did not justify a Redis/cache layer or query-plan tuning in Phase 3. Those remain evidence-driven future optimizations rather than architecture defaults.

## Phase 4 — real-content validation boundary

The actual recurring Task names and report mappings are:

```text
開發技術每日追蹤
→ daily-news

每日突破性工具推薦
→ framework-recommendation
```

The production Make Scenario is `Daily Report - Publish to Vercel`. It is on-demand and accepts:

```text
reportType: text, required
 title: text, required
 contentMarkdown: multiline text, required
 generatedAt: text, required
 sources: optional array
   ├─ title: text, required
   └─ url: URL, required
```

Production payload emitted by Make remains schema version `1`:

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

Phase 4 used one-shot shadow Scheduled Tasks rather than permanently adding Make delivery to the two enabled recurring Tasks. The shadows copied the real research/selection rules and added only the delivery contract. This validated real Production content before Phase 5 final credential rotation.

Phase 4 safety/validation boundary:

- current recurring Tasks remained behaviorally unchanged during Phase 4;
- each shadow Task ran once from its own schedule and required no run-time manual approval;
- before each run, Production was checked read-only for an occupied `(report_type, report_date)`; no existing Production row was deleted or updated to make room for a test;
- `contentMarkdown` did not contain ChatGPT UI citation tokens;
- source attribution used the Make `sources[]` input, not the old POC `sourcesJson` contract;
- Make validation inspected only high-level run outcome, never HTTP module Authorization header/input;
- Neon persistence and public rendering were validated after each report type.

Detailed execution and acceptance: `phase-4-plan.md` and `phase-4-verification.md`.

## Phase 5 — live recurring production architecture

Phase 5 moved the validated Phase 4 contract from one-shot shadows to the two real recurring Scheduled Tasks after the final credential rotation. The live flow is now:

```text
Original daily ChatGPT schedule
        ↓
Research / generation prompt
        ↓
Clean Markdown + structured sources
        ↓
Daily Report - Publish to Vercel
        ↓
Bearer-authenticated /api/v1/ingest
        ↓
Neon exactly-once persistence
        ↓
Server-rendered public website
```

### Live recurring task contract

`開發技術每日追蹤`:

- maps to `daily-news`;
- keeps its original daily schedule and research/source-quality rules;
- title is `開發技術每日追蹤｜YYYY-MM-DD` using the Asia/Taipei business date;
- deterministic no-result days are still published with `sources = []`.

`每日突破性工具推薦`:

- maps to `framework-recommendation`;
- keeps its original daily schedule, historical recommendation deduplication and fallback rule;
- title is `每日突破性工具推薦｜<最終推薦工具名稱>`;
- fallback selects a recent fast-growing representative tool instead of publishing an empty report.

Both tasks:

- send complete clean Markdown as `contentMarkdown`;
- send actual completion time as ISO 8601 with explicit `+08:00`;
- send deduplicated structured `{ title, url }[]` sources biased toward official/primary sources;
- use the same Make Scenario and schema-v1 ingest contract;
- remain independent of the OpenAI API.

### Production safety boundary

- Final `INGEST_SECRET` exists only in Vercel and Make runtime configuration; its value is not stored in Git or `/AI-build`.
- Credential validation is performed using high-level Make outcomes only; HTTP Authorization module input/header is not inspected.
- Invalid Bearer authentication is rejected before persistence.
- Production validation is read-only except for normal scheduled ingest and controlled exact-retry idempotency verification.
- Existing Production reports are never UPDATE/DELETE-ed to make room for tests or same-day conflicts.
- Formal recurring schedules are not changed for launch testing.

### Launch evidence

The first real original-schedule unattended production cycle passed on 2026-09-11:

- both Scheduled Tasks ran automatically;
- both Make executions succeeded with `startedBy = auto`;
- Neon stored exactly one row for each of `daily-news` and `framework-recommendation` on the 2026-09-11 business date;
- persisted Markdown had no ChatGPT UI serialization;
- homepage, archives and both detail routes rendered the new reports successfully.

Detailed evidence is recorded in `phase-5-verification.md`.

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
