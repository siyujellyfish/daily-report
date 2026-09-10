# Phase 4 — Verification record

## 結論

Phase 4 已於 2026-09-10 完成。兩個 one-shot shadow ChatGPT Scheduled Tasks 均使用正式研究規則自行觸發，經同一個 Make `Daily Report - Publish to Vercel` Scenario 傳送至 Vercel ingest API，成功持久化到 Neon Production，並可由公開網站首頁、分類 archive 與 detail route 正確讀取。

Phase 4 未修改兩個既有 recurring Tasks 的 prompt、排程或 enabled 狀態；recurring Production publishing 仍保留至 Phase 5 最終 `INGEST_SECRET` 輪替後才啟用。

## 執行前安全檢查

- Neon project：`daily-report`。
- Production branch：`br-empty-shape-b3x5225o`。
- Business date：`2026-09-10`（Asia/Taipei）。
- 執行前 read-only query 確認 `daily-news` 與 `framework-recommendation` 在該 business date 均無既有 row。
- 未對 Production 執行 UPDATE、DELETE 或 fixture 操作。
- Make 僅檢視 Scenario interface、execution status 與 return data；未開啟 HTTP Authorization header/input。
- 未在 chat、Git 或 `/AI-build` 記錄 `INGEST_SECRET`。

## Shadow Scheduled Tasks

### daily-news

- Shadow title：`Phase4 daily-news shadow`。
- 類型：one-shot exact schedule。
- 使用正式 `開發技術每日追蹤` 研究規則，附加 Phase 4 delivery contract。
- Shadow task 自行完成後自動停用。
- 正式 recurring `開發技術每日追蹤` 保持 enabled 且未修改。

本次研究結果無符合條件的新內容，因此依 contract 發布 deterministic no-result report：

```markdown
# 本日無結果

本日無符合條件的新開發技術動態。
```

- `reportType`：`daily-news`。
- title：`開發技術每日追蹤｜2026-09-10`。
- `sources`：`[]`。
- `generatedAt`：2026-09-10 09:31:47 +08:00（Neon timestamptz 顯示為 `2026-09-10T01:31:47.000Z`）。
- Make execution：`99bda209332447f9b7542a2cc9d54a33`。
- Make `startedBy`：`auto`。
- Make result：success；Vercel publish success。

### framework-recommendation

- Shadow title：`Phase4 framework shadow`。
- 類型：one-shot exact schedule。
- 使用正式 `每日突破性工具推薦` 研究、選題與 fallback 規則，附加 Phase 4 delivery contract。
- Shadow task 自行完成後自動停用。
- 正式 recurring `每日突破性工具推薦` 保持 enabled 且未修改。

本次選題：Microsoft TypeSpec 1.16。

- `reportType`：`framework-recommendation`。
- title：`每日突破性工具推薦｜Microsoft TypeSpec 1.16`。
- `generatedAt`：2026-09-10 09:34:12 +08:00（Neon timestamptz 顯示為 `2026-09-10T01:34:12.000Z`）。
- structured sources：7 筆，均為 Microsoft TypeSpec 官方網站、官方文件或 GitHub release。
- Make execution：`7f99d657f46c4b66a0549b14e70597c1`。
- Make `startedBy`：`auto`。
- Make result：success；Vercel publish success。

## Neon Production 驗證

2026-09-10 business date 最終 row count：

- `daily-news`：1。
- `framework-recommendation`：1。

共同驗證結果：

- `report_type` 正確。
- `report_date = 2026-09-10`，與 Asia/Taipei business date 一致。
- title 符合 frozen title convention。
- `generated_at` 與實際 shadow 執行時間一致。
- Markdown newline/格式未被 transport escaping 破壞。
- persisted Markdown 不含 `cite` ChatGPT UI citation token。
- `daily-news` sources 為空 array。
- framework report sources 為 7 筆 structured JSONB `{ title, url }`。
- 沒有產生第二筆相同 type/date row。

Phase 4 沒有需要 retry，因此未額外對 Production 重送 payload。Exact-retry idempotency 與 occupied type/date conflict protection 已於 Phase 1 驗證；本次沒有為了重測而增加不必要的 Production write。

## Public website 驗證

Production project：Vercel `daily-report`；production deployment 在 Phase 4 驗證時為 READY。

以 Production URL 實際取得 server-rendered HTML，以下 route 均回傳 HTTP 200：

- `/`
- `/news`
- `/frameworks`
- `/reports/2026-09-10-daily-news`
- `/reports/2026-09-10-framework-recommendation`

### 首頁

- 最新刊期顯示 `2026.09.10`。
- `daily-news` 卡片顯示 `開發技術每日追蹤｜2026-09-10` 與 no-result 摘要。
- framework 卡片顯示 `每日突破性工具推薦｜Microsoft TypeSpec 1.16`。
- 兩張卡片均連到 deterministic detail slug。

### Archives

- `/news` 顯示 2026-09-10 `daily-news` row。
- `/frameworks` 最新 row 為 2026-09-10 TypeSpec 1.16 report。

### Detail routes

`daily-news`：

- 正確呈現 no-result heading 與 paragraph。
- 顯示 `2026/09/10 09:31（台北時間）`。
- 空 sources 正確呈現「本篇未附來源連結」。

`framework-recommendation`：

- 完整長篇 Markdown 成功呈現 headings、lists、inline code 與 TOC。
- 顯示 `2026/09/10 09:34（台北時間）`。
- 7 個 structured sources 全部呈現。
- 外部來源連結使用 `target="_blank"` 與 `rel="noopener noreferrer"`。
- 頁面未出現 ChatGPT UI citation serialization。

## Phase 4 acceptance

- [x] `daily-news` one-shot Scheduled Task 使用正式研究規則 unattended 發布成功。
- [x] `framework-recommendation` one-shot Scheduled Task 使用正式研究規則 unattended 發布成功。
- [x] 兩者均使用同一個 `Daily Report - Publish to Vercel` Scenario。
- [x] 兩者均 exactly once 持久化至 Neon Production。
- [x] 首頁、archive、detail route 均正確呈現。
- [x] Markdown、structured sources、title、generatedAt 與 Asia/Taipei business date 全鏈路正確。
- [x] Scheduled Task → Make 不需要 run-time manual approval；Make execution `startedBy = auto`。
- [x] generation/research 仍由 ChatGPT Scheduled Tasks 負責，沒有 OpenAI API dependency。
- [x] 既有 recurring Tasks 未被改造成 Production publisher。
- [x] 沒有暴露或檢視 Make HTTP Authorization secret。
- [x] Phase 4 execution IDs、Production state 與 public rendering evidence 已記錄。

## Phase 5 handoff

Phase 4 delivery contract 已完成實際 Production 驗證。Phase 5 只需正式化與 launch hardening：

1. 最終輪替 `INGEST_SECRET` 並安全同步 Vercel + Make。
2. 重新部署 Vercel Production，確認新 runtime credential 生效。
3. 將 Phase 4 已驗證的 delivery suffix 套至兩個正式 recurring Tasks。
4. 保留兩個 recurring Tasks 目前的研究規則與排程。
5. 觀察第一輪 unattended recurring Production execution 並完成 launch closure。
