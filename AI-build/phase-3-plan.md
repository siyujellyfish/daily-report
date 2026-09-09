# Phase 3 — Testing, quality and performance plan

## 狀態與目標

Phase 2 已完成公開網站與 Preview 讀取驗證，透過 PR #7 以 squash 交付 main。Phase 3 已於 2026-09-09 開始實作；目標是建立可重複執行的測試，驗證已採用設計的完整閱讀流程，並修復驗證發現的問題。`todo.md` 仍是完成狀態的主要來源。

目前測試基礎與核心自動化驗證已完成：Vitest 5.0.0、Playwright 1.63.0 均依官方文件確認與 Node 24 相容；GitHub Repository Secret `TEST_DATABASE_URL` 已安全指向 Neon `phase3-testing` 隔離 branch。對 commit `5143e5e2458a2450b663bd2fd8a0d3d123b4e171` 的 Quality run `34327164875` 已通過 frozen install、TypeScript、15 個 unit tests、production build、4 個 DB integration tests 與 Playwright critical paths；Playwright 結果為 21 passed、3 個依 viewport 條件正常 skipped、0 failed。相同 commit 的 Vercel Preview `dpl_4JzY27ewXd9yirsnaDFnsrh8mosu` 為 READY。剩餘工作集中在 accessibility / content quality / performance review 與最終驗收整理。

## 預計實作順序

1. **測試基礎**：重新查閱 Vitest、Playwright 官方文件，確認與目前 Node、Next.js、React 相容的最新穩定版本；加入明確的測試指令與可重現資料 fixtures。
2. **Vitest 單元測試**：日期跨越台北午夜、閏日、slug 產生與解析、無效分頁、資料映射、sources 正規化與安全 URL；Markdown 摘要、重複標題 anchor、程式碼圍欄、標題層級與閱讀時間邊界。
3. **資料讀取整合測試**：在隔離測試資料庫驗證分類、最新報告、排序、跨頁與缺少報告；與純邏輯測試分開執行。
4. **Playwright 瀏覽器測試**：首頁 → 分類 → 報告內頁、分頁、404、來源連結與 Markdown；桌面及代表性手機尺寸下的選單、目錄、主題切換與重載持續性、程式碼複製成功及失敗提示。
5. **品質修正**：鍵盤操作、可見焦點、標題語意、深淺色對比、長標題及 URL、窄螢幕表格與程式碼捲動；驗證空資料及可重試錯誤狀態。
6. **效能與交付**：檢查不必要的客戶端請求與 JavaScript、公開回應的資料邊界；有實際瓶頸時才檢查 query plan。整理可在 CI 執行的型別、單元、整合、E2E 與 build 檢查，更新驗證紀錄及 PR。

## 測試資料與環境

- Production 仍只作唯讀 smoke checks，不寫入或刪除正式資料。錯誤注入只在測試環境進行。
- Neon 已建立 `phase3-testing` 隔離 branch，從 Production schema/data 分支後只新增 Phase 3 fixtures；目前包含 13 筆 `daily-news` 與 2 筆 `framework-recommendation`，可覆蓋兩頁 archive、兩分類、GFM、code fence、重複標題與 structured sources。
- 首次真實 DB integration 執行發現 2026-09-09 兩筆 fixture 的 Markdown 換行被存為字面 `\n`。經使用者授權後，只在 `phase3-testing` 精確修正為真正換行；Production 未修改。修正後 DB integration 4/4 通過。
- DB integration 使用 `TEST_DATABASE_URL`，並在測試內拒絕 `TEST_DATABASE_URL === DATABASE_URL`，避免誤連 Production。
- Playwright 可使用 `TEST_DATABASE_URL` 啟動本機 Next.js，或以 `PLAYWRIGHT_BASE_URL` 指向明確 Preview；未提供任一來源時直接拒絕執行。
- 首次 Playwright 真實執行為 17 passed / 3 skipped / 4 failed；4 個 failure 全部源自 archive title selector 同時模糊命中標題連結與 `閱讀：標題` arrow link。將測試 selector 改為 `exact: true` 後，不改產品行為，最終為 21 passed / 3 skipped / 0 failed。
- CI 不輸出連線字串或憑證；純單元測試不需要 Production secrets。`Quality` workflow 在未配置 `TEST_DATABASE_URL` 時只跑 frozen install、型別、單元與 build，DB/E2E steps 會 skip，不能當作 Phase 3 完成。
- 測試報告記錄環境、commit、通過範圍與限制。

## 已建立並執行的測試範圍

- Vitest：Taipei 午夜、閏日與非法日期、slug round-trip / invalid slug、分頁輸入、Markdown summary/reading time、duplicate heading IDs、fenced-code exclusion、source URL safety、ingest sources normalization、public report mapping。
- DB integration：最新兩分類、13 筆新聞的兩頁分頁與順序、detail heading/source mapping、missing report；4/4 通過。
- Playwright：首頁、兩 archive、分頁、detail、404、來源安全屬性、桌面/手機 viewport、mobile menu、Escape focus restore、mobile TOC、theme persistence、clipboard success/fallback、skip-link 鍵盤焦點；最終 21 passed、3 conditional skips、0 failed。

## 驗收條件

- 型別檢查、Vitest、隔離 DB 整合測試、Playwright 關鍵流程及 production build 通過。
- 對應 PR commit 的 Vercel Preview 成功，實際頁面及瀏覽器互動驗證有紀錄。
- 無阻擋閱讀的手機版、鍵盤操作、深淺色或 Markdown 顯示問題。
- 公開頁面不暴露伺服器憑證，且沒有新增不必要的公開寫入介面。
- `/AI-build` 與測試指令同步更新，透過 PR squash 合併 main。

## 後續階段

Phase 4 接入兩個真實 ChatGPT Scheduled Tasks，驗證 Make → Vercel → Neon → 網站的完整內容與來源。Phase 5 處理最終憑證輪替、正式排程啟用與無人值守觀察。搜尋、RSS、CMS、額外快取維持後續需求評估。
