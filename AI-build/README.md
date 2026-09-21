# AI Build

此目錄記錄 Daily Report 的架構、技術決策、完整實作階段、風險與後續功能調整。所有功能性實作前應先閱讀此目錄，完成實作後同步更新相關文件。

## Current status

- Phase 0 — Initialization：完成。
- Phase 1 — Ingestion：完成並已通過 Make → Vercel → Neon 端到端驗證。
- Phase 2 — Public website：完成實作與 Preview 讀取驗證；透過 PR #7 以 squash 交付 main。
- Phase 3 — Testing & quality：完成。Vitest、隔離 Neon DB integration、Playwright 桌面/手機關鍵流程、accessibility/content quality、空資料/讀取錯誤狀態與 production client-JS budget 均已通過；最終交付透過 PR #8 squash merge。
- Phase 4 — Scheduled Tasks integration：完成。兩個 one-shot shadow Scheduled Tasks 已使用正式研究規則 unattended 通過 ChatGPT → Make → Vercel → Neon → public website 全鏈路 Production 驗證。
- Phase 5 — Production hardening & launch：完成。Final `INGEST_SECRET` 已安全同步；兩個正式 recurring Tasks 保留原 daily schedule 並使用 verified delivery contract。2026-09-11 第一輪 original-schedule unattended execution 已成功，Neon 兩種類型各 exactly once，公開頁面驗證通過。PR #11 已以 squash merge 合併至 `main`（`b0efb79d33c4056687fa52a6fd120668cf4f176c`），對應 Vercel Production deployment `dpl_EbtXhGCyb8gsyy6gGn9GHyvEuauR` 已達 `READY`。
- Phase 6 — Adaptive categories：進行中。6.1–6.2 已完成 category schema/migration 與 v1/v2 ingest；6.3–6.4 已完成 data-driven server read layer、`/category/[slug]` canonical routes、legacy 308 redirects、dynamic sitemap/metadata、兩列 adaptive Header/category rail、data-driven homepage、deterministic category tones 與 shared sticky offset。最新 Quality run `35548140378` 通過 25 unit、4 isolated DB integration、Playwright 30 passed / 4 skipped、read-error 1/1 與 JS budget 1/1。Production runtime 尚未部署 Phase 6；下一階段為 6.5 完整 3+ category / hidden-empty / metadata-sitemap / redirect-status 驗證。

## Documents

- `phase-6-plan.md`：Phase 6 自適應分類的資料模型、v1/v2 ingestion、migration、dynamic routes、UI/UX、測試與 rollout 計畫。
- `phase-6-1-verification.md`：Phase 6.1 category schema、custom migration、Production promotion 與隔離 Neon branch 驗證紀錄。
- `phase-6-2-verification.md`：Phase 6.2 v1/v2 ingestion contract、v1 hash regression、atomic Neon HTTP batch 與隔離第三分類 persistence 驗證紀錄。
- `phase-6-3-4-verification.md`：Phase 6.3 dynamic read/routes 與 Phase 6.4 adaptive UI/UX 的實作、隔離 DB 與 Quality 驗證紀錄。
- `phase-5-plan.md`：Phase 5 final credential rotation、Production hardening、recurring publishing activation、第一輪 unattended execution 與 launch closure 計畫。
- `phase-5-verification.md`：Phase 5 Production preflight、credential validation、recurring delivery activation、first unattended execution 與 launch acceptance 實際紀錄。
- `phase-4-plan.md`：Phase 4 真實 Scheduled Task 整合、one-shot shadow validation、payload contract、驗證矩陣與 Phase 5 handoff。
- `phase-4-verification.md`：Phase 4 兩個 shadow task、Make execution、Neon Production、公開網站與安全邊界的實際驗證紀錄。
- `phase-3-plan.md`：Phase 3 測試、品質、效能與驗收計畫，以及完成狀態。
- `phase-3-verification.md`：Phase 3 隔離 DB / Playwright / accessibility / error-state / performance / Preview 的實際驗證紀錄與限制。
- `phase-2-design.md`：已核准的網站風格、頁面互動與正式資料呈現規格。
- `architecture.md`：目前與目標系統架構、資料流、runtime boundary、頁面、資料讀取層與各階段整合邊界。
- `decisions.md`：已確定的技術與產品決策，以及後續實作約束。
- `todo.md`：Phase 0–6 完整實作清單與驗收條件，作為主要進度來源。
- `changelog.md`：實際完成的初始化、功能、驗證、安全與文件調整紀錄。

## Working rules

- Repo：`siyujellyfish/daily-report`。
- 功能性調整與重要決策都應同步更新 `/AI-build`。
- 所有進入 `main` 的變更一律透過 PR 並使用 squash merge。
- 套件新增或升級前需重新確認官方文件與目前相容的 stable 版本。
- 不使用 OpenAI API；報告產生維持由 ChatGPT Scheduled Tasks 執行。
- Secret 不可提交到 Git；credential-bearing Make 驗證只讀 high-level outcome，不讀取 Authorization header/input。
- Production 驗證不得以 UPDATE/DELETE 清除或改寫報告，也不得為驗收臨時修改正式 recurring schedule。
