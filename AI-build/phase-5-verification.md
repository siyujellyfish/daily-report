# Phase 5 — Verification record

## Current status

Phase 5 已於 2026-09-11 完成。Final `INGEST_SECRET` 已安全輪替並經 high-level Make outcome 驗證；兩個正式 recurring Scheduled Tasks 保留原研究規則與 daily schedule，並完成第一輪 original-schedule unattended Production publish。Make、Neon exactly-once、公開網站、PR #11 squash merge 與 post-merge Vercel Production 均通過。

PR #11 已以 squash merge 合併至 `main`，squash commit 為 `b0efb79d33c4056687fa52a6fd120668cf4f176c`；對應 Vercel Production deployment `dpl_EbtXhGCyb8gsyy6gGn9GHyvEuauR` 已達 `READY`。Phase 5 launch acceptance 全部完成。

## Preflight verification — 2026-09-10

### Vercel Production baseline

- Project：`daily-report`。
- Project ID：`prj_KMaRvluXMunuiRsB5TNPWHj3pFr3`。
- Phase 5 preflight baseline：`dpl_P4G3qp9aHRdEk5nVTn3jDP4qgn8c`。
- State：`READY`。
- Target：`production`。
- Git ref：`main`。
- Git commit：`0f25c8502a952e2fe5571af963d6d7bf2fd10f17`，Phase 4 PR #10 squash merge。

### Make production transport

- Scenario：`Daily Report - Publish to Vercel`。
- Scenario ID：`7294339`。
- State：active。
- Trigger：on-demand。
- Frozen interface：`reportType`、`title`、`contentMarkdown`、`generatedAt`、`sources[] { title, url }`。
- Flow：Start Subscenario → Build report JSON → HTTP MakeRequest → ReturnData。

整個 Phase 5 只讀 high-level Scenario / execution outcome；未讀 HTTP module Authorization header/input。

### Neon Production

- Project ID：`shiny-fire-00063440`。
- Production branch：`main` / `br-empty-shape-b3x5225o`。
- Branch ready。
- `reports` schema 與 `src/db/schema.ts` 一致。
- Unique controls：`reports_payload_hash_unique`、`reports_type_date_unique`。
- Query indexes：`reports_date_idx`、`reports_type_date_idx`。

未對 Production 執行 UPDATE、DELETE、fixture 或 migration。

## Final credential rotation — 2026-09-10

### Rotation procedure

Final `INGEST_SECRET` 由使用者直接在 Vercel / Make UI 內同步，secret value 從未貼入 ChatGPT、Git、Issue/PR 或 `/AI-build`，也未使用 credential-bearing module inspection 讀取 Authorization input/header。

Rotation 後 Vercel Production redeploy：

- Deployment：`dpl_2hsprAQ5637aig9UjtXovxuq1PgL`。
- Target：`production`。
- State：`READY`。

第一次 high-level exact retry 因 Make 與 Vercel secret 尚未一致而由 HTTP module 回 `Unauthorized`。此結果證明沒有有效 Bearer credential 時 ingest 不接受寫入；Neon row count 維持 1。重新同步 Make Authorization 後再次使用同一 Phase 4 payload retry：

- Make execution：`b69d04ee710b474b9302e702a6dba85c`。
- Status：success。
- `receivedType = daily-news`。
- `receivedTitle = 開發技術每日追蹤｜2026-09-10`。
- Neon exact retry 後 row count 仍為 1，既有 `received_at` 未被修改。

因此 final credential、Bearer enforcement 與 idempotency gate 均通過，且未藉由 Production UPDATE/DELETE 做驗證。

## Recurring Production activation — 2026-09-10

Phase 4 verified delivery suffix 已正式加入兩個既有 recurring Tasks；只更新 prompt，未修改 schedule、timing mode 或 enabled state。

### `開發技術每日追蹤`

- Task ID：`6a62e583aac081918e23602484618f54`。
- `reportType = daily-news`。
- Schedule 保持 `DTSTART:20260725T080000` + `RRULE:FREQ=DAILY`。
- Timing mode：`flexible_schedule`。
- Enabled：true。
- 保留原研究範圍、來源品質、歷史去重與 no-result 規則。

### `每日突破性工具推薦`

- Task ID：`6a7333e544788191ab2a5626784905c5`。
- `reportType = framework-recommendation`。
- Schedule 保持 `DTSTART:20260806T080000` + `RRULE:FREQ=DAILY`。
- Timing mode：`flexible_schedule`。
- Enabled：true。
- 保留原選題、去重、分析結構與 fallback 規則。

## First unattended recurring acceptance — 2026-09-11

### Scheduled Tasks

兩個正式 Tasks 均由原本 daily schedule 自行執行，未使用 manual run 或臨時高頻排程：

