import "server-only";

import { connection } from "next/server";

/**
 * Vercel builds have DATABASE_URL and can prerender public data. Local/CI builds
 * intentionally run without a database, so defer those reads until request time.
 */
export async function deferDatabasePrerenderIfUnavailable() {
	if (!process.env.DATABASE_URL || process.env.SKIP_DATABASE_PRERENDER === "1") {
		await connection();
	}
}
