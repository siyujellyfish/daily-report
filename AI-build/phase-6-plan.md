# Phase 6 — Adaptive categories plan

## 狀態與目標

Phase 5 已完成 Production launch。Phase 6.1–6.5 現已在 `phase6/adaptive-categories` 完成實作與 canonical isolated acceptance：Production database 已完成 backward-compatible category migration；branch runtime 已完成 v1/v2 ingest、dynamic category read layer、canonical `/category/[slug]` routes、adaptive navigation/homepage，以及 4-category / hidden-empty / v1-v2 write-path / redirects / metadata-sitemap / Pixel 7 / sticky-anchor / performance 自動驗收。Production application runtime 尚未部署 Phase 6，下一階段為 6.6 safe rollout / Production acceptance。

Phase 6 的目標是將「分類」提升為資料庫中的一級實體，使新的推播分類在第一次合法發布後即可自動出現在網站分類導覽、首頁與 archive route，而不需要再次修改網站程式碼。

Phase 6 保留既有核心邊界：

- ChatGPT Scheduled Tasks 負責內容研究與生成。
- Make 僅負責 transport，不加入分類推論或 UI 邏輯。
- Vercel / Next.js App Router 維持單一應用。
- 公開讀取仍採 React Server Components → Drizzle → Neon，不新增 browser-side public read API。
- 不新增 CMS、帳號系統、管理後台、Redis 或前端全域狀態管理。
- `INGEST_SECRET`、SHA-256 exact-retry 與 `(report_type, report_date)` collision protection 必須保留。
- Production schema change 先在 temporary Neon branch 驗證，再套用 Production。

## 2026-09-17 official reference checkpoint

Phase 6 規劃前重新確認官方文件：

- Next.js App Router 支援 `[slug]` Dynamic Segment，可由 runtime data 決定 category URL：https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes
- Next.js `permanentRedirect()` 可用於永久 URL 遷移，預設使用 HTTP 308：https://nextjs.org/docs/app/api-reference/functions/permanentRedirect
- Drizzle Kit `generate` 會依 schema snapshot 產生 versioned SQL migration：https://orm.drizzle.team/docs/drizzle-kit-generate
- Drizzle Kit `migrate` 依 migration journal 套用尚未執行的 migration：https://orm.drizzle.team/docs/drizzle-kit-migrate
- Drizzle 的 Neon HTTP driver 適合 single / non-interactive transaction；若真的需要 interactive transaction 才考慮 WebSocket driver：https://orm.drizzle.team/docs/get-started/neon-new

目前 repo 為 Next.js 16.3.4；官方文件在規劃日顯示 latest 16.3.5。Phase 6 本身不需要新增 dependency。實作開始前重新確認現有 dependency 的 stable/compatible patch 狀態；若只為本功能不需要新 API，不把無關的大版本升級綁入 Phase 6。

## 2026-09-21 implementation reference checkpoint

Phase 6.3–6.4 implementation前重新核對目前官方文件：

- Next.js App Router Server Components 應直接讀取 server-side data，不為內部頁面讀取新增 redundant API。
- Next.js dynamic route / async params 與 `generateMetadata` 模式維持適用。
- Next.js `permanentRedirect()` 用於永久 URL 遷移並產生 308 semantics。
- Drizzle PostgreSQL select 支援 partial projection、`selectDistinctOn`、joins、`exists()` 與 SQL expression ordering，可直接實作 published-category filtering 與 `NULLS LAST` ordering。

Phase 6.3–6.4 不需要新增或升級 dependency；沿用既有 Next.js 16.3.4、Drizzle ORM 0.45.2、Neon serverless 1.1.0 與 Zod 4.5.4。

## 2026-09-21 Phase 6.5 acceptance checkpoint

- GitHub `TEST_DATABASE_URL` 已改指 canonical `phase6-adaptive-isolated`，並由 integration fixture identity assertion 驗證。
- Canonical isolated dataset：4 published categories + 1 visible-empty + 1 hidden-published。
- v1/v2 integration write fixtures 改用 `GITHUB_RUN_ID` run-scoped identity，避免 shared test DB 的 concurrent CI race，並在 suite 結束清理。
- Playwright 同時驗證 desktop 與 Pixel 7：3+ category layout、long label、rail containment、308 redirects、metadata/canonical/sitemap、active state、TOC/source anchors、no browser `/api/*` reads。
- Final Quality run `35553230724` 全綠；完整 evidence 記錄於 `phase-6-5-verification.md`。
- 無新增/升級 dependency，Production 無 synthetic Phase 6 fixture。

## Phase 6.0 — Approved product boundary

### 自適應分類定義

「自適應分類」指：

