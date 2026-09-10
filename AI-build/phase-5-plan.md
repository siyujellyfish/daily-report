# Phase 5 — Production hardening and launch plan

## 狀態與目標

Phase 4 已完成真實內容的 one-shot shadow Production 驗證，兩個既有 recurring Scheduled Tasks 尚未加入 Production publishing。Phase 5 的目標是完成最後一次 `INGEST_SECRET` 輪替、重新部署 Vercel、正式啟用兩個 recurring Task 的 Make delivery，並在第一輪 unattended recurring execution 後完成 launch closure。

Phase 5 不重新設計 payload contract；直接沿用 Phase 4 已驗證內容：

- `開發技術每日追蹤` → `daily-news`
- `每日突破性工具推薦` → `framework-recommendation`
- Make Scenario：`Daily Report - Publish to Vercel`
- Inputs：`reportType`、`title`、`contentMarkdown`、`generatedAt`、`sources[]`

## Phase 5.0 — Preflight baseline

在任何正式 credential 或 recurring Task 修改前先做 read-only 稽核：

1. 確認 Vercel 最新 `main` Production deployment 為 READY。
2. 確認 Production aliases / domain 存在且公開網站仍可讀。
3. 確認 Make `Daily Report - Publish to Vercel` 為 active、on-demand、無 incomplete execution。
4. 確認 Make interface 仍符合 Phase 4 frozen contract；不得讀取 HTTP module Authorization header/input。
5. 確認 Neon Production default branch 為 ready。
6. 以 read-only SQL 核對 `reports` schema 與 indexes 是否仍符合 `src/db/schema.ts`。
7. 確認兩個正式 recurring Scheduled Tasks 仍 enabled，研究規則與原排程未被 Phase 4 修改。

## Phase 5.1 — Final credential rotation

安全要求：secret 值不得出現在 ChatGPT 對話、Git、`/AI-build`、Issue/PR、Make execution diagnostic output 或任何可讀取的工具回傳中。

由於 Make ChatGPT App 的 module edit contract 會以完整 module config 覆寫，若要更新 HTTP module 必須先讀現有 module configuration；這會違反既定「不得檢視 Authorization header/input」安全邊界。因此最後 credential rotation 保留為使用者在 Vercel / Make UI 內完成的唯一人工作業。

操作順序：

1. 產生新的高熵 `INGEST_SECRET`，不要貼到 ChatGPT。
2. Vercel → `daily-report` → Settings → Environment Variables：更新 Production 的 `INGEST_SECRET`。
3. Make → `Daily Report - Publish to Vercel` → HTTP Make a request：將 Authorization header 更新為同一組 `Bearer <new secret>`。
4. 儲存 Make Scenario，但不要開啟 execution/module diagnostic input 檢查 Authorization 值。
5. 觸發新的 Vercel Production deployment，使新的 environment variable 進入 runtime。
6. 確認 deployment READY 後，使用 Make Scenario 的高階 result 驗證 credential；只讀 Scenario outcome，不讀 HTTP module input/header。
7. 以 Neon read-only query 分開確認資料庫狀態。

## Phase 5.2 — Production validation

Credential rotation 後需確認：

- 最新 `main` Production deployment READY。
- `daily.azubot.xyz` 與 Vercel production aliases 正常解析。
- 公開 `/`、`/news`、`/frameworks` 與既有 report detail routes 可讀。
- `/api/v1/ingest` 未提供合法 Bearer credential 時不可寫入。
- Neon Production schema/indexes 與 application schema 一致。
- Repo 與 Phase 5 文件不包含 secret value。

不以 Production UPDATE/DELETE 做驗證，不為了測試清除現有報告。

## Phase 5.3 — Enable recurring production delivery

只有在 Phase 5.1 與 5.2 完成後才修改兩個正式 recurring Tasks。

### `開發技術每日追蹤`

保留既有研究、來源品質、歷史去重、中文技術細節與每日排程；在 prompt 尾端加入 Phase 4 已驗證 delivery suffix：

- `reportType = daily-news`
- title 使用當次 Asia/Taipei business date：`開發技術每日追蹤｜YYYY-MM-DD`
- `contentMarkdown` 為完整乾淨 Markdown，不得含 ChatGPT UI citation token
- `generatedAt` 為實際送出時間，ISO 8601 + `+08:00`
- `sources` 為去重的 structured `{ title, url }[]`，優先官方/primary sources
- 無符合內容時仍呼叫 Make，正文固定為 deterministic no-result Markdown，`sources = []`
- 呼叫 `Daily Report - Publish to Vercel`

### `每日突破性工具推薦`

保留既有選題、歷史去重、fallback、分析結構與每日排程；在 prompt 尾端加入 Phase 4 已驗證 delivery suffix：

- `reportType = framework-recommendation`
- title：`每日突破性工具推薦｜<最終推薦工具名稱>`
- `contentMarkdown` 為完整乾淨 Markdown，不得含 ChatGPT UI citation token
- `generatedAt` 為實際送出時間，ISO 8601 + `+08:00`
- `sources` 為去重的 structured `{ title, url }[]`，優先官方/primary sources
- 保留「沒有值得推薦的新項目時，改選近期快速成長的代表性工具」fallback，不發布空白報告
- 呼叫 `Daily Report - Publish to Vercel`

兩個 Task 原排程與 enabled 狀態均保持，不為 Phase 5 驗證改成臨時高頻排程。

## Phase 5.4 — First unattended recurring execution

兩個 recurring Task 都必須經過至少一輪原本的每日排程自行觸發後才完成 launch acceptance。

每個 report type 驗證：

1. Scheduled Task 由原定 schedule 自行執行。
2. Make execution 為成功；僅讀 high-level outcome。
3. Neon 新增正確的 `(report_type, report_date)` row exactly once。
4. title、generatedAt、Markdown、sources 與 Asia/Taipei business date 正確。
5. 首頁、對應 archive、detail route 正確顯示。
6. persisted Markdown 不含 ChatGPT UI citation serialization。
7. 不因驗證而執行 Production UPDATE/DELETE。

## Phase 5.5 — Release closure

第一輪 unattended recurring execution 通過後：

- 更新 `phase-5-verification.md` 完整記錄最終 deployment、Make execution、Neon 與網站證據，但不記錄 secret。
- 將 `architecture.md` 的 Phase 5 target 更新為 live recurring production flow。
- 在 `decisions.md` 記錄最終 secret rotation 與 Make edit safety boundary。
- 完成 `todo.md` Phase 5 checklist。
- 更新 `README.md` current status 與 `changelog.md` launch entry。
- 清理 stale temporary notes；歷史 Phase 4 shadow records 可保留作稽核證據。
- 建立/更新 Phase 5 PR，所有進入 `main` 的內容使用 squash merge。
- merge 後再次確認 `main` Production deployment READY。

## Phase 5 acceptance

只有以下全部成立才能標記 Phase 5 完成：

- final `INGEST_SECRET` 已安全同步到 Vercel Production 與 Make，且未出現在可讀診斷輸出。
- secret rotation 後有新的 Vercel Production deployment 且為 READY。
- 兩個正式 recurring Scheduled Tasks 已加入 Phase 4 verified delivery contract，原研究規則與排程未被削弱或改變。
- 兩個 Task 都至少完成一輪原排程 unattended Production publish。
- 對應 Neon row exactly once，公開網站正確呈現。
- Production deployment、database、Make Scenario 與公開讀取均健康。
- `/AI-build` 與 live system 一致。
- 最終變更以 squash merge 進入 `main`。
