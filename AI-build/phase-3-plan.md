# Phase 3 — Testing, quality and performance plan

## 狀態與目標

Phase 2 已完成公開網站與 Preview 讀取驗證，透過 PR #7 以 squash 交付 main。Phase 3 尚未開始實作；目標是建立可重複執行的測試，驗證已採用設計的完整閱讀流程，並修復驗證發現的問題。`todo.md` 仍是完成狀態的主要來源。

## 預計實作順序

1. **測試基礎**：重新查閱 Vitest、Playwright 官方文件，確認與目前 Node、Next.js、React 相容的最新穩定版本；加入明確的測試指令與可重現資料 fixtures。
2. **Vitest 單元測試**：日期跨越台北午夜、閏日、slug 產生與解析、無效分頁、資料映射、sources 正規化與安全 URL；Markdown 摘要、重複標題 anchor、程式碼圍欄、標題層級與閱讀時間邊界。
3. **資料讀取整合測試**：在隔離測試資料庫驗證分類、最新報告、排序、跨頁與缺少報告；與純邏輯測試分開執行。
4. **Playwright 瀏覽器測試**：首頁 → 分類 → 報告內頁、分頁、404、來源連結與 Markdown；桌面及代表性手機尺寸下的選單、目錄、主題切換與重載持續性、程式碼複製成功及失敗提示。
5. **品質修正**：鍵盤操作、可見焦點、標題語意、深淺色對比、長標題及 URL、窄螢幕表格與程式碼捲動；驗證空資料及可重試錯誤狀態。
6. **效能與交付**：檢查不必要的客戶端請求與 JavaScript、公開回應的資料邊界；有實際瓶頸時才檢查 query plan。整理可在 CI 執行的型別、單元、整合、E2E 與 build 檢查，更新驗證紀錄及 PR。

## 測試資料與環境

- 正式資料目前只有 P1 framework 測試報告，無法單靠正式站涵蓋新聞、多頁列表或完整 GFM 情境。
- 使用隔離測試資料庫或可拋棄的 Neon 測試分支建立兩類報告、超過一頁的資料、完整 GFM／sources fixtures；seed 與清理只允許明確指定的測試環境。
- Production 僅做唯讀 smoke checks，不寫入或刪除正式資料。錯誤注入只在測試環境進行。
- DB 整合與瀏覽器測試需明確配置測試連線；未配置時應清楚標示未執行，不能當作驗收通過。
- CI 不輸出連線字串或憑證；純單元測試不需要 Production secrets。測試報告記錄環境、commit、通過範圍與限制。

## 驗收條件

- 型別檢查、Vitest、隔離 DB 整合測試、Playwright 關鍵流程及 production build 通過。
- 對應 PR commit 的 Vercel Preview 成功，實際頁面及瀏覽器互動驗證有紀錄。
- 無阻擋閱讀的手機版、鍵盤操作、深淺色或 Markdown 顯示問題。
- 公開頁面不暴露伺服器憑證，且沒有新增不必要的公開寫入介面。
- `/AI-build` 與測試指令同步更新，透過 PR squash 合併 main。

## 後續階段

Phase 4 接入兩個真實 ChatGPT Scheduled Tasks，驗證 Make → Vercel → Neon → 網站的完整內容與來源。Phase 5 處理最終憑證輪替、正式排程啟用與無人值守觀察。搜尋、RSS、CMS、額外快取維持後續需求評估。
