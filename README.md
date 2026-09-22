# Daily Report

公開的每日技術資訊報告網站。內容由 ChatGPT Scheduled Tasks 經 Make 傳入，儲存於 Neon PostgreSQL，再由 Next.js 在伺服器端依資料庫分類動態呈現。

## Stack

Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / shadcn/ui / Drizzle ORM / Neon / Vercel Speed Insights。
網站部署於 Vercel；不使用 OpenAI API。

## Local development

需要 Node.js 24 與 package.json 指定的 pnpm 12.3.4。

1. 安裝相依套件：`pnpm install --frozen-lockfile`。
2. 依 `.env.example` 建立 UTF-8 `.env.local`，設定 Neon `DATABASE_URL`。如需驗證寫入端點，再設定 `INGEST_SECRET`。
3. 執行 `pnpm dev`。
4. 執行 `pnpm typecheck` 與 `pnpm build` 驗證變更。

`SITE_URL` 為選用的正式 canonical origin，預設為目前 Vercel Production 網域。
Vercel Production 建置在 `DATABASE_URL` 可用時會預先產生首頁與 sitemap，公開資料由帶有精準 ingest invalidation 的跨請求 cache 提供。無可用資料庫的本機或 CI 建置可設定 `SKIP_DATABASE_PRERENDER=1`，將 DB 讀取延後到請求時；執行時缺少設定或讀取失敗仍會顯示錯誤頁，不會以虛構資料替代。

既有資料套用 Phase 8 presentation migration 後，可執行 `pnpm db:backfill:presentations -- --apply` 回填 summary、閱讀時間與 headings；此命令需要 `DATABASE_URL`。

## Routes

| 路徑 | 內容 |
| --- | --- |
| `/` | 每個已發布且可見分類的最新報告 |
| `/category/[slug]` | 動態分類歷史報告，每頁 10 筆 |
| `/news` | 308 永久導向 `/category/daily-news` |
| `/frameworks` | 308 永久導向 `/category/framework-recommendation` |
| `/reports/YYYY-MM-DD-[category-slug]` | 任意合法分類的完整報告 |
| `/sitemap.xml`、`/robots.txt` | 正式站索引資訊；Preview 禁止索引 |
| `POST /api/v1/ingest` | Bearer 驗證寫入端點；schema v1 保留既有兩分類，schema v2 支援動態分類 |

## Project records

請先閱讀 [AI-build](./AI-build/README.md)；其中的 [TODO](./AI-build/todo.md) 是主要進度來源。
所有功能性調整同步更新文件，所有進入 `main` 的變更透過 PR 並使用 squash merge。
