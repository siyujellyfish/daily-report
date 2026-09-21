# Phase 7 — App Store 限時免費週報

## 狀態

Phase 7 的排程與 Production 傳輸設定已完成，第一輪 unattended Production 驗收等待 2026-09-27（日）原定週排程執行。

本階段不修改 Next.js、資料庫 schema 或套件。Phase 6 已提供 schema v2 動態分類，因此新週報可直接透過既有 `POST /api/v1/ingest` 建立正式分類與報告。

## 排程

- Scheduled Task：`App Store 限免週報`
- 時區：Asia/Taipei
- 頻率：每週日
- 使用者未指定精確時刻，因此使用 flexible schedule，基準時間為 08:00。
- 第一輪預定執行日：2026-09-27。
- 不建立 mid-week synthetic Production 報告作為測試；第一次正式內容由原排程自行產生。

## 分類與 Make contract

正式分類：

```text
reportType: app-store-limited-free
categoryLabel: App限免
categoryDescription: 每週整理台灣 App Store 可直接下載的限時免費 App，並追蹤已推送且仍生效的限免項目。
```

`Daily Report - Publish to Vercel` 已由固定 schema v1 JSON 組裝升級為 schema v2，輸入介面為：

```text
reportType
categoryLabel
categoryDescription
title
contentMarkdown
generatedAt
sources[]
  ├─ title
  └─ url
```

Make HTTP 模組及 Authorization 設定未讀取、未修改。既有兩個正式每日 Scheduled Tasks 已同步帶入其 canonical category metadata，因此在 Make 介面增加必填欄位後仍能正常呼叫同一 Scenario。

API 仍保留 schema v1 compatibility；目前 live Scheduled Tasks 經 Make 發送時改用 schema v2。

## 限免資格

每個納入項目都必須同時符合：

1. 台灣 App Store 官方產品頁可存取。
2. 本次檢查時可在台灣地區直接免費取得。
3. 有可信價格歷史或促銷證據證明原本為付費 App。
4. 本次免費屬有限期間促銷，而非永久免費。
5. 遊戲與一般應用程式皆可。

排除：

- 永久免費。
- Freemium。
- 免費試用。
- 訂閱限免。
- 僅內購折扣。
- 無法證明「付費 → 暫時免費」者。
- 台灣 App Store 無法直接取得者。

每個候選至少需要台灣 App Store 官方產品頁與一項可證明限免／價格歷史的可信來源；證據衝突或不足時不推送。

## 歷史去重與期限追蹤

每次執行前讀取：

```text
/category/app-store-limited-free
```

以及其歷史報告，建立已推送 App 集合。

- 第一部分只允許從未推送過的新項目。
- 已推送項目不重複當作新推薦。
- 每次重新檢查歷史項目的台灣 App Store 狀態。
- 已恢復付費或下架者不列入「仍在限免」表格。
- 先前結束時間未知者，每次執行都必須重新查證。
- 若仍無法確認結束時間，固定標註 `未知（下次推播重新確認）`。
- 不得自行把只有日期的資料補成 00:00；只有日期時標註 `YYYY-MM-DD（時間未知）`。

## Markdown 輸出格式

### 第一部分

固定標題：

```markdown
## 本週新發現的限時免費 App
```

只列本週新發現且未曾推送的項目。每項必須包含：

- App 名稱。
- 類型。
- 主要功能。
- 推薦原因。
- 限免開始時間。
- 限免結束時間。
- 台灣 App Store 直接連結。

若無新項目，明確輸出：

```text
本週無新的合格限時免費 App
```

### 第二部分

固定標題：

```markdown
## 已推送且目前仍在限免
```

固定 Markdown 表格欄位：

```text
App｜類型｜限免開始｜限免結束｜App Store
```

只包含歷史已推送且本次重新驗證仍免費的項目。

### 第三部分

固定標題：

```markdown
## 本週狀態總表
```

固定 Markdown 表格欄位：

```text
App｜狀態｜限免開始｜限免結束｜App Store
```

彙整本週新推送與過往已推送且仍生效的所有有效項目。

即使本週沒有新項目，也必須發布本週檢查結果，以維持期限未知項目的追蹤鏈。

## Sources

網站 `sources[]` 保留本次實際使用的公開來源，URL 去重。每個納入 App 至少保留：

- 台灣 App Store 官方產品頁。
- 限免／價格歷史證據來源。

正文使用乾淨 Markdown，不包含 ChatGPT UI citation token。

## 第一輪 Production 驗收

2026-09-27 原排程完成後確認：

- [ ] Scheduled Task 自動執行，無人工 approval。
- [ ] Make 僅以 high-level outcome 驗證成功，不讀取 HTTP Authorization/header input。
- [ ] Neon Production 建立 `app-store-limited-free` category 與當日 report exactly once。
- [ ] 首頁出現新分類最新報告。
- [ ] `/category/app-store-limited-free` 正常顯示。
- [ ] 對應 `/reports/YYYY-MM-DD-app-store-limited-free` 正常顯示。
- [ ] 第一部分僅包含歷史未推送項目。
- [ ] 第二部分只包含已推送且仍免費項目。
- [ ] 第三部分完整彙整當前有效項目。
- [ ] 每個新推送項目與兩個表格均有開始／結束資訊與台灣 App Store link。
- [ ] 未知期限使用明確標記且保留下一輪重查要求。
- [ ] 所有納入項目符合 paid → temporary free 定義，永久免費／Freemium 等均未混入。
