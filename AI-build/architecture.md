# Architecture

## Data flow

```text
ChatGPT Scheduled Tasks
	↓
Make App
	↓
Make Scenario
	↓ HTTPS POST
Next.js Route Handler
	↓
Zod validation / authentication / idempotency
	↓
Drizzle ORM
	↓
Neon PostgreSQL
	↓
Next.js Server Components
	↓
Public Vercel website
```

## Runtime

- Web framework: Next.js App Router
- Runtime: Node.js 24 LTS
- Hosting: Vercel
- Database: Neon PostgreSQL
- ORM: Drizzle ORM
- Validation: Zod
- Automation bridge: Make

## Security boundary

- Public read pages do not require authentication.
- Write ingestion will use a bearer secret stored only in Make and Vercel environment variables.
- Database credentials are managed through Vercel/Neon and are never committed to Git.
