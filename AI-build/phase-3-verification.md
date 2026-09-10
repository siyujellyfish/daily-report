# Phase 3 — Verification record

## Environment and safety

- Branch: `phase3/testing-quality`.
- Pull request: #8.
- Test data target: Neon `phase3-testing` branch only (`br-rough-mode-b3vmw787`).
- Production policy: no Phase 3 test writes, deletes or fixture changes against Production.
- Safety guard: DB integration and local Playwright execution require `TEST_DATABASE_URL` and reject a configuration where it equals `DATABASE_URL`.
- GitHub Repository Secret `TEST_DATABASE_URL` was configured without recording its value in chat, Git or `/AI-build`.
- Build checks intentionally use an invalid localhost `DATABASE_URL`, preventing a production build from touching Neon.

## Findings and corrections

1. The first full secure CI run proved `TEST_DATABASE_URL` was active because DB integration executed instead of being skipped. Three of four DB checks passed; the detail check found that the two 2026-09-09 isolated fixtures stored literal `\n` sequences instead of real Markdown newlines.
2. After explicit user authorization, only those two `phase3-testing` fixture rows were corrected. Verification confirmed Production was untouched.
3. DB integration then passed 4/4.
4. The first Playwright execution produced 17 passed / 3 conditional skips / 4 failed. All failures came from fuzzy accessible-name matching between an archive title link and its separate `閱讀：標題` arrow link. Test selectors were changed to `exact: true`; no product behavior changed.
5. Accessibility review found two genuine accessible-name issues: homepage actions with identical visible text but different destinations, and duplicate report headings producing identical TOC accessible names. Visual text was preserved while adding destination/duplicate-position context for assistive technologies.
6. Next.js 16 smooth-scroll guidance required `data-scroll-behavior="smooth"` on `<html>` when global smooth scrolling is enabled. The layout was updated accordingly.
7. The previous CI setup emitted a runtime deprecation warning from `pnpm/action-setup@v4`. It was replaced with official `pnpm/setup@v2`, retaining pnpm 12.3.4 and Node 24; frozen install, typecheck, tests and build continued to pass.
8. The first explicit read-error test correctly rendered HTTP 500 and the application retryable error UI; the test initially matched both the application alert and Next.js route announcer. The selector was scoped to the application `section[role="alert"]` without changing product behavior.
9. Empty-state behavior was verified without deleting Neon fixtures by rendering homepage/archive components with isolated test inputs.
10. A React script-rendering message remains visible only during `next dev` Playwright runs. It does not reproduce in the production `next start` performance run and causes no failed interaction/rendering test, so it is recorded as a non-blocking development-mode warning rather than prompting speculative product changes.

## Final verified implementation checkpoint

- Commit: `00bd49ee022e03ad88a117267058466455fcad7a`.
- GitHub Actions Quality run: `34422203392` — success.
- Frozen pnpm install: passed.
- TypeScript: passed.
- Vitest unit suite: 17/17 passed in 5 files.
- Next.js 16.3.4 production build: passed.
- Isolated DB integration: 4/4 passed.
- Playwright main suite: 29 passed / 5 viewport-conditional skips / 0 failed.
- Playwright environments: Chromium desktop and Pixel 7 mobile project.
- Isolated DB read-error suite: 1/1 passed.
- Production client-JS budget suite: 1/1 passed.
- Matching Vercel Preview: `dpl_3yqr4rGMSkLtEXazdVso6JaAvEew` — READY.

## Accessibility/content-quality evidence

- Public routes have exactly one visible H1 and no skipped visible heading levels.
- Keyboard skip-link focus, mobile Escape close/focus restoration, theme control, TOC and copy feedback all pass browser tests.
- Distinct destinations no longer reuse ambiguous accessible link labels in the tested public routes.
- Core light/dark text token pairs meet the automated WCAG AA 4.5:1 normal-text contrast threshold.
- Pixel 7 report pages have no document-level horizontal overflow; tables and code retain local horizontal scrolling.
- Homepage and archive empty-state copy pass isolated rendering tests.
- Missing DB configuration returns HTTP 500 and renders the retryable application error state with retry/home actions.

## Performance/data-boundary evidence

- The public reading flow performs no browser-side `/api/*` read requests; report reads remain Server Component/server-side DB operations.
- Production cold-load JavaScript measured with `next start`:
  - `/`: 505,082 bytes across 8 chunks.
  - `/news`: 505,082 bytes across 8 chunks.
  - `/reports/2026-09-09-daily-news`: 506,241 bytes across 9 chunks.
- All measured routes are below the 1 MiB uncompressed client-JS CI guard.
- No observed latency/functionality issue justified DB query-plan tuning, Redis, or additional cache infrastructure.
- Phase 3 added no new public write endpoint and no test credential is present in code or documentation.

## Acceptance conclusion

All Phase 3 acceptance criteria are satisfied. The remaining commits after the implementation checkpoint only synchronize `/AI-build` and PR metadata; the final branch head must still pass its normal Quality workflow and Vercel Preview before PR #8 is squash-merged into `main`.
