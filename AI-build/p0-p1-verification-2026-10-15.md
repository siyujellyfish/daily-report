# P0 / P1 — 最新 main 整合驗證（2026-10-15）

## 基準與範圍

- Source baseline: `main` commit `5ef1a36ac78ce974dd9f29a460c39a4432ae8048`（已包含 PR #21 的框架補刊紀錄）。
- Review branch: `verify/p0-p1-main-20261015`，Draft PR #22；對 P0 #19、P1 #20 的 staged 程式碼和文件做無衝突整合，不修改正式網站、Neon 資料或 Make 設定。
- 原兩項正式 08:00 排程不變；10:00 備援 Task 不存在／未啟用。P1 的 TypeScript policy 只是經測試的決策規格，不是背景 Worker。

## 實際 API／Preview 驗收

- P0 Preview：`dpl_Bmj81Jp9GMAMxk1cGGo1iucdcsJz` READY；P1 Preview：`dpl_PMAReyjTgS27dZBi3QQWMDDYNWGH` READY。
- 最新主線整合 Preview：`dpl_8EZRDxEjmzkqNcnFZa6UhrtHxpSN` READY，Git SHA 起始為 `570015201e3f056fdcc126d818e6caf2b91f1498`（之後僅更新文件）。
- 在各 Preview 使用 Vercel authenticated fetch 對 `GET /api/v1/reports/status` 做實際 HTTP 檢查：
  - `framework-recommendation` + `2026-10-15`：HTTP 200，`published=true`。
  - `daily-news` + `2026-10-15`：HTTP 200，`published=true`。
  - `framework-recommendation` + `2026-10-16`：HTTP 200，`published=false`（測試時尚未到該日）。
  - `app-store-limited-free` + `2026-10-15`：HTTP 400；不合法日期 `2026-02-30`：HTTP 400。
  - 所有受測狀態 API 回應都有 `Cache-Control: private, no-store, max-age=0`，無報告本文、row ID 或憑證欄位。
- 兩個版本的報告 detail route 均為 HTTP 200；正式站 `2026-10-12-framework-recommendation` detail route HTTP 200 且含 vLLM 報告標題。

## GitHub Quality／資料完整性

- 原 P0：run `37922124964` SUCCESS；38 unit / 10 isolated integration、Playwright 40 passed / 5 skipped / 1 flaky（重試後通過）。
- 原 P1：run `37931836700` SUCCESS；51 unit / 10 isolated integration、Playwright 40 passed / 5 skipped / 1 flaky（重試後通過）。
- 最新整合 PR #22：run `38693234320` SUCCESS；TypeScript、51 unit、10 Neon isolated integration、Playwright **41 passed / 5 conditional skipped / 0 flaky**、read-error 1、client JavaScript budget 1、測試 fixtures cleanup 全部通過。
- 正式 Neon `main` 在 2026-10-12 ～ 10/15 每日各有 `daily-news` 與 `framework-recommendation` **恰好一筆**。唯一鍵 `reports_payload_hash_unique`、`reports_type_date_unique` 仍有效。這是唯讀驗證，不修改正式資料。

## 尚未完成的正式上線 Gate

1. 在不修改正式既有報告的隔離情境執行**無人值守** missing-slot 補推，觀測從 ChatGPT Task → status → Make → persisted presence 的真實端到端行為。
2. 安全驗證 409 race、Make 結果不明以及同 payload 有界重試；現有單元與隔離整合測試不能取代真實 Task/Make 行為測試。
3. P0 狀態 API 正式部署後再驗證 Production 的 live status API；10:00 備援排程須取得另一次明確啟用決定。
4. 主分支交付與正式任務啟用需分別處理。上述 Gate 未全部通過前，本整合 PR 維持 Draft，不能宣稱「全自動補推已上線」。

## 安全邊界

- 不對 Production 執行 UPDATE、DELETE、TRUNCATE 或建立測試報告。
- 不呼叫或讀取 Make 的 credential-bearing HTTP input/header。
- 不變更任何既有 ChatGPT Scheduled Task 排程、不啟用 10:00 備援。
- 沒有新增依賴、schema migration 或付費 OpenAI API。
