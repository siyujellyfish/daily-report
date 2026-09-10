import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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

describe("isolated report read integration", () => {
	it("returns the newest report for both report types", async () => {
		const reports = await reportsModule.getLatestReports();
		expect(reports).toHaveLength(2);
		expect(reports.map((report) => [report.reportType, report.reportDate])).toEqual([
			["daily-news", "2026-09-09"],
			["framework-recommendation", "2026-09-09"],
		]);
	});

	it("paginates daily-news deterministically", async () => {
		const first = await reportsModule.getReportsByType("daily-news", 1);
		const second = await reportsModule.getReportsByType("daily-news", 2);

		expect(first.total).toBe(13);
		expect(first.pageCount).toBe(2);
		expect(first.reports).toHaveLength(10);
		expect(first.reports[0]?.reportDate).toBe("2026-09-09");
		expect(second.reports).toHaveLength(3);
		expect(second.reports.at(-1)?.reportDate).toBe("2026-08-28");
	});

	it("reads a detail report and maps headings and sources", async () => {
		const report = await reportsModule.getReportBySlug("2026-09-09-daily-news");
		expect(report?.title).toBe("Phase 3 Daily News 09");
		expect(report?.headings).toEqual([
			{ id: "report-section-1", text: "Alpha", depth: 2 },
			{ id: "report-section-2", text: "Beta", depth: 2 },
			{ id: "report-section-3", text: "Alpha", depth: 2 },
		]);
		expect(report?.sources).toEqual([
			{ title: "Example Docs", url: "https://example.com/docs", hostname: "example.com" },
		]);
	});

	it("returns null for a missing valid report", async () => {
		expect(await reportsModule.getReportBySlug("2026-01-01-daily-news")).toBeNull();
	});
});