- `開發技術每日追蹤`：last run `2026-09-11T00:23:58Z`，約 Asia/Taipei 08:23。
- `每日突破性工具推薦`：last run `2026-09-11T00:38:38Z`，約 Asia/Taipei 08:38。

兩者執行後仍 enabled，原 schedule 不變。

### Make high-level outcomes

2026-09-11 原排程窗口只有兩筆對應 Production publish execution，兩者皆 `startedBy = auto` 且 success：

1. `c0456ae55eef471e914369ec15afa709`
   - `receivedType = daily-news`
   - `receivedTitle = 開發技術每日追蹤｜2026-09-11`
2. `082cb3a2d41f4112a597980dde29bca3`
   - `receivedType = framework-recommendation`
   - `receivedTitle = 每日突破性工具推薦｜Mastra`

未檢視 execution module input/header。

### Neon exactly-once verification

以 read-only SQL 查詢 `report_date = 2026-09-11`：

#### `daily-news`

- Row count：`1`。
- Title：`開發技術每日追蹤｜2026-09-11`。
- `generated_at`：`2026-09-11T00:23:09Z` = Asia/Taipei `08:23:09`。
- `received_at`：`2026-09-11T00:23:46.805Z`。
- Structured sources：3。
- ChatGPT cite/UI token：false。

#### `framework-recommendation`

- Row count：`1`。
- Title：`每日突破性工具推薦｜Mastra`。
- `generated_at`：`2026-09-11T00:37:31Z` = Asia/Taipei `08:37:31`。
- `received_at`：`2026-09-11T00:38:19.688Z`。
- Structured sources：6。
- ChatGPT cite/UI token：false。

兩種類型均 exactly once；business date、generatedAt、Markdown serialization 與 structured sources 正確。

### Public website verification

以下 Production routes 均 HTTP 200 且顯示 2026-09-11 新資料：

- `/`：latest edition 為 `2026.09.11`，同時顯示 daily-news 與 Mastra 報告。
- `/news`：最新項目為 `開發技術每日追蹤｜2026-09-11`。
- `/frameworks`：最新項目為 `每日突破性工具推薦｜Mastra`。
- `/reports/2026-09-11-daily-news`：完整 Markdown、TOC 與 3 個 structured source links 正常。
- `/reports/2026-09-11-framework-recommendation`：完整 Markdown、TOC 與 6 個 structured source links 正常。

## Release closure — 2026-09-11

- Final PR #11 head `51ba9b67de9f0a057f35a66122b74754962f90a1` passed the full Quality workflow, including frozen install, typecheck, unit tests, production build, isolated DB integration, Playwright critical paths, read-error state and production client JavaScript budget.
- Matching final Vercel Preview `dpl_HEDNo6SrxDTnXNrX4KcaDCx2EqYy` reached `READY`.
- PR #11 was marked ready only after those gates passed.
- PR #11 was merged using `squash`, producing `main` commit `b0efb79d33c4056687fa52a6fd120668cf4f176c`.
- Matching post-merge Vercel Production deployment `dpl_EbtXhGCyb8gsyy6gGn9GHyvEuauR` reached `READY` with `daily.azubot.xyz` and the production aliases attached.

## Security notes

- Final secret value 未進入 ChatGPT、Git、PR、Issue 或 `/AI-build`。
- Make credential-bearing HTTP module configuration 未被讀取。
- Bearer rejection 由 rotation 時錯誤 credential 的 `Unauthorized` outcome 驗證。
- Production database validation 全程 read-only；未使用 UPDATE/DELETE 清理或修正資料。
- 第一輪 unattended acceptance 沒有修改正式 recurring schedules。

## Acceptance status

- [x] Phase 5 preflight：Vercel baseline READY。
- [x] Phase 5 preflight：Make Scenario active/on-demand/contract unchanged。
- [x] Phase 5 preflight：Neon Production branch ready，schema/indexes 與 application 一致。
- [x] Phase 5 preflight：兩個 recurring Tasks enabled 且維持原 prompt/schedule。
- [x] Final `INGEST_SECRET` rotation completed safely in Vercel + Make。
- [x] Rotation-era Vercel Production deployment is READY。
- [x] New credential verified through high-level Make outcome without reading Authorization input/header。
- [x] Invalid Bearer authentication is rejected without creating a Production row。
- [x] Recurring delivery suffix applied to both real Tasks without schedule changes。
- [x] First unattended recurring executions publish exactly once for both report types。
- [x] Public website renders the new recurring reports correctly。
- [x] Persisted Markdown contains no ChatGPT UI citation serialization。
- [x] Final `/AI-build` release bookkeeping completed。
- [x] PR #11 squash merged to `main` and post-merge Production deployment verified READY。
