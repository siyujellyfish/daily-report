import { describe, expect, it } from "vitest";

import { resolveDatabaseUrl } from "@/db/database-url";

describe("resolveDatabaseUrl", () => {
	const productionUrl =
		"postgresql://user:password@ep-silent-mud-b3y4xqfn.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

	it("routes the Phase 6 Vercel Preview branch to the isolated Neon compute", () => {
		expect(resolveDatabaseUrl(
			productionUrl,
			"preview",
			"phase6/adaptive-categories",
		)).toBe(
			"postgresql://user:password@ep-calm-glitter-b3no93rk.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
		);
	});

	it("does not alter Production", () => {
		expect(resolveDatabaseUrl(
			productionUrl,
			"production",
			"phase6/adaptive-categories",
		)).toBe(productionUrl);
	});

	it("does not alter unrelated Preview branches", () => {
		expect(resolveDatabaseUrl(
			productionUrl,
			"preview",
			"another-feature",
		)).toBe(productionUrl);
	});
});
