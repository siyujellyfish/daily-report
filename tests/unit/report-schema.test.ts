import { describe, expect, it } from "vitest";

import { reportIngestSchema } from "../../src/schemas/report";

const basePayload = {
	schemaVersion: 1 as const,
	reportType: "daily-news" as const,
	title: "Daily report",
	generatedAt: "2026-09-09T08:00:00+08:00",
	contentMarkdown: "# Report",
};

describe("report ingest schema", () => {
	it("normalizes omitted and null sources to an empty array", () => {
		expect(reportIngestSchema.parse(basePayload).sources).toEqual([]);
		expect(reportIngestSchema.parse({ ...basePayload, sources: null }).sources).toEqual([]);
	});

	it("trims source titles and keeps valid HTTP(S) URLs", () => {
		const parsed = reportIngestSchema.parse({
			...basePayload,
			sources: [{ title: "  Example  ", url: "https://example.com/source" }],
		});
		expect(parsed.sources).toEqual([{ title: "Example", url: "https://example.com/source" }]);
	});

	it("rejects unsupported source protocols and unknown payload fields", () => {
		expect(() => reportIngestSchema.parse({
			...basePayload,
			sources: [{ title: "Bad", url: "ftp://example.com/file" }],
		})).toThrow();
		expect(() => reportIngestSchema.parse({ ...basePayload, unexpected: true })).toThrow();
	});
});
