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
- The ingest endpoint uses Next.js's default Node.js runtime because SHA-256 hashing uses Node cryptography primitives; it does not opt into the Edge runtime.
- Make only transports report data. It does not generate content and does not call the OpenAI API.
- ChatGPT Scheduled Tasks remain responsible for research and Markdown report generation.

## Report storage

Phase 6.1 migrated category identity into a first-class table while preserving the existing report column name:

```text
report_categories
├─ slug varchar(80) PK
├─ label varchar(120)
├─ description varchar(500)
├─ sort_order integer nullable
├─ is_visible boolean
├─ created_at timestamptz
└─ updated_at timestamptz

reports
├─ id UUID
├─ schema_version
├─ report_type varchar(80) → report_categories.slug
├─ report_date
├─ title
├─ content_markdown
├─ sources JSONB
├─ summary nullable text
├─ reading_minutes nullable integer
├─ headings nullable JSONB
├─ generated_at
├─ received_at
└─ payload_hash
```

The two legacy schema-v1 report types remain:

- `daily-news`
- `framework-recommendation`

The database is no longer restricted to those two values; authenticated schema-v2 ingestion can introduce additional validated category slugs. Source links remain JSONB because the product only needs attribution/rendering. A relational source table should be introduced only if source-level analytics, filtering, deduplication or cross-report queries become real requirements.

## Ingestion behavior

Idempotency is enforced at two levels:

1. `payload_hash` is globally unique. An exact Make/ChatGPT retry returns HTTP 200 with `duplicate: true`.
2. `(report_type, report_date)` is unique. A different payload for an already occupied type/date returns HTTP 409 and never silently overwrites the stored report.

Other ingestion constraints:

- Schema version `1` remains accepted exactly for the two live legacy report types.
- Schema version `2` accepts a validated dynamic category slug plus bounded category label/description.
- V1 `sources: null` or omitted sources still normalize to `[]` for Make compatibility, and its normalized SHA-256 behavior is regression-locked.
- V2 category metadata is insert-once canonical metadata; normal report ingest never silently renames an existing category.
- `sort_order`, `is_visible` and arbitrary presentation values are not payload-controlled.
- V2 category create/reuse, canonical metadata read and report insert execute atomically through Drizzle Neon HTTP `db.batch()`.
- Source URLs must remain structured data rather than ChatGPT UI citation serialization.
- Business date boundaries use `Asia/Taipei`.

Production has run the Phase 6 adaptive-category schema/runtime since 2026-09-21. Phase 8 keeps three new presentation fields nullable during its schema-first rollout so the existing Production runtime can continue writing before the new runtime deploys.

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

Current query functions:

```text
getPublishedCategories()
getPublishedCategory(slug)
getLatestPublishedReports()
getReportsByCategory(slug, page)
getReportBySlug(slug)
getCategorySitemapEntries()
getReportSitemapEntries()
```

`getLatestReports()` and `getReportsByType()` remain compatibility helpers; canonical public routes use the category-driven functions above.

Responsibilities of the query layer:

- centralize Drizzle query construction;
- consistently map database records into presentation-friendly report objects;
- keep Asia/Taipei date and slug conversion in one place;
- support pagination without duplicating SQL/Drizzle logic across routes;
- expose only public report fields to rendering code.
- keep full Markdown and sources out of homepage/archive projections;
- cache public reads across requests and invalidate them after a successful new ingest.

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
- CI production build uses an intentionally invalid localhost database URL plus `SKIP_DATABASE_PRERENDER=1` and does not access Production.
- DB integration rejects `TEST_DATABASE_URL === DATABASE_URL`.
- Public browser reading flow is verified to perform no `/api/*` read requests.
- Client JavaScript budget is 1 MiB uncompressed per tested cold route; current measured totals are approximately 505–506 KB.

Observed behavior did not justify a Redis layer or query-plan tuning in Phase 3. Phase 8 later added framework-native tagged caching after Production measurements showed every public response was `no-store`/MISS and list projections transferred unnecessary Markdown; it still adds no external cache infrastructure.

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

