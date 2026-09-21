# Phase 6.5 — Canonical isolated automated verification

## Status

Phase 6.5 is complete on `phase6/adaptive-categories`.

Final implementation checkpoint:

```text
commit: a8cab16c1903f19d305a7c34063be84183956d37
Quality run: 35553230724
result: SUCCESS
```

Phase 6 application runtime is still not deployed to Production. Synthetic acceptance data remains isolated.

## TEST_DATABASE_URL verification

The user updated GitHub Repository Secret `TEST_DATABASE_URL`.

The secret value was not read, printed or copied into source/docs.

To verify the target safely, the previous Phase 6.4 Quality job was rerun after the secret update. The old Phase 3 integration assertions immediately observed the canonical Phase 6 data instead:

```text
published categories included security-news
daily-news total = 9
```

Those values matched Neon `phase6-adaptive-isolated` and intentionally differed from the legacy `phase3-testing` fixture expectations.

The integration suite was then rewritten to assert the canonical ordered published-category set directly. The final Quality run passed this identity check.

Canonical branch:

```text
Neon project: shiny-fire-00063440
branch: phase6-adaptive-isolated
branch id: br-lingering-boat-b3czfbqx
database: neondb
```

## Persistent isolated acceptance fixtures

Phase 6.5 keeps the following synthetic acceptance rows only on the canonical isolated branch:

```text
published + visible
1. daily-news
2. framework-recommendation
3. security-news
4. long-category-navigation-fixture

visible + empty
5. phase6-empty-category

hidden + published
6. phase6-hidden-category
```

The long-label category intentionally uses a very long Traditional Chinese display label and a report containing:

- three H2 headings;
- a GFM table;
- a code block;
- a structured source.

This single fixture exercises navigation overflow, report detail wrapping, TOC anchors, table/code local scrolling, code-copy interactions and source rendering.

## Isolated DB integration

Final integration result:

```text
9 / 9 passed
```

Coverage includes:

1. `TEST_DATABASE_URL` resolves to the expected canonical ordered published-category set.
2. Visible-empty categories are excluded.
3. Hidden-published categories are excluded.
4. Latest report per published category is returned in category order.
5. Dynamic category archive pagination remains deterministic.
6. Dynamic report detail returns headings, source data and persisted category metadata.
7. Missing valid report returns null.
8. Schema v1 preserves create / exact retry / same-slot conflict behavior:
   - new → 201
   - exact retry → 200 + `duplicate:true`
   - different same type/date → 409
9. Schema v2 preserves category/report semantics:
   - first valid category/report → 201
   - exact retry → 200
   - submitted metadata mismatch does not overwrite canonical DB metadata
   - different same category/date → 409
   - unauthorized request → 401
   - payload-controlled presentation field → 400

### Concurrent CI isolation

Early Phase 6.5 runs exposed a race because multiple GitHub Actions jobs shared a fixed temporary ingest fixture.

The final integration design derives temporary v1 dates and v2 category slugs from `GITHUB_RUN_ID`:

```text
phase6-ingest-<run-token>
run-scoped legacy v1 report date
```

Every run removes only its own temporary rows in `afterAll`.

Run-scoped fixture identity prevents direct row deletion/collision, but Phase 6.5 documentation commits also exposed a subtler shared-state race: a schema-v2 test category is correctly visible between its 201 creation and cleanup, so a concurrent workflow can temporarily observe a fifth published category.

The Quality workflow therefore adds:

```yaml
concurrency:
  group: daily-report-canonical-test-db
  queue: max
```

GitHub queues the complete Quality runs that share this canonical database rather than running their integration/browser acceptance windows simultaneously. This keeps real v2 visibility semantics intact; tests do not hide or special-case `phase6-ingest-*` categories in application code.

## Playwright acceptance

Final main Playwright result:

```text
44 total
40 passed
4 viewport-conditional skips
0 failed
```

Desktop and Pixel 7 coverage includes:

- Header shows all four published categories from DB.
- Empty/hidden categories do not appear in public navigation.
- Homepage renders four latest category cards.
- Desktop layout supports 3+ columns where space permits.
- Mobile layout remains one card column.
- Mobile category rail is always visible and horizontally scrollable.
- No hamburger menu is required.
- Active category state works on archives and report details.
- Long category label remains usable.
- Document-level horizontal overflow is rejected.
- Tables/code retain local overflow containers.
- Code copy success and fallback behavior work on mobile.
- Keyboard skip-link focus remains usable.
- TOC navigation works on mobile.
- Sticky Header offset keeps report headings and sources visible after anchor navigation.
- Public browser reading flow issues no browser-side `/api/*` read requests.
- Light/dark built-in category tone pairs retain WCAG AA normal-text contrast checks.
- Public routes retain one H1 and valid visible heading hierarchy.

## Redirect verification

Playwright performs direct non-following HTTP requests and verifies:

```text
/news
→ 308 /category/daily-news

/frameworks
→ 308 /category/framework-recommendation

/news?page=2
→ 308 /category/daily-news?page=2

/frameworks?page=2
→ 308 /category/framework-recommendation?page=2
```

Invalid pagination such as `/news?page=0` remains 404.

## Metadata and sitemap

Automated verification confirms `/category/security-news` uses persisted category metadata:

- page title includes the category label;
- meta description equals the stored category description;
- canonical path is `/category/security-news`;
- Open Graph URL uses the same canonical category path.

Production-mode sitemap includes:

- `/`;
- all published category routes;
- visible-category report routes.

It excludes:

- visible-empty category;
- hidden category;
- hidden-category report;
- legacy `/news` and `/frameworks` as canonical entries.

Preview noindex behavior remains intact.

## Responsive defects discovered and fixed

Phase 6.5 did not weaken tests when long-label acceptance found real layout issues.

### Category rail intrinsic width

The max-content inner category rail could participate in mobile intrinsic sizing.

Fix:

- constrain the rail to its grid width;
- use inline-size containment;
- retain horizontal scrolling inside the rail.

### Report-detail document overflow

Diagnostic Playwright output identified the actual document-widening element:

```text
long return-category button
width ≈ 740 px
```

The shadcn button primitive contributes `shrink-0` and `whitespace-nowrap`. With a long category label, the report footer became wider than the Pixel 7 viewport.

Fixes:

- make report detail containers explicitly shrinkable;
- wrap breadcrumb/category text;
- constrain code/table wrappers;
- allow the report return action to wrap;
- override the long return-category button to `white-space: normal` and bounded width.

No global `body { overflow-x:hidden }` workaround was introduced.

## Error-state verification

The isolated invalid-database Playwright suite passed:

```text
1 / 1 passed
```

Header category-query failure degrades to the static navigation shell while the page read failure still renders the intended retryable error state.

## Client JavaScript budget

Production `next start` budget:

```text
/                                                504,993 bytes
/category/security-news                          504,993 bytes
/category/long-category-navigation-fixture       504,993 bytes
/reports/2026-09-19-long-category-navigation-fixture
                                                  511,609 bytes

guard: 1 MiB per cold public route
result: 1 / 1 passed
```

Dynamic categories therefore did not materially increase client JavaScript.

## Final database cleanup and Production isolation

Read-only post-test verification of canonical isolated branch:

```text
categories: 6
reports: 22
published categories: 4
temporary phase6-ingest-* categories: 0
temporary v1 reports before 2026-09-01: 0
```

Read-only Production verification:

```text
categories: 2
reports: 25
Phase 6 fixture categories: 0
```

No Phase 6 synthetic category/report was written to Production.

## Final Quality gate

Quality run `35553230724` passed all stages:

```text
frozen pnpm install: passed
TypeScript: passed
unit: 25 / 25
production build: passed
canonical isolated DB integration: 9 / 9
Playwright: 40 passed / 4 skipped
read-error: 1 / 1
production client JavaScript budget: 1 / 1
```

The existing React development-mode script-rendering warning remains non-blocking and does not reproduce as a failing production budget condition.

## Manual verification

No additional manual acceptance is required for Phase 6.5.

All requested 6.5 acceptance surfaces are covered automatically, including Pixel 7 responsive behavior and physical anchor positioning.

## Next stage

Proceed to Phase 6.6 safe rollout / Production acceptance.

Phase 6.6 must still preserve:

- schema-first / backward-compatible Production rollout;
- live schema-v1 recurring Task compatibility;
- no synthetic third-category Production report solely for acceptance;
- final PR merge to `main` by squash commit only.
