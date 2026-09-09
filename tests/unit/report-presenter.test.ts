import { describe, expect, it } from "vitest";

import { presentReport } from "../../src/lib/report-presenter";

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
});
