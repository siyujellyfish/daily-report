# Phase 5 — Verification record

## Current status

Phase 5 尚未達成最終 launch acceptance，但 final credential gate 與 recurring publishing activation 已完成。

2026-09-10 使用者在 Vercel Production 與 Make UI 重新同步 `INGEST_SECRET` 後，第二次 high-level Make exact-retry validation 成功；Neon 確認同一 payload 仍只有一筆資料。隨後已將 Phase 4 驗證過的 Production delivery contract 套用到兩個正式 recurring Scheduled Tasks，保留原研究規則、daily schedule 與 enabled 狀態。

由於 2026-09-10 兩個正式 recurring Tasks 的原排程均在 Phase 5 publishing activation 前已執行完畢，第一輪可作 launch acceptance 的 unattended recurring execution 必須來自下一次原定 daily schedule。Phase 5 PR 在此之前保持 Draft，不提前 squash merge。

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

只讀 scenario structure/interface 與 high-level execution outcome，未讀 HTTP module configuration，因此未開啟或暴露 Authorization header/input。

### Neon Production

- Project：`daily-report`。
- Project ID：`shiny-fire-00063440`。
- Default Production branch：`main` / `br-empty-shape-b3x5225o`。
- Branch state：ready。
- `reports` table schema 與 `src/db/schema.ts` 一致。
- Production indexes：`reports_pkey`、`reports_payload_hash_unique`、`reports_type_date_unique`、`reports_date_idx`、`reports_type_date_idx`。
- 未對 Production 執行 UPDATE、DELETE、fixture 或 migration。

## Final credential rotation — 2026-09-10

使用者在 Vercel Production 與 Make UI 完成 final `INGEST_SECRET` rotation，且 secret 未貼入 ChatGPT、Git、PR 或 `/AI-build`。

### Post-rotation Vercel deployment

- Production redeploy：`dpl_2hsprAQ5637aig9UjtXovxuq1PgL`。
- State：`READY`。
- Target：`production`。
- Source：redeploy。
- Production aliases包含 `daily.azubot.xyz`。

此 deployment 是 final Vercel credential rotation 後建立的 Production runtime。

### First credential validation attempt

第一次以 2026-09-10 已存在的 `daily-news` report 做 exact retry：

- Make execution：`3750e04c2c384b34bf389c28a83a8c57`
- result：`error`
- failing module：`http:MakeRequest`
- message：`Unauthorized`

Neon read-only check 證實 row count 維持 1，沒有新增、更新或刪除 Production report。此次結果被判定為 Vercel/Make credential 尚未同步，而不是 persistence failure。

### Credential re-sync and successful validation

使用者重新確認：

- Vercel Production `INGEST_SECRET` 儲存 raw secret 本體，不含 `Bearer ` prefix。
- Make HTTP `Authorization` header 使用 `Bearer <同一組 secret>`。
- Make Scenario 重新儲存。

第二次使用完全相同的 persisted canonical payload 做 exact retry：

- Make execution：`b69d04ee710b474b9302e702a6dba85c`
- result：`success`
- output success：`true`
- message：`Daily Report published to Vercel successfully.`
- receivedType：`daily-news`
- receivedTitle：`開發技術每日追蹤｜2026-09-10`

驗證過程只讀 `scenario_run` high-level outcome，未檢視 module input/header。

Exact retry 後 Neon 再次以 read-only SQL 驗證 payload hash `97952b030fb720752454fece7a07cadbe9c5dd8036074eb937de40faf53ae7c1`：

- row count：`1`
- first received_at：`2026-09-10T01:32:01.761Z`
- last received_at：`2026-09-10T01:32:01.761Z`

row count 與 `received_at` 均未改變，final credential high-level validation 與 idempotency gate 因此通過。

## Production public read validation

Credential re-sync 後重新讀取 `https://daily.azubot.xyz/`：

- HTTP 200。
- Next.js Production page 正常回應。
- 2026-09-10 `daily-news` 與 `framework-recommendation` 仍可從首頁讀取。
- 本次 credential validation 沒有破壞公開 read path。

## Recurring Production delivery activation — 2026-09-10

Final credential gate 通過後，兩個正式 Scheduled Tasks 已加入 Phase 4 verified delivery suffix。

### `開發技術每日追蹤`

- Task ID：`6a62e583aac081918e23602484618f54`。
- enabled：維持 `true`。
- schedule：維持原 daily recurring schedule，不改成臨時驗收排程。
- 原研究範圍、官方/primary source 優先、歷史去重、中文技術細節要求全部保留。
- Production mapping：`reportType = daily-news`。
- title：`開發技術每日追蹤｜<Asia/Taipei YYYY-MM-DD>`。
- clean Markdown 與 structured `sources[]` 維持 Phase 4 contract。
- `generatedAt` 使用實際送出時間，ISO 8601 + `+08:00`。
- no-result 時仍呼叫 Make，發布 deterministic no-result Markdown，`sources = []`。
- Make Scenario：`Daily Report - Publish to Vercel`。

### `每日突破性工具推薦`

- Task ID：`6a7333e544788191ab2a5626784905c5`。
- enabled：維持 `true`。
- schedule：維持原 daily recurring schedule，不改成臨時驗收排程。
- 原選題、歷史去重、分析結構與 representative-tool fallback 全部保留。
- Production mapping：`reportType = framework-recommendation`。
- title：`每日突破性工具推薦｜<最終推薦工具名稱>`。
- clean Markdown 與 structured `sources[]` 維持 Phase 4 contract。
- `generatedAt` 使用實際送出時間，ISO 8601 + `+08:00`。
- 無 compelling 新工具時保留原 fallback，不發布空白報告。
- Make Scenario：`Daily Report - Publish to Vercel`。

兩個 Task 都只修改 prompt 的 delivery suffix；schedule、timing mode、enabled 狀態均未修改。

## Pending first unattended recurring execution

2026-09-10 的兩個正式 recurring Task 在 Phase 5 activation 前已完成當日原排程，因此不以手動 run、shadow run 或臨時高頻 schedule 取代 launch acceptance。

下一輪原定 daily execution 後，每個 report type 需驗證：

1. Scheduled Task 由原 schedule 自動啟動。
2. Make high-level execution 成功。
3. Neon 對應 `(report_type, report_date)` exactly once。
4. `generatedAt`、title、Markdown、sources 與 Asia/Taipei business date 正確。
5. 首頁、archive、detail route 正確顯示。
6. persisted Markdown 不含 ChatGPT UI citation token。
7. 驗證過程不執行 Production UPDATE/DELETE。

## Acceptance status

- [x] Phase 5 preflight：Vercel baseline READY。
- [x] Phase 5 preflight：Make Scenario active/on-demand/contract unchanged。
- [x] Phase 5 preflight：Neon Production branch ready，schema/indexes 與 application 一致。
- [x] Final `INGEST_SECRET` rotation completed without exposing the secret in ChatGPT/Git/docs。
- [x] Vercel Production redeploy after credential rotation is READY。
- [x] Final credential verified through high-level Make success without reading Authorization input/header。
- [x] Exact retry remains idempotent in Neon with row count exactly 1。
- [x] Public Production homepage remains HTTP 200 after credential validation。
- [x] Recurring delivery suffix applied to both real Tasks while preserving their research rules and schedules。
- [ ] First unattended recurring executions publish exactly once for both report types。
- [ ] Public website renders the first new recurring reports correctly。
- [ ] Final `/AI-build` closure completed。
- [ ] PR #11 squash merged to `main` and post-merge Production verified READY。
