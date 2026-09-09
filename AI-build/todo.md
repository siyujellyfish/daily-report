# TODO

## Phase 0 — Initialization

- [x] Bootstrap GitHub repository.
- [x] Create initialization branch.
- [x] Add Next.js / React / TypeScript base.
- [x] Add Tailwind CSS base.
- [x] Add Neon + Drizzle connection layer.
- [x] Add environment variable template.
- [x] Initialize AI-build documentation.
- [x] Create Vercel project linked to `siyujellyfish/daily-report`.
- [x] Provision Neon through Vercel Native Integration.
- [x] Confirm `DATABASE_URL` at runtime with a successful ingestion test.
- [x] Complete first successful Vercel preview build.
- [x] Complete first successful Vercel production build.

## Phase 1 — Ingestion

- [x] Define report database schema.
- [x] Define Zod payload contract.
- [x] Implement `/api/v1/ingest`.
- [x] Add bearer-secret authentication.
- [x] Add payload hash / idempotency behavior.
- [x] Apply the initial `reports` schema migration to Neon production branch.
- [x] Connect Make HTTP module to the production ingestion endpoint.
- [x] Normalize Make's empty `sources` value (`null`) to an empty array.
- [x] Configure `INGEST_SECRET` in Vercel Production.
- [x] Disable Vercel `Require Log in` so the public production endpoint is reachable from Make.
- [x] Complete end-to-end Make → Vercel → Neon test.
- [x] Verify exact retries return `duplicate: true` without creating a second row.

## Pre-live hardening

- [x] Rotate the original setup/test `INGEST_SECRET` in Vercel and Make.
- [x] Redeploy Vercel Production so the rotated environment variable is loaded by the runtime.
- [x] Verify the rotated credential with an authenticated duplicate ingestion (`HTTP 200`, `duplicate: true`).
- [x] Confirm Neon still contains exactly one row for the duplicate test payload.
- [ ] Rotate `INGEST_SECRET` once more because the diagnostic execution detail exposed the Authorization header value during verification.
- [ ] Update both Vercel Production and the Make HTTP Authorization header with that final secret.
- [ ] Redeploy Vercel Production after the final rotation.
- [ ] Re-run only the high-level Make Scenario test after the final rotation; do not inspect module input/header data.

## Phase 2 — Public website

- [ ] Build report list and detail views.
- [ ] Render Markdown safely.
- [ ] Add daily-news and framework-recommendation navigation.
- [ ] Add metadata / SEO.
