import { describe, expect, it } from "vitest";

import {
	categorySlugSchema,
	reportIngestSchema,
} from "../../src/schemas/report";

const basePayload = {
	schemaVersion: 1 as const,
	reportType: "daily-news" as const,
	title: "Daily report",
	generatedAt: "2026-09-09T08:00:00+08:00",
	contentMarkdown: "# Report",
};

describe("report ingest schema", () => {
	it("keeps schema v1 normalization compatible", () => {
		expect(reportIngestSchema.parse(basePayload)).toEqual({
			...basePayload,
			sources: [],
		});
		expect(reportIngestSchema.parse({ ...basePayload, sources: null }).sources).toEqual([]);
	});

	it("keeps schema v1 restricted to the two legacy report types", () => {
		expect(() => reportIngestSchema.parse({
			...basePayload,
			reportType: "security-news",
		})).toThrow();
	});

	it("accepts schema v2 dynamic category metadata and normalizes it", () => {
		const parsed = reportIngestSchema.parse({
			schemaVersion: 2,
			reportType: "security-news",
			categoryLabel: "  資安情報  ",
			categoryDescription: "  每日資安事件與漏洞整理。  ",
			title: "  Security report  ",
			generatedAt: "2026-09-09T08:00:00+08:00",
			contentMarkdown: "# Security",
			sources: null,
		});

		expect(parsed).toEqual({
			schemaVersion: 2,
			reportType: "security-news",
			categoryLabel: "資安情報",
			categoryDescription: "每日資安事件與漏洞整理。",
			title: "Security report",
			generatedAt: "2026-09-09T08:00:00+08:00",
			contentMarkdown: "# Security",
			sources: [],
		});
	});

	it("validates safe lowercase category slugs", () => {
		expect(categorySlugSchema.parse("ai-agent")).toBe("ai-agent");
		for (const invalid of [
			"AI-Agent",
			"security/news",
			"-security-news",
			"security-news-",
			"security--news",
			"security_news",
		]) {
			expect(() => categorySlugSchema.parse(invalid)).toThrow();
		}
		expect(() => categorySlugSchema.parse("a".repeat(81))).toThrow();
	});

	it("rejects missing v2 metadata and payload-controlled presentation fields", () => {
		const validV2 = {
			schemaVersion: 2 as const,
			reportType: "security-news",
			categoryLabel: "資安情報",
			categoryDescription: "每日資安事件與漏洞整理。",
			title: "Security report",
			generatedAt: "2026-09-09T08:00:00+08:00",
			contentMarkdown: "# Security",
			sources: [],
		};

		expect(() => reportIngestSchema.parse({
			...validV2,
			categoryLabel: "",
		})).toThrow();
		expect(() => reportIngestSchema.parse({
			...validV2,
			categoryDescription: "",
		})).toThrow();
		expect(() => reportIngestSchema.parse({
			...validV2,
			isVisible: false,
		})).toThrow();
		expect(() => reportIngestSchema.parse({
			...validV2,
			sortOrder: 1,
		})).toThrow();
		expect(() => reportIngestSchema.parse({
			...validV2,
			style: "red",
		})).toThrow();
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
