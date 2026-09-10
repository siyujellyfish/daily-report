# AI Build

此目錄記錄 Daily Report 的架構、技術決策、完整實作階段、風險與後續功能調整。所有功能性實作前應先閱讀此目錄，完成實作後同步更新相關文件。

## Current status

- Phase 0 — Initialization：完成。
- Phase 1 — Ingestion：完成並已通過 Make → Vercel → Neon 端到端驗證。
- Phase 2 — Public website：完成實作與 Preview 讀取驗證；透過 PR #7 以 squash 交付 main。
- Phase 3 — Testing & quality：完成。Vitest、隔離 Neon DB integration、Playwright 桌面/手機關鍵流程、accessibility/content quality、空資料/讀取錯誤狀態與 production client-JS budget 均已通過；最終交付透過 PR #8 squash merge。
- Phase 4 — Scheduled Tasks integration：已完成詳細規劃，下一步使用兩個 one-shot shadow Scheduled Tasks 驗證真實內容的 ChatGPT → Make → Vercel → Neon → 網站鏈路；在 Phase 5 最終 secret 輪替前不永久啟用 recurring production publishing。
- Phase 5 — Production hardening & launch：最後正式啟用前執行；最終 `INGEST_SECRET` 輪替後才把 Phase 4 驗證過的 delivery contract 套到兩個正式 recurring Tasks。

## Documents

- `phase-4-plan.md`：Phase 4 真實 Scheduled Task 整合、one-shot shadow validation、payload contract、驗證矩陣與 Phase 5 handoff。
- `phase-3-plan.md`：Phase 3 測試、品質、效能與驗收計畫，以及完成狀態。
- `phase-3-verification.md`：Phase 3 隔離 DB / Playwright / accessibility / error-state / performance / Preview 的實際驗證紀錄與限制。
- `phase-2-design.md`：已核准的網站風格、頁面互動與正式資料呈現規格。
- `architecture.md`：目前與目標系統架構、資料流、runtime boundary、頁面、資料讀取層與各階段整合邊界。
- `decisions.md`：已確定的技術與產品決策，以及後續實作約束。
- `todo.md`：Phase 0–5 完整實作清單與驗收條件，作為主要進度來源。
- `changelog.md`：實際完成的初始化、功能、驗證、安全與文件調整紀錄。

## Working rules

- Repo：`siyujellyfish/daily-report`。
- 功能性調整與重要決策都應同步更新 `/AI-build`。
- 所有進入 `main` 的變更一律透過 PR 並使用 squash merge。
- 套件新增或升級前需重新確認官方文件與目前相容的 stable 版本。
- 不使用 OpenAI API；報告產生維持由 ChatGPT Scheduled Tasks 執行。
- Secret 不可提交到 Git；正式 recurring production publishing 前需完成 Phase 5 的最終憑證輪替。
