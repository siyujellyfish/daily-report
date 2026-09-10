# Phase 5 — Verification record

## Current status

Phase 5 已開始，但尚未達成 launch acceptance。2026-09-10 已完成不涉及 secret 的 Production preflight 稽核；目前唯一硬性前置條件為 final `INGEST_SECRET` rotation。依既定安全邊界，在 credential rotation 與新的 Vercel Production deployment 完成前，不修改兩個正式 recurring Scheduled Tasks 的 publishing 行為。

## Preflight verification — 2026-09-10

### Vercel Production

- Project：`daily-report`。
- Project ID：`prj_KMaRvluXMunuiRsB5TNPWHj3pFr3`。
- Latest Production deployment：`dpl_P4G3qp9aHRdEk5nVTn3jDP4qgn8c`。
- State：`READY`。
- Target：`production`。
- Git ref：`main`。
- Git commit：`0f25c8502a952e2fe5571af963d6d7bf2fd10f17`，Phase 4 PR #10 squash merge。
- Production domains/aliases include `daily.azubot.xyz` and Vercel production aliases.

此 deployment 是 Phase 5 credential rotation 前的 baseline。完成 final secret rotation 後必須重新部署並以新的 deployment evidence 取代它作為 Phase 5 acceptance 證據。

### Make production transport

- Space：private space。
- Scenario：`Daily Report - Publish to Vercel`。
- Scenario ID：`7294339`。
- State：active。
- Trigger：on-demand。
- Incomplete executions：0。
- Flow：Start Subscenario → Build report JSON → HTTP MakeRequest → ReturnData。
- Interface 與 Phase 4 frozen contract 一致：`reportType`、`title`、`contentMarkdown`、`generatedAt`、`sources[] { title, url }`。

本次只讀 scenario structure/interface，未讀 HTTP module configuration，因此未開啟或暴露 Authorization header/input。

### Neon Production

- Project：`daily-report`。
- Project ID：`shiny-fire-00063440`。
- Default Production branch：`main` / `br-empty-shape-b3x5225o`。
- Branch state：ready。

以 read-only SQL 核對 `reports` table，實際欄位與 `src/db/schema.ts` 一致：

- `id` UUID primary key
- `schema_version` integer default 1
- `report_type` enum
- `report_date` date
- `title` varchar
- `content_markdown` text
- `sources` jsonb
- `generated_at` timestamptz
- `received_at` timestamptz default now()
- `payload_hash` varchar

實際 indexes：

- `reports_pkey`
- `reports_payload_hash_unique`
- `reports_type_date_unique`
- `reports_date_idx`
- `reports_type_date_idx`

未對 Production 執行 UPDATE、DELETE、fixture 或 migration。

### ChatGPT recurring Scheduled Tasks

兩個正式 Tasks 仍 enabled，且 Phase 4 沒有改寫其 research prompt 或 schedule：

- `開發技術每日追蹤`：daily recurring，Task ID `6a62e583aac081918e23602484618f54`。
- `每日突破性工具推薦`：daily recurring，Task ID `6a7333e544788191ab2a5626784905c5`。

2026-09-10 的原排程執行在 Phase 5 開始前已完成，因此 Phase 5 啟用 recurring publishing 後，第一輪可作 launch acceptance 的 unattended recurring execution 必須等待下一次原定 daily schedule；不為驗收修改成臨時高頻排程。

## Credential rotation safety gate

Final `INGEST_SECRET` rotation 尚未完成，故以下工作刻意保持 pending：

- Vercel Production `INGEST_SECRET` 更新。
- Make HTTP Authorization header 更新。
- secret rotation 後的 Vercel Production redeploy。
- credential high-level Make verification。
- recurring Tasks delivery suffix 正式套用。
- 第一輪 unattended recurring Production publish。

### Why this remains a manual UI step

Make ChatGPT App 的 `set_module_config` 是完整 module configuration replacement；安全修改 HTTP Authorization 必須先讀取現有 HTTP module configuration。這會違反 Phase 4/5 已確立的「最終 credential 驗證與修改過程不得檢視 Authorization input/header」界線。

因此不使用 ChatGPT Make module inspection/editing 來輪替 final secret。使用者需在 Vercel 與 Make UI 中自行輸入同一組新 secret，且 secret 不應貼入 ChatGPT。完成後，後續部署、high-level Make outcome、Neon/public rendering 與 recurring Task 更新可繼續自動驗證。

## Acceptance status

- [x] Phase 5 preflight：Vercel baseline READY。
- [x] Phase 5 preflight：Make Scenario active/on-demand/contract unchanged。
- [x] Phase 5 preflight：Neon Production branch ready，schema/indexes 與 application 一致。
- [x] Phase 5 preflight：兩個 recurring Tasks enabled 且仍維持原 prompt/schedule。
- [ ] Final `INGEST_SECRET` rotation completed safely in Vercel + Make。
- [ ] New Vercel Production deployment after rotation is READY。
- [ ] New credential verified through high-level Make outcome without reading Authorization input/header。
- [ ] Recurring delivery suffix applied to both real Tasks。
- [ ] First unattended recurring executions publish exactly once for both report types。
- [ ] Public website renders the new recurring reports correctly。
- [ ] Final `/AI-build` closure and squash merge completed。
