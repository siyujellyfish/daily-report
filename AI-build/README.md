# AI Build

此目錄記錄 Daily Report 的架構、技術決策、完整實作階段、風險與後續功能調整。所有功能性實作前應先閱讀此目錄，完成實作後同步更新相關文件。

## Current status

- Phase 0 — Initialization：完成。
- Phase 1 — Ingestion：完成並已通過 Make → Vercel → Neon 端到端驗證。
- Phase 2 — Public website：已完成程式實作與本機建置；PR / Preview 驗收進行中。
- Phase 3 — Testing & quality：待 Phase 2 基本功能完成後執行。
- Phase 4 — Scheduled Tasks integration：待網站與資料顯示驗證完成後執行。
- Phase 5 — Production hardening & launch：最後正式啟用前執行；最終 `INGEST_SECRET` 輪替延後至此階段。

## Documents

- `phase-2-design.md`：已核准的網站風格、頁面互動與正式資料呈現規格。

- `architecture.md`：目前與目標系統架構、資料流、runtime boundary、頁面與資料讀取層。
- `decisions.md`：已確定的技術與產品決策，以及後續實作約束。
- `todo.md`：Phase 0–5 完整實作清單與驗收條件，作為主要進度來源。
- `changelog.md`：實際完成的初始化、功能、驗證、安全與文件調整紀錄。

## Working rules

- Repo：`siyujellyfish/daily-report`。
- 功能性調整與重要決策都應同步更新 `/AI-build`。
- 所有進入 `main` 的變更一律透過 PR 並使用 squash merge。
- 套件新增或升級前需重新確認官方文件與目前相容的 stable 版本。
- 不使用 OpenAI API；報告產生維持由 ChatGPT Scheduled Tasks 執行。
- Secret 不可提交到 Git；正式排程啟用前需完成 Phase 5 的最終憑證輪替。
