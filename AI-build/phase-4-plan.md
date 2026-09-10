# Phase 4 — Real Scheduled Tasks integration plan

## 狀態與目標

Phase 3 已完成並透過 PR #8 squash merge 至 `main`。Phase 4 的目標是用**真實報告生成規則**驗證 ChatGPT Scheduled Task → Make → Vercel → Neon → public website 的完整內容鏈路，同時維持 Phase 5 的安全邊界：在最終 `INGEST_SECRET` 輪替前，不把目前兩個每日 recurring Task 永久改成自動 production publisher。

目前實際 Scheduled Tasks：

- `開發技術每日追蹤`：每日執行，對應網站/report contract 的 `daily-news`。
- `每日突破性工具推薦`：每日執行，對應 `framework-recommendation`。

目前 Make production transport：

- Scenario：`Daily Report - Publish to Vercel`。
- Trigger：on-demand。
- Inputs：`reportType`、`title`、`contentMarkdown`、`generatedAt`、`sources[]`。
- `sources[]` item：`title` + `url`。
- Make 僅負責 transport/serialization，不產生或改寫報告內容。

舊的 `Scheduled Task POC Test` / `Daily Report - ChatGPT POC` 只保留為歷史 POC，不作為 Phase 4 正式資料路徑。

## 核心安全決策：one-shot shadow validation

兩個正式每日 Task 目前均為 enabled。若 Phase 4 直接加入 Make delivery suffix，下一次每日執行就會在 Phase 5 最終 secret 輪替前開始持續寫入 Production，與既有「最終憑證輪替後才啟用 recurring production delivery」決策衝突。

Phase 4 因此採用以下方式：

1. 完整保留兩個正式 recurring Task 的現有研究/選題規則與排程，不在 Phase 4 永久加入 publishing 行為。
2. 各建立一個**一次性 shadow Scheduled Task**，內容複製正式 Task 的真實研究規則，再附加已定義的 Make delivery contract。
3. shadow Task 必須由排程自行觸發並完成 Make 呼叫，不依賴人工在執行當下批准。
4. 每個 report type 只進行一次 Production content validation；測試前確認該 Asia/Taipei business date 尚無同 type row，避免 `(report_type, report_date)` collision。
5. 驗證完成後 one-shot task 自然結束，不形成持續 production publishing。
6. Phase 5 完成最終 `INGEST_SECRET` 輪替後，再把 Phase 4 已驗證的 delivery suffix 套用到兩個正式 recurring Task。

這個策略不會停用或破壞使用者目前每天在 ChatGPT 內取得報告的既有行為。

## Phase 4.1 — Contract freeze

兩種報告共用 Make Scenario 與 schema version `1`，只改變 `reportType` 與內容。

### Common delivery contract

- `reportType`：只允許 `daily-news` 或 `framework-recommendation`。
- `title`：人類可讀、可直接顯示在網站，不使用 Make/ChatGPT 內部測試名稱。
- `contentMarkdown`：完整 Markdown 正文；不得含 ChatGPT UI citation serialization（例如 `cite...`）。
- `generatedAt`：該次 Scheduled Task 實際完成報告並準備送出的時間，ISO 8601，明確帶 `+08:00`。
- `sources`：結構化陣列，每項固定 `{ title, url }`；URL 去重，優先保留官方/primary sources。
- 不把 `sources` 另外手寫成 JSON 字串；直接使用 Make Scenario 的 array input。
- 不把 structured sources 重複嵌入成網站依賴的 Markdown source section；網站 attribution 以 `sources` 欄位為準。
- Make 不得重新摘要、翻譯或改寫 `contentMarkdown`。

### Title convention

- `daily-news`：`開發技術每日追蹤｜YYYY-MM-DD`。
- `framework-recommendation`：`每日突破性工具推薦｜<工具名稱>`；工具名稱取當次最終推薦標的。

日期一律以 Asia/Taipei business date 決定。

## Phase 4.2 — `daily-news` shadow task

來源規則完整沿用目前 `開發技術每日追蹤`：

- 搜尋上次報告後的新開發技術動態。
- 優先官方公告、官方文件、官方部落格、GitHub Release 與 primary release sources。
- 範圍維持 AI Agent framework、web frontend/backend framework、JS/TS runtime、programming language releases/functional updates。
- 保留歷史內容去重要求。
- 中文、偏技術細節，包含名稱、版本、發布日期、功能、影響與官方來源。

Delivery-specific rules：

- `reportType = daily-news`。
- `title = 開發技術每日追蹤｜YYYY-MM-DD`。
- 完整報告送入 `contentMarkdown`。
- 研究使用的公開來源整理成 `sources[]`，同 URL 去重。
- 若當日沒有符合條件的新內容，仍發布明確 no-result report，而不是跳過 Make：
  - title 仍使用當日 title convention。
  - `contentMarkdown = "# 本日無結果\n\n本日無符合條件的新開發技術動態。"`。
  - `sources = []`。

## Phase 4.3 — `framework-recommendation` shadow task

來源規則完整沿用目前 `每日突破性工具推薦`：