1. 新的合法 v2 report payload 帶入一個尚不存在的 category slug 與顯示 metadata。
2. ingest service 建立 category metadata。
3. 同一 payload 的 report 成功寫入。
4. public query layer 在下一次 request 即可讀取該分類。
5. Header category rail、首頁 latest cards、`/category/[slug]`、detail breadcrumb 與 sitemap 自動反映新分類。

不包含：

- 依文章正文自動用 AI 判斷分類。
- 讓一般公開使用者建立分類。
- 從 payload 接受任意 CSS、顏色、icon component、route 或 HTML。
- 在 Phase 6 建立 category CMS / admin UI。
- 自動刪除沒有內容的分類。

### Category identity

`reportType` / category `slug` 是永久 machine identifier，必須符合安全的 lowercase slug 規則，例如：

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

建議最大長度 80 characters。

例如：

```text
daily-news
framework-recommendation
security-news
ai-agent
```

slug 一旦有 report 引用就視為 immutable；顯示名稱與 description 與 slug 分離。

## Phase 6.1 — Database model and migration

### Target schema

新增 `report_categories`：

```text
report_categories
├─ slug varchar(80) primary key
├─ label varchar(...), not null
├─ description varchar(...), not null
├─ sort_order integer nullable
├─ is_visible boolean not null default true
├─ created_at timestamptz not null default now()
└─ updated_at timestamptz not null default now()
```

`reports` 保留既有欄位名稱 `report_type`，但從 PostgreSQL enum 改為字串欄位並建立 FK：

```text
reports.report_type
→ varchar(80)
→ references report_categories.slug
```

保留：

- `reports_type_date_unique(report_type, report_date)`
- `reports_payload_hash_unique(payload_hash)`
- `reports_date_idx`
- `reports_type_date_idx`

不在 Phase 6 將 sources 正規化成另一張 table。

### Existing category seed

Migration 必須先建立兩個既有 category：

```text
daily-news
label: 資訊新聞
sort_order: 10

framework-recommendation
label: 框架工具
sort_order: 20
```

description 沿用目前 public UI 的既有文案。

新 category 預設 `sort_order = NULL`，公開排序採：

```text
sort_order ASC NULLS LAST
created_at ASC
slug ASC
```

如此既有兩分類順序固定，新分類依第一次建立時間穩定加入，不需要以 `MAX(sort_order) + 10` 產生 concurrent race。

### Migration procedure

Migration 預期需要 custom SQL review，不能只依 generated diff 未檢查即套 Production：

1. 建立 `report_categories`。
2. seed 兩個既有 categories。
3. 將 `reports.report_type` 由 enum 安全轉成 varchar/text-compatible column，保留既有值。
4. 驗證所有現有 `reports.report_type` 均有 category row。
5. 建立 FK。
6. 確認 unique constraints / indexes 仍存在且 query shape 不退化。
7. 確認舊版 application 對新的 varchar column 仍可正常 read/write 兩個 legacy type，讓 schema-first rollout 可安全進行。
8. 只有確認沒有 reference 後才移除舊 PostgreSQL enum type。

使用 repo 既有 `drizzle-kit generate` / `migrate` workflow；先在 temporary Neon branch 驗證完整 migration、rollback/compatibility assumptions 與 existing row count，再考慮 Production。

不得為 migration 驗證 UPDATE/DELETE Production report content。

## Phase 6.2 — Ingestion schema v2 with v1 compatibility

### v1 must remain stable

既有 Production Scheduled Tasks 目前使用 schema version 1。Phase 6 不得要求兩個 recurring Tasks 與網站 deployment 同時切換。

因此 ingest schema 改為 version-discriminated contract：

```text
schemaVersion: 1
→ existing fixed legacy report types

schemaVersion: 2
→ dynamic category slug + category metadata
```

v1 payload normalization 與 payload hash input 必須保持完全相容，避免部署前後同一 exact retry 算出不同 SHA-256。

### Proposed v2 payload

```json
{
	"schemaVersion": 2,
	"reportType": "security-news",
	"categoryLabel": "資安情報",
	"categoryDescription": "每日資安事件、漏洞與威脅情報整理。",
	"title": "每日資安情報｜2026-09-17",
	"generatedAt": "2026-09-17T08:00:00+08:00",
	"contentMarkdown": "...",
	"sources": []
}
```

v2 validation：

- `reportType` 使用 slug regex + length bound，不再使用 fixed `z.enum`。
- `categoryLabel` trim / non-empty / bounded length。
- `categoryDescription` trim / bounded length。
- `title`、`generatedAt`、`contentMarkdown`、`sources` 延續 v1 safety limits。
- `.strict()` 保留，未知欄位仍拒絕。

### Category creation semantics

