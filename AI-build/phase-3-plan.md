# Phase 3 — Testing, quality and performance plan

## 狀態與目標

Phase 2 已完成公開網站與 Preview 讀取驗證，透過 PR #7 以 squash 交付 main。Phase 3 於 2026-09-09 開始實作，並於 2026-09-10 完成核心驗收；目標是建立可重複執行的測試，驗證已採用設計的完整閱讀流程，並修復驗證發現的問題。`todo.md` 是完成狀態的主要來源。

最終實作 checkpoint `00bd49ee022e03ad88a117267058466455fcad7a` 的 Quality run `34422203392` 已完整通過：frozen install、TypeScript、17 個 Vitest unit tests、production build、4 個隔離 DB integration tests、Playwright critical paths、獨立 DB read-error 測試，以及 production-mode client JavaScript budget。Playwright 主 suite 為 29 passed / 5 個依 viewport 條件正常 skipped / 0 failed；read-error 1/1 passed；performance 1/1 passed。對應 Vercel Preview `dpl_3yqr4rGMSkLtEXazdVso6JaAvEew` 為 READY。

## 實作順序與完成結果

1. **測試基礎**：重新查閱 Vitest、Playwright 官方文件，確認與目前 Node、Next.js、React 相容的最新穩定版本；採用 Vitest 5.0.0、Playwright 1.63.0，加入明確測試指令與可重現資料 fixtures。
2. **Vitest 單元測試**：涵蓋日期跨越台北午夜、閏日、slug 產生與解析、無效分頁、資料映射、sources 正規化與安全 URL、Markdown 摘要、重複標題 anchor、程式碼圍欄、標題層級與閱讀時間，以及首頁/archive 空資料狀態；最終 17/17 通過。
3. **資料讀取整合測試**：在 Neon `phase3-testing` 隔離測試資料庫驗證分類、最新報告、排序、跨頁、detail mapping 與缺少報告；4/4 通過，並與純邏輯測試分開執行。
4. **Playwright 瀏覽器測試**：涵蓋首頁 → 分類 → 報告內頁、分頁、404、來源連結與 Markdown；桌面及 Pixel 7 下的選單、目錄、主題切換與重載持續性、程式碼複製成功/失敗提示、skip link、mobile overflow、accessibility semantics；主 suite 最終 29 passed / 5 conditional skips / 0 failed。
5. **品質修正**：驗證鍵盤操作、可見焦點、標題語意、深淺色基本 WCAG AA 文字對比、長內容/窄螢幕捲動、meaningful link labels、空資料與可重試讀取錯誤。修正了 Next.js smooth-scroll metadata、首頁與重複 TOC 的 accessible names；錯誤注入測試 1/1 通過。
6. **效能與交付**：確認公開閱讀流程沒有 browser-side `/api/*` 讀取，保留 Server Component 直接查詢；以 `next start` production build 實測 cold-route client JS：`/` 505,082 bytes、`/news` 505,082 bytes、detail 506,241 bytes，均低於 1 MiB guard。未觀察到需要 query-plan 調校或 Redis/cache 的瓶頸，因此不增加額外基礎設施。

## 測試資料與環境

- Production 僅作唯讀 smoke checks，不寫入或刪除正式資料。錯誤注入只在測試環境進行。
- Neon `phase3-testing` 隔離 branch 從 Production schema/data 分支後只加入 Phase 3 fixtures；包含 13 筆 `daily-news` 與 2 筆 `framework-recommendation`，覆蓋兩頁 archive、兩分類、GFM、code fence、重複標題與 structured sources。
- 首次真實 DB integration 發現 2026-09-09 兩筆 fixture 的 Markdown 換行被存為字面 `\n`。經使用者授權後，只在 `phase3-testing` 精確修正；Production 未修改。
- DB integration 使用 `TEST_DATABASE_URL`，並拒絕 `TEST_DATABASE_URL === DATABASE_URL`，避免誤連 Production。
- Playwright local run 必須使用 `TEST_DATABASE_URL`，或明確設定 `PLAYWRIGHT_BASE_URL`；未提供安全測試來源時拒絕執行。
- read-error suite 以獨立 Next.js server 且不提供 `DATABASE_URL`，確認 HTTP 500 與 retryable error UI；readiness 使用不讀 DB 的 `/robots.txt`。
- production performance suite 使用已完成的 `next build`，以 `next start` 啟動並量測 browser cold-load JavaScript；未使用額外 bundle-analyzer 套件。
- CI 不輸出連線字串或憑證；純單元測試不需要 Production secrets。未配置 `TEST_DATABASE_URL` 時 DB/E2E steps 會 skip，不能視為 Phase 3 驗收通過。

## 驗收結論

- 型別檢查、Vitest、隔離 DB 整合測試、Playwright 關鍵流程、read-error 與 production build 全部通過。
- 對應實作 checkpoint 的 Vercel Preview 成功，瀏覽器互動與實際頁面驗證有紀錄。
- 未發現阻擋閱讀的手機版、鍵盤操作、深淺色、Markdown 或 accessibility 問題。
- 公開閱讀流程維持 Server Component/server-side DB read，沒有新增 browser-side read API、公開寫入介面或測試憑證暴露。
- production cold-load client JavaScript 約 505–506 KB，低於 1 MiB CI guard；目前無實證需要 Redis/cache 或 DB query-plan 調校。
- CI 中 React script-rendering 訊息只在 `next dev` browser suite 出現，production `next start` performance run 未出現，且未造成任何互動/渲染失敗，因此記錄為非阻擋開發模式 warning，不做無證據的產品改動。
- `pnpm/action-setup@v4` 已改為官方 `pnpm/setup@v2` + Node 24，Next.js smooth-scroll metadata warning 已修正。

Phase 3 已達成交付條件。文件收斂後，以 PR #8 進行最後 branch-head CI/Preview 確認，確認成功即使用 squash merge 交付 `main`。

## 後續階段

Phase 4 接入兩個真實 ChatGPT Scheduled Tasks，驗證 Make → Vercel → Neon → 網站的完整內容與來源。Phase 5 處理最終憑證輪替、正式排程啟用與無人值守觀察。搜尋、RSS、CMS、額外快取維持後續需求評估。
