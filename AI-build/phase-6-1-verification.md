# Phase 6.1 — Category database migration verification

## Current status

Phase 6.1 application schema and reviewed migration SQL are implemented on branch `phase6/adaptive-categories` and have passed a temporary Neon branch migration verification. Neon Production remains unchanged at this checkpoint.

Implementation commits:

- `85e0a0751cea6e7e47f7bd6c12b1d70ef89d193f` — add `report_categories` Drizzle schema and convert the application-side `reports.report_type` mapping to `varchar(80)` + FK.
- `715f8b82c75e0e6b269999c84f8fa06c6bd55596` — add the manually reviewed Phase 6.1 migration SQL artifact.

Quality workflow `35167680994` completed successfully for the migration-SQL checkpoint.

## Migration baseline finding

`drizzle.config.ts` declares `out: "./drizzle"`, but the repository had no committed Drizzle migration snapshot/journal before Phase 6.1. Running a normal `drizzle-kit generate` from that state would not have a trustworthy historical snapshot from which to derive only the Phase 6 delta and could incorrectly model the current schema as an initial migration.

Phase 6.1 therefore does not fabricate a historical Drizzle snapshot or journal. The enum-to-varchar/data-seed transition is maintained as an explicitly reviewed custom SQL artifact:

```text
drizzle/phase6_1_adaptive_categories.sql
```

The SQL was reviewed against the live Production schema using Neon read-only schema introspection and then executed only through Neon's temporary migration branch workflow.

## Production baseline before migration

Neon project:

```text
project: shiny-fire-00063440
Production branch: br-empty-shape-b3x5225o (main)
database: neondb
```

Read-only schema introspection confirmed the Production `reports` table before migration still used a user-defined PostgreSQL `report_type` enum and contained the expected indexes:

- `reports_pkey`
- `reports_payload_hash_unique`
- `reports_date_idx`
- `reports_type_date_unique`
- `reports_type_date_idx`

No Phase 6.1 write was made to Production during verification.

## Temporary migration execution

Neon prepared migration:

```text
migration id: 81acb677-9cd6-45ca-b239-5d6a3b2f85c5
temporary branch: mcp-migration-2026-09-17T00-43-06
branch id: br-holy-glade-b3qaumew
parent branch: br-empty-shape-b3x5225o
```

The temporary branch migration successfully performed:

1. creation of `report_categories`;
2. seeding `daily-news` and `framework-recommendation`;
3. conversion of `reports.report_type` to `varchar(80)` using the existing enum value text;
4. creation of the category foreign key;
5. removal of the old PostgreSQL `report_type` enum.

The migration has **not** been promoted to Production. Promotion requires a separate explicit approval gate.

## Schema verification

Temporary branch inspection confirmed:

```text
report_categories rows: 2

daily-news
  label: 資訊新聞
  sort_order: 10

framework-recommendation
  label: 框架工具
  sort_order: 20

reports.report_type: character varying
orphan reports: 0
old report_type enum exists: false
category FK exists: true
```

`report_categories` also has the planned columns/defaults:

```text
slug varchar PK
label varchar NOT NULL
description varchar NOT NULL
sort_order integer NULL
is_visible boolean NOT NULL DEFAULT true
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```

The existing report indexes and uniqueness constraints remained present after the type conversion.

## Existing-data integrity verification

Before migration, Production contained 16 report rows:

```text
daily-news: 7
framework-recommendation: 9
```

A deterministic verification fingerprint was calculated over every existing report's:

- id;
- report type;
- report date;
- title;
- Markdown;
- sources JSON;
- generated timestamp;
- received timestamp;
- payload hash.

Results:

```text
Production before migration
row count: 16
fingerprint: fd7628fd105d324cae6fade643dbeb67

Temporary branch after migration, before test fixtures
row count: 16
fingerprint: fd7628fd105d324cae6fade643dbeb67
```

The matching row count and fingerprint confirm the enum-to-varchar migration did not alter the existing report contents, dates, structured sources, timestamps or payload hashes.

## Legacy v1 database compatibility probe

A synthetic report was inserted only into the temporary branch using the existing schema-v1 write shape and legacy `daily-news` report type. The insert succeeded with `schema_version = 1`, demonstrating that the migrated database accepts the values the pre-Phase-6 application currently emits.

A second temporary-only probe using an unknown category slug failed with the expected foreign-key violation. This confirms the database no longer accepts an arbitrary report type unless its category row exists.

These probes are temporary-branch data only and are not promoted with the migration itself.

## Safety boundary

- Production report content was not UPDATEd or DELETEd.
- No synthetic category/report was written to Production.
- The Production schema has not yet been changed.
- The temporary branch remains associated with the prepared migration until the explicit apply/discard decision.
- Phase 6.2 ingestion changes have not started; schema-v1 application behavior remains the compatibility target for the schema-first rollout.

## Remaining Phase 6.1 gate

Before Phase 6.1 can be considered fully deployed:

1. explicitly approve promotion of the already-tested migration to Neon Production;
2. apply the exact prepared migration without modifying its SQL;
3. re-run Production read-only schema and report-fingerprint verification;
4. verify the current pre-Phase-6 Production application remains healthy against the migrated schema;
5. update the Phase 6.1 TODO/status records with the Production result.

Only after those checks should implementation proceed to Phase 6.2.