- category 不存在：由合法 v2 payload 建立。
- category 已存在：stored metadata 為 canonical；一般 daily report ingest 不因 payload typo 自動覆寫 label / description / visibility / sort order。
- `is_visible` 與 `sort_order` 不接受 payload 控制。
- 同 slug 的 metadata mismatch 不應造成 UI 被 silent rename；實作時決定回傳 warning 或只使用 existing metadata，但不可自動覆寫。
- category 是否公開由資料庫 visibility + 至少存在一篇 report 共同決定。

### Atomicity / failure safety

目標是 category creation 與 report insert 使用 current Neon HTTP driver 可支援的 non-interactive transaction/batch 完成；實作前以目前 Drizzle + Neon driver 實際驗證。

若現有 driver 的 transaction primitive 不適合，不為此功能直接引入 WebSocket driver。最低安全邊界為：

- category row 可以先存在；
- public `getPublishedCategories()` 僅回傳 `is_visible = true AND EXISTS(report)`；
- 因 report insert failure 產生的 empty category 不會出現在 public UI；
- 後續合法 report 可重用該 category。

既有 exact duplicate 與 same-type/date conflict semantics 必須不變：

- exact payload retry → HTTP 200 + `duplicate: true`
- same category/date different payload → HTTP 409

## Phase 6.3 — Query layer and URL architecture

新增/調整 server-side query functions：

```text
getPublishedCategories()
getLatestReportsByCategory()
getCategoryBySlug(slug)
getReportsByCategory(slug, page)
getReportBySlug(slug)
getSitemapEntries()
```

仍使用 explicit public projection，不把 ingest hash/internal metadata 暴露到 page components。

### Category routes

新增：

```text
/category/[slug]
```

不存在、不可見或沒有 public report 的 category route 回 404。

舊 route 保留永久導向：

```text
/news
→ 308 /category/daily-news

/frameworks
→ 308 /category/framework-recommendation
```

不得直接刪除舊 route 造成 bookmark / external link 404。

### Report detail URL

保留既有：

```text
/reports/YYYY-MM-DD-<category-slug>
```

parser 不再列舉兩個固定 type；改為：

1. 解析固定前 10 characters `YYYY-MM-DD`。
2. 驗證日期。
3. `-` 後剩餘值以 category slug validator 驗證。
4. query database 確認實際 report/category 是否存在。

既有 report URLs 不變。

### Sitemap / metadata

Production sitemap 自動包含：

- `/`
- 所有 published category routes
- 所有 report detail routes

不再 hard-code `/news` 與 `/frameworks` 為 canonical category pages；legacy paths 僅作 redirect。

每個 dynamic category archive 使用 stored label / description 產生 metadata 與 canonical URL。

## Phase 6.4 — UI/UX adaptive navigation

### Header structure

現有單列 header 不適合無上限 category。改成：

```text
Row 1
brand | 首頁 | theme control

Row 2
horizontal category rail
```

Desktop category rail：

- 顯示所有 published categories。
- active category 有明確 underline / contrast state。
- categories 超出寬度時 horizontal overflow，不讓整頁 overflow。
- 不把所有分類硬塞進固定 gap navbar。

Mobile category rail：

- 分類 rail 保持可見，可水平滑動。
- 不要求每次切分類先打開 hamburger menu。
- links 保持 semantic `<nav><a>`，不是 ARIA tab widget，因為每個 category 對應獨立 URL/history entry。
- touch target 與 keyboard focus 保持可用。

`首頁` 與 theme control 留在第一列；若移除原 mobile menu，需同步刪除無用 client state / Escape focus behavior，並更新 E2E 測試。

### Dynamic homepage

首頁由固定 `REPORT_TYPES.map()` 改為資料驅動：

```text
published categories
→ each category latest report
→ dynamic ReportCard list
```

Grid 改為 responsive auto-fit/minmax strategy：

- desktop 可容納 2–3 columns，依 category count 與可讀寬度自適應。
- mobile 固定 1 column。
- 不依「永遠兩分類」設計版面。

移除/泛化目前與兩分類強耦合的 copy，例如「兩種視角，一次掌握」與只描述新聞/框架兩種類型的 editorial note。

### Category visual tone

外部 payload 不得控制任意 UI style。

保留 existing identity：

```text
daily-news → blue
framework-recommendation → teal
```

其他 dynamic category 使用網站內建、經 light/dark contrast 驗證的有限 palette，透過 deterministic slug mapping 選擇 tone。不得儲存任意 CSS color 或 icon component 到 DB。

Phase 6 可將 current `.frameworks` / hard-coded category CSS 重構為 generic category tone/data attribute，但不需過度設計 icon system。

### Sticky header / anchor offset

目前 `scroll-padding-top`、TOC `top`、heading `scroll-margin-top` 使用多組固定 px 值。Header 增加第二列後必須統一成 shared CSS variable / token，例如：

```text
--sticky-header-offset
```

