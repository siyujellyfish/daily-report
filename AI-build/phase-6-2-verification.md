# Phase 6.2 — Ingestion schema v2 verification

## Current status

Phase 6.2 is complete on the `phase6/adaptive-categories` branch.

The ingest endpoint now accepts a schema-version discriminated contract:

```text
schemaVersion = 1
→ existing fixed legacy types only
→ existing normalization/hash behavior preserved

schemaVersion = 2
→ safe dynamic category slug
→ category label + description
→ atomic category create/reuse + report insert
```

Production application deployment has not been changed by this implementation stage. Phase 6 synthetic write verification used only the isolated Neon branch `phase6-adaptive-isolated`.

## Implementation checkpoints

- `06dd1fa40931a23f1927deabdfb694b55d8077cc` — add schema-version discriminated Zod contract.
- `cb7b80b038ef756365419a23f7ea4e2c90a54358` — add v2 category persistence path.
- `0d9130c830b2c81af748c03644b0c7ee7988b12b` — add v1/v2 contract unit coverage.
- `9fdab91ca04210247fc71cd04e52ab9003f7281a` — lock the legacy normalized v1 SHA-256 regression fixture.
- `76240031d5b895002f80c7ba4907ec1ca6813006` — make v2 category + report persistence atomic through Neon HTTP batch.

Final implementation Quality workflow:

```text
run: 35322994905
head: 76240031d5b895002f80c7ba4907ec1ca6813006
result: success
```

The earlier schema-only checkpoint briefly failed while the route still expected only the old contract. The immediately following route implementation resolved that intermediate state; all final 6.2 implementation/test checkpoints pass Quality.

## Official implementation references — 2026-09-18

Rechecked current official documentation before using the relevant APIs:

- Zod 4 `z.discriminatedUnion()` for version-keyed object contracts.
- Drizzle Neon HTTP Batch API.
- Neon Serverless HTTP `transaction()` for multiple queries in one non-interactive transaction.
- Drizzle Neon HTTP session implementation confirms `db.batch()` delegates to the Neon client's transaction primitive.

No dependency was added or upgraded for Phase 6.2. The project continues to use its existing compatible versions:

```text
zod: 4.5.4
drizzle-orm: 0.45.2
@neondatabase/serverless: 1.1.0
```

## Schema v1 compatibility

The v1 object schema intentionally preserves the original field order and normalization:

```text
schemaVersion
reportType
title
generatedAt
contentMarkdown
sources
```

The existing rules remain:

- `schemaVersion = 1` only.
- report type must be `daily-news` or `framework-recommendation`.
- title is trimmed and bounded.
- `generatedAt` requires an offset-aware ISO datetime.
- Markdown remains non-trimmed and bounded as before.
- source title trimming / HTTP(S)-only URL validation remains.
- omitted or null sources still normalize to `[]`.
- unknown top-level payload fields remain rejected.

Regression fixture:

```json
{
	"schemaVersion": 1,
	"reportType": "daily-news",
	"title": "Daily report",
	"generatedAt": "2026-09-09T08:00:00+08:00",
	"contentMarkdown": "# Report",
	"sources": []
}
```

Expected pre-/post-Phase-6 normalized SHA-256:

```text
d4b77fe6f70c4d87187485a906c7df70931e389c4f38a252245510c35eb0be5f
```

The unit regression test passes, protecting exact-retry compatibility across the Phase 6 deployment boundary.

## Schema v2 contract

v2 accepts:

```json
{
	"schemaVersion": 2,
	"reportType": "security-news",
	"categoryLabel": "資安情報",
	"categoryDescription": "每日資安事件、漏洞與威脅情報整理。",
	"title": "Security report",
	"generatedAt": "2026-09-18T08:00:00+08:00",
	"contentMarkdown": "# Security",
	"sources": []
}
```

Category slug validation:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
maximum length: 80
```

Category metadata bounds follow the Phase 6.1 database schema:

```text
categoryLabel: 1..120 chars after trim
categoryDescription: 1..500 chars after trim
```

Payload-controlled `sortOrder`, `isVisible`, arbitrary style/color/icon fields and other unknown top-level fields are rejected.

## Canonical category metadata

For v2, normal report ingest never updates an existing category.

The endpoint performs:

```text
INSERT category ... ON CONFLICT DO NOTHING
→ read stored category metadata
→ insert report
```

If the submitted category label/description differs from the stored category, the stored row remains canonical. A successful/duplicate v2 response can expose:

```json
{
	"category": {
		"slug": "security-news",
		"created": false,
		"metadataMismatch": true
	}
}
```

No automatic rename/update occurs.

## Atomic Neon HTTP persistence

The v2 category insert, canonical metadata read and report insert are executed through one Drizzle Neon HTTP `db.batch()`.

The current Drizzle Neon HTTP session implementation delegates batch execution to the Neon client transaction primitive, and Neon documents that primitive as a single non-interactive transaction over HTTP.

Therefore v2 does not require the WebSocket driver and does not leave a newly inserted category committed if a later statement in the batch raises an error.

The existing report insert still uses `ON CONFLICT DO NOTHING`, followed by the unchanged conflict-resolution checks:

- exact normalized payload hash found → HTTP 200, `duplicate: true`;
- same category/date occupied by a different payload → HTTP 409;
- other uniqueness conflict → HTTP 409.

## Isolated Neon verification

Canonical Phase 6 test database:

```text
name: phase6-adaptive-isolated
branch id: br-lingering-boat-b3czfbqx
parent: Production main
```

Before the v2 fixture:

```text
categories: 2
reports: 19
security-news categories: 0
security-news reports: 0
```

A branch-only v2 fixture was created:

```text
category slug: security-news
label: 資安情報
description: 每日資安事件、漏洞與威脅情報整理。
sort_order: NULL
is_visible: true

report:
schema_version: 2
report_type: security-news
report_date: 2026-09-18
title: Phase 6 v2 Security Fixture
```

A second category create attempt supplied deliberately incorrect metadata with `ON CONFLICT DO NOTHING`. Verification showed the original canonical label/description remained unchanged.

A second different report for the same `security-news / 2026-09-18` slot returned no inserted row under the database uniqueness constraint, leaving exactly one v2 report in that slot.

Production isolation was independently checked after the fixture:

```text
Production main:
security-news categories: 0
security-news reports: 0
```

No Phase 6.2 synthetic category/report was written to Production.

## Phase 6.2 conclusion

Phase 6.2 acceptance is complete:

- v1 remains accepted exactly as before;
- legacy normalized v1 hash behavior is locked by regression test;
- v2 safe dynamic category slug and bounded metadata are implemented;
- presentation controls remain server/database-owned;
- stored category metadata is canonical and not silently overwritten;
- category create/reuse + report insert uses an atomic Neon HTTP batch;
- existing duplicate/conflict semantics remain;
- isolated third-category persistence works;
- Production remains free of synthetic Phase 6 content.

The next implementation stage is Phase 6.3: data-driven public query layer and canonical dynamic category routes.
