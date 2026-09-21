import { describe, expect, it } from "vitest";

import {
	getReportSlug,
	getTaipeiReportDate,
	isReportDate,
	parseReportPage,
	parseReportSlug,
} from "../../src/lib/report-date";

describe("report date helpers", () => {
	it("uses Asia/Taipei midnight as the business-date boundary", () => {
		expect(getTaipeiReportDate("2026-09-08T15:59:59Z")).toBe("2026-09-08");
		expect(getTaipeiReportDate("2026-09-08T16:00:00Z")).toBe("2026-09-09");
	});

	it("accepts leap day and rejects invalid calendar dates", () => {
		expect(isReportDate("2028-02-29")).toBe(true);
		expect(isReportDate("2027-02-29")).toBe(false);
		expect(isReportDate("2026-04-31")).toBe(false);
	});

	it("round-trips legacy and dynamic category report slugs", () => {
		const legacy = getReportSlug("2026-09-09", "framework-recommendation");
		expect(parseReportSlug(legacy)).toEqual({
			date: "2026-09-09",
			type: "framework-recommendation",
		});

		const dynamic = getReportSlug("2026-09-18", "security-news");
		expect(dynamic).toBe("2026-09-18-security-news");
		expect(parseReportSlug(dynamic)).toEqual({
			date: "2026-09-18",
			type: "security-news",
		});
	});

	it("rejects malformed dates and unsafe category slugs", () => {
		expect(parseReportSlug("2026-02-30-daily-news")).toBeNull();
		expect(parseReportSlug("2026-09-09-Security-News")).toBeNull();
		expect(parseReportSlug("2026-09-09-security_news")).toBeNull();
		expect(parseReportSlug("not-a-slug")).toBeNull();
	});

	it("keeps archive pagination bounded to positive integer input", () => {
		expect(parseReportPage(undefined)).toBe(1);
		expect(parseReportPage("1")).toBe(1);
		expect(parseReportPage("42")).toBe(42);
		expect(parseReportPage("0")).toBeNull();
		expect(parseReportPage("01")).toBeNull();
		expect(parseReportPage("1.5")).toBeNull();
		expect(parseReportPage(["1", "2"])).toBeNull();
	});
});