- Central query layer: `src/lib/reports.ts` (`server-only`), with explicit public fields. Phase 8 supersedes the original request-scoped React cache with Next.js cross-request cache functions.
- Presentation helpers: `report-date.ts`, `report-types.ts`, `report-markdown.ts`; ingestion reuses the centralized Taipei date helper.
- Markdown parser and renderer share one AST heading transform; no browser-side Markdown processor or public read API.
- Client code is limited to navigation/theme and code-copy feedback. Report bodies and database reads remain server-rendered.
- `next-themes` sets the `data-theme` attribute before hydration; only the HTML theme mismatch is suppressed.
- UI uses the approved HTML demo's editorial tokens with shadcn Button, Card and Native Select primitives.
- Metadata utilities live in `src/lib/site.ts`; robots and sitemap use the same canonical origin and Preview policy.
- Existing ingestion contract, production database schema and Make Scenario are unchanged.
- Detailed design: `phase-2-design.md`. Validation evidence is recorded in `changelog.md`.

## Phase 6 — adaptive category architecture (6.1–6.5 implemented)

Phase 6 will preserve the live Phase 5 flow while replacing fixed category assumptions with persisted category metadata. The target data flow is:

```text
ChatGPT Scheduled Task
        ↓
Make transport
        ↓
POST /api/v1/ingest
        ↓
Bearer authentication
        ↓
version-discriminated Zod validation
   ├─ schema v1: two existing fixed types
   └─ schema v2: safe dynamic category slug + metadata
        ↓
category create/reuse + report persistence
        ↓
report_categories ← FK ← reports.report_type
        ↓
Server Component category/report queries
        ↓
Header category rail / homepage / category archive / report detail / sitemap
```

### Target category storage

```text
report_categories
├─ slug PK
├─ label
├─ description
├─ sort_order nullable
├─ is_visible
├─ created_at
└─ updated_at

reports
└─ report_type varchar → report_categories.slug
```

The existing two categories are seeded first. Existing report rows and hashes are preserved. The former PostgreSQL enum is removed only after migration verification confirms all reports have a valid category reference.

### Compatibility boundary

- Schema v1 remains accepted for the two live recurring Tasks.
- V1 payload normalization/hash behavior remains stable.
- Schema v2 introduces safe dynamic category slugs and category label/description.
- Presentation controls such as arbitrary CSS, colors, icons, visibility and route values are not accepted from ingest payloads.
- Existing category metadata is canonical and is not silently overwritten on every daily report.
- `payload_hash` and `(report_type, report_date)` uniqueness continue to enforce exact retry and per-category/day collision behavior.

### Implemented public routes

```text
/
  latest report per published category

/category/[slug]
  dynamic category archive

/news
  permanent redirect → /category/daily-news

/frameworks
  permanent redirect → /category/framework-recommendation

/reports/[slug]
  existing YYYY-MM-DD-<category-slug> detail URLs
```

Published navigation categories are `is_visible = true` and have at least one report. Empty category rows therefore never create empty public tabs.

### Implemented navigation/rendering boundary

- Category list is queried server-side; the browser does not fetch `/api/categories`.
- Header becomes a stable first row plus a horizontally scrollable category rail.
- Navigation entries remain normal links because each category has an independent URL/history entry.
- Homepage cards become data-driven rather than using a fixed `REPORT_TYPES` array.
- Existing blue/teal visual identity is retained; future category tones come from an application-controlled accessibility-checked palette.
- Sticky Header/TOC/anchor offsets use a shared CSS token after the second Header row is introduced.
- Navigation category query failure may degrade the navigation shell without masking the main page's existing read-error behavior.

### Implemented ingestion boundary through Phase 6.2

```text
POST /api/v1/ingest
        ↓
Bearer authentication
        ↓
z.discriminatedUnion("schemaVersion")
   ├─ v1
   │   ├─ daily-news | framework-recommendation
   │   └─ original normalization/hash behavior
   └─ v2
       ├─ safe slug: ^[a-z0-9]+(?:-[a-z0-9]+)*$
       ├─ bounded label/description
       └─ Neon HTTP atomic batch
            ├─ category INSERT ... ON CONFLICT DO NOTHING
            ├─ canonical category SELECT
            └─ report INSERT ... ON CONFLICT DO NOTHING
```

V2 responses may report whether a category was newly created and whether submitted metadata differs from the stored canonical metadata; mismatches never mutate the category row.

No WebSocket database driver, new dependency, CMS or browser write/read layer was added for this feature.

### Migration and rollout boundary

The Phase 6.1 enum-to-varchar/FK migration was validated on a temporary Neon branch and then promoted to Neon Production after explicit approval. A fresh `phase6-adaptive-isolated` branch was created from the migrated Production HEAD and is the sole Phase 6.2+ synthetic-write target.