- 每次只推薦一套近期仍活躍或新出現的軟體框架/開發工具。
- 範圍維持 frontend/backend/full-stack/language/UI/AI/database/SQL/ORM/package manager/runtime/DevOps/testing/compiler/developer tools。
- 優先突破性、架構創新、效能躍進、開發模式改變或生態潛力。
- 保留歷史推薦去重。
- 正文維持定位、適用情境、突破性重點、核心架構、優勢、同類比較、缺點/限制、適合與不適合專案、結論。
- 若沒有值得推薦的新發布項目，保留既有 fallback：選近期快速成長且具代表性的工具，並說明原因；不改成空白報告。

Delivery-specific rules：

- `reportType = framework-recommendation`。
- `title = 每日突破性工具推薦｜<工具名稱>`。
- 完整報告送入 `contentMarkdown`。
- 研究使用的公開來源整理成 `sources[]`，同 URL 去重，優先官方 sources。

## Phase 4.4 — Controlled execution procedure

每一種 report type 依序執行，避免同時產生難以定位的失敗。

1. 執行前以 read-only 方式檢查 Neon Production 當日 `(report_type, report_date)` 是否已存在。
2. 若已存在不同 payload，不進行當日 shadow publish；改用下一個無 collision 的 business date，不以 UPDATE/DELETE 清除 Production row。
3. 建立 one-shot shadow Scheduled Task，使用正式 Task 的完整研究 prompt + Phase 4 delivery suffix。
4. 由排程自行觸發；不要在執行時要求人工 approval。
5. Make 使用現有 `Daily Report - Publish to Vercel` on-demand Scenario。
6. 只查看高階 execution outcome；不得打開 HTTP module 的 Authorization header/input，以免再次暴露 `INGEST_SECRET`。
7. 讀取 Neon 驗證：report type/date/title、Markdown、sources、generatedAt、row count。
8. 驗證網站：
   - `daily-news`：`/`、`/news`、對應 `/reports/[slug]`。
   - `framework-recommendation`：`/`、`/frameworks`、對應 `/reports/[slug]`。
9. 驗證完整 Markdown rendering、structured source attribution、Asia/Taipei date 與 safe external links。
10. 同一 payload 如需 retry，只允許 exact retry，預期 API `200 duplicate: true` 且 row count 不增加；不得以不同 payload 重送同 type/date。

## Phase 4.5 — Validation matrix

### Transport

- Scheduled Task 自動完成 Make invocation。
- Make Scenario 收到五個 contract inputs。
- Vercel ingest 回應成功。
- 沒有人工 approval gate。

### Persistence

- Neon Production 只新增預期的一筆 row/type/date。
- `report_type` 正確。
- `generated_at` 對應實際執行時間。
- `report_date` 符合 Asia/Taipei。
- Markdown 未被 JSON escaping 破壞。
- `sources` 保留為 structured JSONB array。

### Public rendering

- 首頁最新卡片更新到新報告。
- 正確 archive 顯示新 row。
- detail route 完整呈現 headings/lists/tables/code 等實際內容。
- source attribution 可點擊且 URL 正確。
- Markdown 中不存在 ChatGPT UI citation token。

### Idempotency / failure handling

- exact retry 不產生第二 row。
- occupied type/date 的不同 payload 不覆蓋既有內容。
- Make/Vercel 失敗視為 validation failure，不以手動 DB 修補通過驗收。

## Phase 4 acceptance

Phase 4 只有在下列全部成立時完成：

- `daily-news` one-shot Scheduled Task 以正式研究規則自動發布成功。
- `framework-recommendation` one-shot Scheduled Task 以正式研究規則自動發布成功。
- 兩者都透過同一個 `Daily Report - Publish to Vercel` Scenario。
- 兩者都正確持久化到 Neon Production 並顯示於正確 public routes。
- Markdown、sources、title、generatedAt、Asia/Taipei business date 全鏈路正確。
- Scheduled Task → Make 執行過程不需要人工 approval。
- generation/research 仍由 ChatGPT Scheduled Tasks 負責；沒有 OpenAI API dependency。
- Phase 4 沒有永久啟用 recurring production publishing，正式每日 Task 的 production delivery 仍留到 Phase 5 最終 secret rotation 後套用。
- `/AI-build` 記錄實際 execution IDs/結果與任何偏差。

## Phase 5 handoff

Phase 4 成功後，Phase 5 不需要重新設計內容 contract，只做正式化：

1. 產生並安全套用最後一組 `INGEST_SECRET` 到 Vercel + Make。
2. 重新部署 Vercel Production，避免 runtime 仍持有舊 env value。
3. 僅使用高階 Make outcome + Neon state 驗證新憑證，不檢視 HTTP Authorization input/header。
4. 把 Phase 4 已驗證的 delivery suffix 套到兩個正式 recurring Tasks：
   - `開發技術每日追蹤` → `daily-news`。
   - `每日突破性工具推薦` → `framework-recommendation`。
5. 保留原本每日排程與既有研究/去重規則。
6. 觀察第一輪 unattended recurring production execution 後完成 launch closure。
