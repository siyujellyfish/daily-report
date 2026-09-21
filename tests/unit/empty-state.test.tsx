import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/reports", () => ({
	getReportsByCategory: vi.fn(),
}));

import { ReportArchive } from "@/components/report-archive";
import { ReportCard } from "@/components/report-card";
import { getReportsByCategory } from "@/lib/reports";
import { presentCategory } from "@/lib/report-types";

const mockedGetReportsByCategory = vi.mocked(getReportsByCategory);

const category = presentCategory({
	slug: "security-news",
	label: "資安情報",
	description: "每日資安事件與漏洞整理。",
});

const report = {
	reportType: "security-news",
	reportDate: "2026-09-18",
	title: "Security report",
	contentMarkdown: "# Security",
	sources: [],
	generatedAt: "2026-09-18T00:00:00.000Z",
	slug: "2026-09-18-security-news",
	summary: "Security summary.",
	headings: [],
	readingMinutes: 1,
};

beforeEach(() => {
	mockedGetReportsByCategory.mockReset();
});

test("homepage card renders a generic persisted category", () => {
	const html = renderToStaticMarkup(<ReportCard category={category} report={report} />);
	expect(html).toContain("資安情報");
	expect(html).toContain("Security report");
	expect(html).toContain("/category/security-news");
	expect(html).toContain("閱讀全文");
});

test("archive renders reports using the canonical category route", async () => {
	mockedGetReportsByCategory.mockResolvedValue({
		category,
		reports: [report],
		total: 1,
		page: 1,
		pageCount: 1,
	});
	const view = await ReportArchive({ slug: "security-news", page: 1 });
	const html = renderToStaticMarkup(view);
	expect(mockedGetReportsByCategory).toHaveBeenCalledWith("security-news", 1);
	expect(html).toContain("共 1 篇報告");
	expect(html).toContain("Security report");
	expect(html).toContain("每日資安事件與漏洞整理。");
	expect(html).not.toContain("報告列表分頁");
});
