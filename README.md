# Daily Report

公開的每日技術資訊報告網站。內容由 ChatGPT Scheduled Tasks 經 Make 傳入，儲存於 Neon PostgreSQL，再由 Next.js 在伺服器端依資料庫分類動態呈現。

## Stack

Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / shadcn/ui / Drizzle ORM / Neon。
網站部署於 Vercel；不使用 OpenAI API。

## Local development

需要 Node.js 24 與 package.json 指定的 pnpm 12.3.4。

1. 安裝相依套件：`pnpm install --frozen-lockfile`。
2. 依 `.env.example` 建立 UTF-8 `.env.local`，設定 Neon `DATABASE_URL`。如需驗證寫入端點，再設定 `INGEST_SECRET`。
3. 執行 `pnpm dev`。
4. 執行 `pnpm typecheck` 與 `pnpm build` 驗證變更。

`SITE_URL` 為選用的正式 canonical origin，預設為目前 Vercel Production 網域。
公開頁面於請求時讀取資料庫，因此建置不需要連線至 Neon；執行時缺少設定或讀取失敗會顯示錯誤頁，不會以虛構資料替代。

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
