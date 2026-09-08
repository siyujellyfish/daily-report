# Technical Decisions

## 2026-09-08

### Application architecture

採用 Next.js 單體架構，公開頁面與 ingest API 均由同一個 Vercel Project 提供，不額外建立獨立 backend。

### Package baseline

- Next.js 16.3.4
- React 19.2.8
- Tailwind CSS 4.3.3
- pnpm 12.3.4
- Drizzle ORM 0.45.2
- Drizzle Kit 0.31.10
- Neon serverless driver 1.1.0
- Zod 4.5.4

### Database

使用 Neon PostgreSQL，透過 Vercel Native Integration provision。現有 Neon Organization 由 Vercel 管理，因此不得直接從 Neon API 建立新 project。

### AI delivery

不使用 OpenAI API。ChatGPT Scheduled Tasks 透過 Make App 呼叫 Make Scenario，再由 Make 將內容 POST 至 Vercel ingest endpoint。
