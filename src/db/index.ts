import { drizzle } from "drizzle-orm/neon-http";

import { resolveDatabaseUrl } from "./database-url";
import * as schema from "./schema";

function createDatabase() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not configured.");
	}

	return drizzle(resolveDatabaseUrl(databaseUrl), { schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

export function getDb() {
	database ??= createDatabase();
	return database;
}
