# TODO

## Phase 0 — Initialization

- [x] Bootstrap GitHub repository.
- [x] Create initialization branch.
- [x] Add Next.js / React / TypeScript base.
- [x] Add Tailwind CSS base.
- [x] Add Neon + Drizzle connection layer.
- [x] Add environment variable template.
- [x] Initialize AI-build documentation.
- [ ] Create Vercel project linked to `siyujellyfish/daily-report`.
- [ ] Provision Neon through Vercel Native Integration.
- [ ] Confirm `DATABASE_URL` is available in Vercel environments.
- [ ] Run first Vercel preview build.

## Phase 1 — Ingestion

- [ ] Define report database schema.
- [ ] Define Zod payload contract.
- [ ] Implement `/api/v1/ingest`.
- [ ] Add bearer-secret authentication.
- [ ] Add payload hash / idempotency behavior.
- [ ] Connect Make HTTP module.

## Phase 2 — Public website

- [ ] Build report list and detail views.
- [ ] Render Markdown safely.
- [ ] Add daily-news and framework-recommendation navigation.
- [ ] Add metadata / SEO.
