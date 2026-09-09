# Phase 3 — Verification record

## 2026-09-09 — secure CI verification

- Branch: `phase3/testing-quality`
- Pull request: #8 (Draft, unmerged)
- Test data target: Neon `phase3-testing` branch only (`br-rough-mode-b3vmw787`).
- Production policy: no test writes, deletes or fixture changes against Production.
- Safety guard: DB integration and local Playwright execution require `TEST_DATABASE_URL` and reject a configuration where it equals `DATABASE_URL`.
- GitHub Repository Secret `TEST_DATABASE_URL` was configured without recording its value in chat, Git or `/AI-build`.

### Findings and corrections

1. The first full CI run proved the secure test secret was active because DB integration executed instead of being skipped. Three of four DB checks passed; the detail check found that the two 2026-09-09 isolated fixtures stored literal `\n` sequences instead of real Markdown newlines.
2. After explicit user authorization, only those two `phase3-testing` fixture rows were corrected. Verification confirmed no literal `\n` remained and Production was untouched.
3. DB integration then passed 4/4.
4. The first Playwright execution produced 17 passed / 3 conditional skips / 4 failed. The four failures were identical selector ambiguity between an archive title link and its separate `閱讀：標題` arrow link.
5. Test selectors were tightened with `exact: true`; no product behavior was changed.

### Verified code checkpoint

- Commit: `5143e5e2458a2450b663bd2fd8a0d3d123b4e171`
- GitHub Actions Quality run: `34327164875` — success.
- Frozen pnpm install: passed.
- TypeScript: passed.
- Vitest unit suite: 15/15 passed in 4 files.
- Next.js production build: passed.
- Isolated DB integration: 4/4 passed.
- Playwright critical paths: 21 passed / 3 viewport-conditional skips / 0 failed.
- Playwright environments: Chromium desktop and Pixel 7 mobile project.
- Matching Vercel Preview: `dpl_4JzY27ewXd9yirsnaDFnsrh8mosu` — READY.

### Remaining Phase 3 work

Core automated DB/browser acceptance is complete, but Phase 3 is not yet closed. Remaining items are tracked in `todo.md`: semantic heading/link-label/contrast review, explicit isolated empty/read-error state validation, Server Component/client-JS performance review, and final acceptance documentation. CI also surfaced non-blocking warnings related to Next.js smooth-scroll metadata, React script rendering during browser tests, and the runtime target used by `pnpm/action-setup@v4`; these require separate evidence-based review before any change.
