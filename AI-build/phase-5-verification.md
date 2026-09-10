# Phase 5 — Verification record

## Current status

Phase 5 已開始，但尚未達成 launch acceptance。2026-09-10 已完成 Production preflight，使用者亦已執行 final `INGEST_SECRET` rotation 與 Vercel Production redeploy；然而第一次 rotation 後的 high-level Make credential validation 回傳 `Unauthorized`，表示 Vercel runtime 與 Make Authorization 目前仍未使用相同有效 credential。

在 credential high-level validation 成功前，兩個正式 recurring Scheduled Tasks 不加入 Production publishing，避免把失效 credential 帶入每日正式流程。

## Preflight verification — 2026-09-10

### Vercel Production baseline

- Project：`daily-report`。
- Project ID：`prj_KMaRvluXMunuiRsB5TNPWHj3pFr3`。
- Baseline Production deployment：`dpl_P4G3qp9aHRdEk5nVTn3jDP4qgn8c`。
- State：`READY`。
- Target：`production`。
- Git ref：`main`。
- Git commit：`0f25c8502a952e2fe5571af963d6d7bf2fd10f17`，Phase 4 PR #10 squash merge。
- Production domains/aliases include `daily.azubot.xyz` and Vercel production aliases.

### Make production transport

- Space：private space。
- Scenario：`Daily Report - Publish to Vercel`。
- Scenario ID：`7294339`。
- State：active。
- Trigger：on-demand。
- Incomplete executions：0。
- Flow：Start Subscenario → Build report JSON → HTTP MakeRequest → ReturnData。
- Interface 與 Phase 4 frozen contract 一致：`reportType`、`title`、`contentMarkdown`、`generatedAt`、`sources[] { title, url }`。

只讀 scenario structure/interface，未讀 HTTP module configuration，因此未開啟或暴露 Authorization header/input。

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

兩個正式 Tasks 仍 enabled，且尚未改寫 publishing 行為：

- `開發技術每日追蹤`：daily recurring，Task ID `6a62e583aac081918e23602484618f54`。
- `每日突破性工具推薦`：daily recurring，Task ID `6a7333e544788191ab2a5626784905c5`。

2026-09-10 的原排程執行在 Phase 5 開始前已完成，因此 Phase 5 啟用 recurring publishing 後，第一輪可作 launch acceptance 的 unattended recurring execution 必須來自下一次原定 daily schedule；不為驗收修改成臨時高頻排程。

## Final credential rotation attempt — 2026-09-10

使用者回報已在 Vercel Production 與 Make UI 完成 final `INGEST_SECRET` rotation，且未把 secret 貼入 ChatGPT。

### Post-rotation Vercel deployment

- Production redeploy：`dpl_2hsprAQ5637aig9UjtXovxuq1PgL`。
- State：`READY`。
- Target：`production`。
- Source：redeploy。
- Production aliases包含 `daily.azubot.xyz`。

此 deployment 已證明 rotation 後有新的 Production runtime 被建立，但 credential 是否與 Make 同步必須由 authenticated Make request 驗證，不能只由 deployment READY 推定。

### High-level Make credential validation

為避免新增 Production row，以 2026-09-10 已存在的 `daily-news` report 做 exact retry。測試 payload 由 Neon read-only query 取回 persisted canonical values：

- `reportType = daily-news`
- title：`開發技術每日追蹤｜2026-09-10`
- generatedAt：`2026-09-10T09:31:47+08:00`
- contentMarkdown 與 persisted row 完全一致
- `sources = []`

Make execution：`3750e04c2c384b34bf389c28a83a8c57`。

結果：

- status：`error`
- failing module：`http:MakeRequest`
- message：`Unauthorized`

只讀 `scenario_run` 的 high-level result；未開啟 module request、header 或 Authorization input。

### Persistence safety after failed validation

Validation 後以 Neon read-only query 再確認：

- `daily-news / 2026-09-10` row count 仍為 `1`。
- persisted payload hash 仍為 `97952b030fb720752454fece7a07cadbe9c5dd8036074eb937de40faf53ae7c1`。
- 沒有新增、更新或刪除 Production report。

因此這次失敗是 credential validation failure，不是 persistence corruption。

## Current credential gate

目前需重新確認同一組 secret 的同步方式：

- Vercel Production `INGEST_SECRET`：只存 secret 本體，不包含 `Bearer ` prefix。
- Make HTTP request `Authorization` header：值必須是 `Bearer <同一組 secret>`。
- 重新儲存 Make Scenario。
- Vercel 在 Environment Variable 儲存完成後，再執行一次 Production redeploy。

Secret 不得貼入 ChatGPT，也不以 Make module inspection 驗證內容。完成後再次執行同一筆 exact retry；只有 high-level Make outcome 成功且 Neon row count 仍維持 1，credential gate 才能關閉。

## Acceptance status

- [x] Phase 5 preflight：Vercel baseline READY。
- [x] Phase 5 preflight：Make Scenario active/on-demand/contract unchanged。
- [x] Phase 5 preflight：Neon Production branch ready，schema/indexes 與 application 一致。
- [x] Phase 5 preflight：兩個 recurring Tasks enabled 且仍維持原 prompt/schedule。
- [x] User performed final credential rotation attempt without exposing secret in ChatGPT。
- [x] New Vercel Production redeploy after rotation is READY。
- [ ] New credential verified through high-level Make outcome without reading Authorization input/header — first validation returned `Unauthorized`。
- [ ] Recurring delivery suffix applied to both real Tasks。
- [ ] First unattended recurring executions publish exactly once for both report types。
- [ ] Public website renders the new recurring reports correctly。
- [ ] Final `/AI-build` closure and squash merge completed。
