import { describe, expect, it } from "vitest";

import { hashReportPayload } from "../../src/lib/report-payload";
import { reportIngestSchema } from "../../src/schemas/report";

describe("report payload hashing", () => {
	it("preserves the pre-Phase-6 normalized schema-v1 hash", () => {
		const normalized = reportIngestSchema.parse({
			contentMarkdown: "# Report",
			generatedAt: "2026-09-09T08:00:00+08:00",
			reportType: "daily-news",
			schemaVersion: 1,
			sources: null,
			title: "Daily report",
		});

		expect(normalized).toEqual({
			schemaVersion: 1,
			reportType: "daily-news",
			title: "Daily report",
			generatedAt: "2026-09-09T08:00:00+08:00",
			contentMarkdown: "# Report",
			sources: [],
		});
		expect(hashReportPayload(normalized)).toBe(
			"d4b77fe6f70c4d87187485a906c7df70931e389c4f38a252245510c35eb0be5f",
		);
	});
});
