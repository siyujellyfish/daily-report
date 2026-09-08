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
- [ ] Confirm `DATABASE_URL` at runtime with a successful preview ingestion test.
- [ ] Complete first successful Vercel preview build.

## Phase 1 — Ingestion

- [x] Define report database schema.
- [x] Define Zod payload contract.
- [x] Implement `/api/v1/ingest`.
- [x] Add bearer-secret authentication.
- [x] Add payload hash / idempotency behavior.
- [ ] Apply the initial `reports` schema migration to Neon production branch.
- [ ] Configure `INGEST_SECRET` in Vercel.
- [ ] Connect Make HTTP module.
- [ ] Complete end-to-end Make → Vercel → Neon test.

## Phase 2 — Public website

- [ ] Build report list and detail views.
- [ ] Render Markdown safely.
- [ ] Add daily-news and framework-recommendation navigation.
- [ ] Add metadata / SEO.