The Phase 6 runtime was later deployed in Phase 6.6. Synthetic acceptance categories remain restricted to the isolated branch/Preview path; Production acceptance does not create fake content.

Detailed implementation, test matrix and acceptance criteria are recorded in `phase-6-plan.md`, `phase-6-1-verification.md`, `phase-6-2-verification.md` and `todo.md`.


### Implemented Phase 6.3–6.4 read/UI flow

The public read path is now fully category-driven:

```text
report_categories
      ↓
getPublishedCategories()
      ├─ is_visible = true
      ├─ EXISTS(report)
      └─ sort_order ASC NULLS LAST, created_at ASC, slug ASC
      ↓
Server Components
      ├─ Header category rail
      ├─ Homepage latest report per category
      ├─ /category/[slug]
      ├─ /reports/[slug]
      └─ sitemap
```

Implemented query functions:

```text
getPublishedCategories()
getPublishedCategory(slug)
getLatestPublishedReports()
getReportsByCategory(slug, page)
getReportBySlug(slug)
getCategorySitemapEntries()
getReportSitemapEntries()
```

The report slug parser now treats the first 10 characters as the report date and validates the remaining suffix with the shared safe category-slug rule. Existing report detail URLs therefore remain unchanged while new v2 category slugs require no source-code enumeration.

The canonical archive route is `/category/[slug]`. The legacy `/news` and `/frameworks` pages call Next.js `permanentRedirect()` and preserve valid page numbers when redirecting to the canonical category route.

Report detail queries join category metadata and expose only the public category projection (slug, label, description plus application-owned presentation mapping). Internal category visibility, ordering and timestamps are not sent to page components.

The Header now uses a two-row layout:

```text
row 1: brand | home | theme
row 2: horizontally scrollable category rail
```

Category data is loaded in the Server Component and only `slug`, `label` and canonical `href` are passed to the small Client navigation component. A Header category-query failure is caught and degrades to the static shell instead of masking the page-level read error.

Homepage rendering uses the same ordered published-category list and the latest report for each category. The grid uses responsive auto-fit/minmax behavior, while mobile remains one column.

Application-owned category tones are deterministic:

```text
daily-news → blue
framework-recommendation → teal
future categories → violet | amber | rose | cyan
```

All palette pairs are defined for light/dark themes and checked against the existing WCAG AA 4.5:1 text contrast guard. External payloads still cannot set style/color/icon values.

A shared `--sticky-header-offset` CSS token now drives document scroll padding, report heading/source scroll margins and desktop TOC positioning.

The canonical synthetic Phase 6 dataset remains only on Neon `phase6-adaptive-isolated`. As of Phase 6.5, GitHub `TEST_DATABASE_URL` points to this canonical branch, and the integration suite explicitly proves the expected published-category set before exercising reads/writes. The older `phase3-testing` branch is no longer used by the Phase 6 Quality gate.


### Phase 6.5 verification architecture

The canonical Phase 6 Quality path is:

```text
GitHub Actions
      ↓
TEST_DATABASE_URL
      ↓
phase6-adaptive-isolated
      ├─ 4 published categories
      │   ├─ daily-news
      │   ├─ framework-recommendation
      │   ├─ security-news
      │   └─ long-category-navigation-fixture
      ├─ 1 visible empty category
      └─ 1 hidden category with a report
```

Persistent synthetic fixtures exist only on the isolated branch. Integration-only ingest fixtures are run-scoped using `GITHUB_RUN_ID`, then removed in `afterAll`, so concurrent Quality runs cannot delete or collide with each other's v1/v2 acceptance data.

The Phase 6.5 integration suite covers:

- canonical test-branch identity through the expected ordered published-category set;
- visible+published filtering;
- latest-per-category and dynamic archive/detail reads;
- schema-v1 create / exact retry / same-slot 409;
- schema-v2 category creation / exact retry / metadata mismatch / same-slot 409;
- unauthorized and payload-controlled presentation rejection.

Playwright covers desktop and Pixel 7 for four published categories, explicit 308 redirects, dynamic canonical/OG/sitemap output, active category state, long-label layout, mobile rail containment, TOC/source anchor placement, accessibility and browser-side no-`/api/*` read behavior.

Phase 6.5 exposed two real responsive constraints and fixed them in the application rather than weakening tests:

- category rail intrinsic sizing is contained so its max-content row does not widen the document;
- report detail breadcrumb/category/content/return actions are shrinkable, and the long `返回{category}` button may wrap instead of inheriting shadcn's `shrink-0 + whitespace-nowrap` document overflow.

