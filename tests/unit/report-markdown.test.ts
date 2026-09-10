import { describe, expect, it } from "vitest";

import { analyzeReportMarkdown, safeSourceUrl } from "../../src/lib/report-markdown";

describe("report Markdown analysis", () => {
	it("removes a duplicate leading H1 and generates collision-free anchors", () => {
		const result = analyzeReportMarkdown(
			"# Same title\n\nIntro paragraph.\n\n## Repeat\n\n## Repeat\n\n### Detail",
			"Same title",
		);

		expect(result.summary).toBe("Intro paragraph.");
		expect(result.headings).toEqual([
			{ id: "report-section-1", text: "Repeat", depth: 2 },
			{ id: "report-section-2", text: "Repeat", depth: 2 },
			{ id: "report-section-3", text: "Detail", depth: 3 },
		]);
	});

	it("does not treat fenced code content as headings", () => {
		const result = analyzeReportMarkdown(
			"Intro.\n\n```md\n## Not a heading\n```\n\n## Real heading",
			"Title",
		);

		expect(result.headings).toEqual([
			{ id: "report-section-1", text: "Real heading", depth: 2 },
		]);
	});

	it("promotes later H1 headings to H2", () => {
		const result = analyzeReportMarkdown("Intro.\n\n# Section", "Different title");
		expect(result.headings[0]).toEqual({ id: "report-section-1", text: "Section", depth: 2 });
	});

	it("keeps summary length and reading time bounded", () => {
		const result = analyzeReportMarkdown("a".repeat(801), "Title");
		expect(Array.from(result.summary).length).toBe(101);
		expect(result.summary.endsWith("…")).toBe(true);
		expect(result.readingMinutes).toBe(3);
		expect(analyzeReportMarkdown("short", "Title").readingMinutes).toBe(1);
	});
});

describe("safeSourceUrl", () => {
	it("allows credential-free HTTP(S) URLs", () => {
		expect(safeSourceUrl("https://example.com/path?q=1")).toBe("https://example.com/path?q=1");
		expect(safeSourceUrl("http://example.com")).toBe("http://example.com/");
	});

	it("rejects unsafe protocols and embedded credentials", () => {
		expect(safeSourceUrl("javascript:alert(1)")).toBeNull();
		expect(safeSourceUrl("data:text/plain,test")).toBeNull();
		expect(safeSourceUrl("https://user:password@example.com")).toBeNull();
		expect(safeSourceUrl("not a url")).toBeNull();
	});
});
