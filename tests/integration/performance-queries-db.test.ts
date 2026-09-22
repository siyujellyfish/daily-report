import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
	cacheLife: vi.fn(),
	cacheTag: vi.fn(),
	revalidateTag: vi.fn(),
}));

type ReportsModule = typeof import("../../src/lib/reports");

let reportsModule: ReportsModule;

beforeAll(async () => {
	const testDatabaseUrl = process.env.TEST_DATABASE_URL;
	if (!testDatabaseUrl) {
		throw new Error("TEST_DATABASE_URL is required for isolated DB integration tests.");
	}
	if (process.env.DATABASE_URL && process.env.DATABASE_URL === testDatabaseUrl) {
		throw new Error("Refusing to run integration tests when TEST_DATABASE_URL matches DATABASE_URL.");
	}

	process.env.DATABASE_URL = testDatabaseUrl;
	reportsModule = await import("../../src/lib/reports");
});

describe("performance-oriented public report queries", () => {
	it("returns slim latest/archive models and a complete detail model", { timeout: 90_000 }, async () => {
		const latest = await reportsModule.getLatestPublishedReports();
		expect(latest.length).toBeGreaterThan(0);

		const first = latest[0];
		expect(first.report).not.toHaveProperty("contentMarkdown");
		expect(first.report).not.toHaveProperty("sources");
		expect(first.report.summary).toEqual(expect.any(String));
		expect(first.report.readingMinutes).toBeGreaterThanOrEqual(1);
		expect(first.report.headings).toEqual(expect.any(Array));

		const archive = await reportsModule.getReportsByCategory(first.category.slug, 1);
		expect(archive).not.toBeNull();
		expect(archive?.total).toBeGreaterThanOrEqual(archive?.reports.length ?? 0);
		expect(archive?.total).toEqual(expect.any(Number));
		expect(archive?.reports[0]).not.toHaveProperty("contentMarkdown");
		expect(archive?.reports[0]).not.toHaveProperty("sources");

		const detail = await reportsModule.getReportBySlug(first.report.slug);
		expect(detail).not.toBeNull();
		expect(detail?.contentMarkdown).toEqual(expect.any(String));
		expect(detail?.sources).toEqual(expect.any(Array));
		expect(detail?.summary).toBe(first.report.summary);
		expect(detail?.headings).toEqual(first.report.headings);
	});
});