Production remains outside this synthetic test path.


## Phase 6.6 — Production rollout

Phase 6 adaptive-category runtime is deployed to Production from squash commit `d2c1711b00ff15fefef2991b177c8bc7b9dbea2a`.

Production state after rollout:

```text
Neon main
├─ daily-news
└─ framework-recommendation

Vercel Production
└─ dpl_CcpigyPQ7vsvZz8EkPjie5nZLP7K → READY
```

No synthetic Phase 6 category was promoted to Production. The isolated acceptance branch remains the only location for `security-news`, the long-label fixture, empty fixture and hidden fixture.

The temporary Preview-only Neon host override used to prove the four-category UI was removed before merge. Production and all normal environments therefore resolve database access exclusively through their configured `DATABASE_URL`.

After deployment, the two original 2026-09-21 schema-v1 Make payloads were replayed as exact retries. Both flows completed successfully and Production retained exactly one report row for each legacy type/date, confirming the new runtime preserves v1 idempotency and compatibility.

## Phase 6.7 — UI/UX refinement boundary

Phase 6.7 is presentation-only unless a separately approved requirement proves otherwise. It must preserve the Phase 6 category/data contract, Server Component read architecture, canonical routes and ingest semantics.

The initial refinement surfaces are Header/category rail, homepage card density, category archive scanability, report-detail reading hierarchy/TOC/sources, and mobile interaction polish. No CMS, client-side category store, redundant read API or new UI dependency is assumed.


## Phase 6.7 — ephemeral CI fixture lifecycle

The canonical test branch no longer depends on persistent synthetic rows.

```text
Quality run
  ↓
seed deterministic fixtures
  ↓
integration + Playwright + performance
  ↓
always() cleanup
  ↓
clean phase6-adaptive-isolated
```

The isolated branch schema is kept identical to Neon Production. This removes long-lived fixture categories/reports while preserving deterministic four-category acceptance during each serialized Quality run.

## Phase 8 — loading-performance architecture

The Vercel application executes in `sin1`, matching the Singapore Neon region. Measurements after that move showed fast SQL execution but `no-store`/MISS public responses and oversized list projections, so P0/P1 optimize the application/cache boundary rather than introducing Redis, indexes or another database driver.

### Public cache and rendering boundary

```text
Server Component route
        ↓
"use cache" query function
        ├─ tag: public-reports
        ├─ stale: 5 minutes
        ├─ revalidate: 1 hour
        └─ expire: 1 day
        ↓
Drizzle Neon HTTP only on cache fill
```

`POST /api/v1/ingest` invalidates `public-reports` immediately only after a newly committed report. Exact retries and conflicts do not invalidate unchanged output. A cache-invalidation failure is logged separately and does not convert a committed insert into a false ingestion failure.

With a reachable `DATABASE_URL`, Vercel builds may prerender `/` and `/sitemap.xml`; dynamic category/detail routes retain partial-prerender shells. Local/CI no-DB builds set `SKIP_DATABASE_PRERENDER=1` so database access is postponed until request time. Runtime database failures keep the existing HTTP 500/error-boundary behavior rather than returning fabricated or stale fallback content outside the configured cache policy.

### Presentation and query boundary

Ingest derives and persists `summary`, `reading_minutes` and `headings` once using the same Markdown analysis code used by presentation. Existing rows are backfilled, while nullable columns and a targeted missing-row fallback preserve rolling-deployment compatibility.

- Homepage latest reports use one ranked/window query joined to visible category metadata.
- Category archives use one rows-plus-`COUNT(*) OVER()` query.
- Homepage/archive projections exclude `content_markdown`, `sources` and `generated_at`.
- Detail reads retain full Markdown and sources but reuse persisted presentation metadata.
- Published-category validation and Header navigation reuse the cached ordered category result.

### Observability and rollout

- `@vercel/speed-insights` is mounted once in the root layout.
- Cache-fill database operations emit structured `server_timing` JSON logs; cache hits do not execute those wrappers.
- Ingestion responses expose total application and persistence-path durations through `Server-Timing`.
- The additive migration was prepared and backfilled first on a temporary child of Neon `main`, then promoted after explicit confirmation. Production `main` and the non-reset isolated CI branch both have the same presentation columns with zero missing values; synthetic browser fixtures remain ephemeral.

Detailed scope and evidence are recorded in `phase-8-plan.md` and `phase-8-verification.md`.
