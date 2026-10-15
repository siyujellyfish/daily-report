# 2026-10-15 — 框架推薦 10/12、10/13、10/15 漏發補刊與正式任務容錯

## 目的與證據（台北時間）

- Neon Production：專案 `shiny-fire-00063440` / branch `main`（`br-empty-shape-b3x5225o`）。
- 2026-10-12、10/13、10/15 的 `framework-recommendation` 最初都缺少資料；同日期 `daily-news` 均正常。
- Make `Daily Report - Publish to Vercel`（Scenario 7294339）在上述日期的高階執行紀錄僅包含 `daily-news`，沒有框架報告的 Scenario execution。
- 2026-10-14 框架推薦 `Apache Grails 8.0.0` 正常存在；本次完全不修改該筆。
- 每日框架推薦原 recurring ChatGPT Task 有執行時間紀錄，但沒有相應 Make 發布，故故障最可能在生成／工具交接／Make 呼叫之前；尚無足夠證據將某單一內部工具故障定為確切根因。

## 補刊結果（Production）

| 原應刊登日期 | 報告 | 實際處理方式 | 結果 |
| --- | --- | --- | --- |
| 2026-10-12 | vLLM 0.31.0 | Neon `INSERT ... ON CONFLICT DO NOTHING` 歷史補刊；`report_date=10/12`、`generated_at=10/15` | 恰 1 筆 |
| 2026-10-13 | Nuxt 4.6 | Neon `INSERT ... ON CONFLICT DO NOTHING` 歷史補刊；`report_date=10/13`、`generated_at=10/15` | 恰 1 筆 |
| 2026-10-15 | Eclipse Theia AI 1.76 | 正式 Make Scenario 7294339 實際發布，execution `f15eeb787266433399e9e617e8ae7118`，回傳 `success=true`、`receivedType=framework-recommendation` | 恰 1 筆 |

**重要時序邊界**：應用程式現有 `POST /api/v1/ingest` 會從 `generatedAt`（Asia/Taipei）推導 `report_date`。如果用正確的 10/15 真實時間透過 Make 發送歷史補刊，會錯誤地佔用 10/15，且 10/15 已有報告。本次兩個歷史日期只使用受控 Production INSERT，明確分開目標刊期與真實生成時間；內文均註明 10/15 回溯補刊，不偽裝成 10/12、10/13 自動推播成功。

歷史補刊使用已公布的官方版本、可信原始來源、結構化 sources；同時填入 `summary`、`reading_minutes` 與 `headings`，避免落入舊資料的每次閱讀重新解析路徑。SQL 使用唯一鍵 `(report_type, report_date)`、`payload_hash` 與 `ON CONFLICT DO NOTHING` 防重；沒有對 Production 執行 UPDATE、DELETE、TRUNCATE，也未修改 Make Scenario 參數或 credential。

**讀取驗收**：Neon read-only 檢查三個日期均為恰好一筆、有正式來源與 presentation 欄位。外部檢測環境對 `daily.azubot.xyz` DNS 無法解析，故不能宣稱已完成三個公開 detail URL 的 HTTP 200 驗證；網站讀取與 cache freshness 保留為後續驗收。

## 正式排程修正

2026-10-15 更新原本已啟用的 `每日突破性工具推薦` ChatGPT recurring Task（ID `6a7333e544788191ab2a5626784905c5`）**僅 Prompt**，排程仍為每天 08:00 Asia/Taipei、`flexible_schedule`、enabled。

- 單一來源、分類頁、歷史去重或文件讀取失敗時，使用官方來源／其他候選回退；不能因此跳過最終發布。
- 每日只推薦一項；無重大新工具時改用近期高代表性工具，不發布空白或無根據的報告。
- 固定 Make reportType/category metadata 與 clean Markdown / structured sources。
- 呼叫 Make 必須核對 `success=true`、`receivedType=framework-recommendation` 才聲稱成功。
- 暫時性錯誤最多以完全相同 payload 重試一次；對 409、401 或驗證問題不能無差別重試；工具無法使用／成功無法驗證時回報異常。
- 不回填虛假 `generatedAt`，不變更原排程、Make 情境、Neon schema、任何 secret 或既有報告。

## 待驗收／非本次範圍

- [x] 三日期 Neon exactly-once 與內容驗證。
- [x] 10/15 Make success and receivedType 驗證。
- [x] 正式 recurring Task 更新且原排程維持啟用。
- [ ] 三個 detail routes 正式網站 HTTP 200 與 cache 更新驗收（現有工具環境 DNS 無法解析）。
- [ ] 2026-10-16 下一輪原排程 unattended Make execution + Neon exactly-once；這是新 Prompt 的真正端到端驗收。
- [ ] P0/P1 自動備援功能仍在 Draft PR #19/#20、尚未合併到 main 或啟用備援排程；本次未觸碰這兩份 PR，不能把 Prompt 改善等同於無人值守備援已部署。
