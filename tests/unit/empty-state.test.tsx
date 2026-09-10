import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

const getReportsByType = vi.fn();

vi.mock("@/lib/reports", () => ({
	getReportsByType,
}));

import { ReportArchive } from "@/components/report-archive";
import { ReportCard } from "@/components/report-card";

beforeEach(() => {
	getReportsByType.mockReset();
});

test("homepage card renders a clear empty state without a report", () => {
	const html = renderToStaticMarkup(<ReportCard type="daily-news" />);
	expect(html).toContain("尚無已發布報告");
	expect(html).toContain("第一篇資訊新聞發布後，會顯示在這裡。");
	expect(html).toContain("瀏覽資訊新聞歷史報告");
	expect(html).not.toContain("閱讀全文");
});

test("archive renders a clear empty state for an isolated empty query result", async () => {
	getReportsByType.mockResolvedValue({
		reports: [],
		total: 0,
		page: 1,
		pageCount: 1,
	});
	const view = await ReportArchive({ type: "daily-news", page: 1 });
	const html = renderToStaticMarkup(view);
	expect(getReportsByType).toHaveBeenCalledWith("daily-news", 1);
	expect(html).toContain("共 0 篇報告");
	expect(html).toContain("尚無已發布報告");
	expect(html).toContain("報告發布後，將依日期顯示在這裡。");
	expect(html).toContain("返回首頁");
	expect(html).not.toContain("報告列表分頁");
});
