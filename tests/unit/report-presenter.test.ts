import { describe, expect, it } from "vitest";

import {
	presentReport,
	presentReportSummary,
} from "../../src/lib/report-presenter";

describe("presentReport", () => {
	it("maps storage records into public presentation data", () => {
		const result = presentReport({
			reportType: "framework-recommendation",
			reportDate: "2026-09-09",
			title: "Tool report",
			contentMarkdown: "Intro paragraph.\n\n## Architecture",
			sources: [
				{ title: "Docs", url: "https://example.com/docs" },
				{ title: "Unsafe", url: "javascript:alert(1)" },
			],
			generatedAt: new Date("2026-09-09T00:00:00.000Z"),
		});

		expect(result.slug).toBe("2026-09-09-framework-recommendation");
		expect(result.generatedAt).toBe("2026-09-09T00:00:00.000Z");
		expect(result.summary).toBe("Intro paragraph.");
		expect(result.sources).toEqual([
			{ title: "Docs", url: "https://example.com/docs", hostname: "example.com" },
		]);
	});

	it("uses persisted presentation fields without re-deriving list content", () => {
		const summary = presentReportSummary({
			reportType: "daily-news",
			reportDate: "2026-09-22",
			title: "Persisted report",
			summary: "Stored summary.",
			readingMinutes: 4,
			headings: [{ id: "report-section-1", text: "Stored heading", depth: 2 }],
		});
		expect(summary).toMatchObject({
			slug: "2026-09-22-daily-news",
			summary: "Stored summary.",
			readingMinutes: 4,
		});

		const detail = presentReport({
			...summary,
			contentMarkdown: "Markdown that would derive a different summary.",
			sources: [],
			generatedAt: new Date("2026-09-22T00:00:00.000Z"),
		});
		expect(detail.summary).toBe("Stored summary.");
		expect(detail.headings).toEqual(summary.headings);
	});
});