TOC、skip/anchor scroll 與 headings 使用同一 offset source，避免點擊 TOC 後標題被兩層 sticky header 遮住。

### Header failure boundary

Dynamic category navigation會增加 Header 的 DB dependency。設計上需避免 DB unavailable 時讓原本可正常顯示的 static 404/error shell 因 navigation query 再次失敗。

實作時優先：

- Server Component 取得 category list後傳給最小 Client navigation component；
- 不建立 browser `/api/categories`；
- navigation category query failure 可退化為只顯示 brand/home/theme，而正常 data page 自己的 read failure 仍由既有 error boundary 處理。

## Phase 6.5 — Test plan

### Unit

新增至少：

- generic category slug validation。
- report slug round-trip with arbitrary valid category slug。
- malformed slug rejection。
- v1 schema compatibility。
- v2 schema acceptance/rejection。
- v1 normalized payload hash regression fixture，確認 Phase 6 前後 exact-retry hash 不變。
- deterministic UI tone mapping。
- category metadata presentation mapping。

### Isolated Neon integration

在 temporary/testing branch 驗證：

- existing two categories migrate without data loss。
- existing report row count、dates、hashes 不變。
- old v1 insert path 仍可寫入 legacy categories。
- v2 first report creates/reuses category correctly。
- existing category metadata 不被 daily payload silent overwrite。
- `getPublishedCategories()` 不回傳 empty/invisible category。
- dynamic pagination / detail query 正確。
- same category/date collision remains 409 semantics at application integration layer。

### Playwright desktop + mobile

測至少 3 個 published categories：

- Header 自動顯示第三分類，不改前端 hard-coded list。
- active category state 正確。
- mobile rail 無 document-level horizontal overflow。
- category archive pagination / report detail / breadcrumb 正確。
- `/news` 與 `/frameworks` permanent redirect 到新 canonical route。
- sitemap / canonical metadata 指向 dynamic category route。
- homepage 3+ cards layout 正常。
- long category label 不破壞 layout。
- keyboard focus、skip link、TOC anchors 與 updated sticky offset 正常。
- public browser read flow仍不產生 `/api/*` read requests。

### Performance

沿用 production client-JS budget；Phase 6 不因動態分類引入新的大型 client framework。

若 Header navigation client bundle 顯著增加才進一步優化，不預先加入 cache library。

## Phase 6.6 — Safe rollout order

建議 deployment sequence：

1. 完成 schema/migration implementation。
2. 在 temporary Neon branch 套 migration，確認現有 app behavior 與 legacy row 完整性。
3. 完成 dual v1/v2 ingest、dynamic query/routes/UI。
4. 使用 isolated DB 完成 unit/integration/Playwright acceptance。
5. Vercel Preview READY，且 Preview/test environment 驗證第三分類 UX。
6. 對 Production 套用已驗證的 backward-compatible schema migration。
7. 在舊 Production application 仍運作時確認兩個 recurring v1 Tasks 不受 varchar/FK migration 影響。
8. 部署 Phase 6 application 到 Production。
9. 驗證 existing `/`、legacy redirects、兩個 canonical category routes、existing report details 與 scheduled v1 ingest。
10. Phase 6 不寫入 synthetic third-category Production report；第三分類能力在 isolated environment 完整驗證即可。
11. 未來第一個真實新 v2 category publish 時，應不需再 deploy application；只需使用既定 v2 contract。

若 schema-first migration 在 temporary branch 證明無法讓舊 app 安全運作，必須重新設計 rollout，不在 Production 直接嘗試。

## Phase 6 acceptance

只有以下全部成立才標記完成：

- `report_categories` 成為 category source of truth，existing reports 無資料遺失。
- `reports.report_type` 不再受固定 PostgreSQL two-value enum 限制，且具 category FK integrity。
- schema v1 兩個現有 recurring Tasks 繼續正常 unattended publish。
- schema v2 可安全建立新的 category + report，而不接受任意 presentation control。
- payload hashing/idempotency regression 測試證明 v1 exact-retry compatibility 未破壞。
- public category navigation、homepage、archive、detail breadcrumb、metadata、sitemap 均由 data-driven categories 產生。
- `/category/[slug]` 成為 canonical archive route；`/news`、`/frameworks` 使用 permanent redirect 保持相容。
- mobile category rail、3+ category homepage、sticky header / TOC offset、keyboard/accessibility 均通過 Playwright。
- public read path 仍為 Server Components → Drizzle → Neon，未新增 redundant browser read API。
- 無必要的新 dependency、CMS、Redis 或 front-end state infrastructure 被加入。
- temporary Neon migration 驗證、Quality workflow、Vercel Preview 與 Production post-deploy checks 全部通過。
- `/AI-build` 同步記錄最終 implementation / verification 差異。
- Phase 6 PR 最終進入 `main` 時使用 squash merge。
