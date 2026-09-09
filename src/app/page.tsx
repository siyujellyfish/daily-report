import { ReportCard } from "@/components/report-card";
import { formatReportDate } from "@/lib/report-date";
import { getLatestReports } from "@/lib/reports";
import { REPORT_TYPES } from "@/lib/report-types";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("/", "每日推播", SITE_DESCRIPTION);

export default async function Home() {
	const reports = await getLatestReports();
	const latestDate = reports.map((report) => report.reportDate).sort().at(-1);
	return <>
		<section className="intro"><div><p className="eyebrow">A daily dose of technology</p><h1>掌握新知，保持好奇。</h1><p>每日技術觀察與工具探索，值得讀的都在這裡。</p></div>
			{latestDate && <div className="edition"><strong>{formatReportDate(latestDate)}</strong><span>最新刊期 / TAIPEI</span></div>}
		</section>
		<section aria-labelledby="latest-heading"><div className="section-head"><h2 id="latest-heading">最新報告</h2><span>兩種視角，一次掌握</span></div>
			<div className="featured-grid">{REPORT_TYPES.map((type) => <ReportCard key={type} type={type} report={reports.find((report) => report.reportType === type)} />)}</div>
		</section>
		<aside className="editorial-note"><strong>關於這份日報</strong><p>以每日資訊新聞追蹤技術方向，以框架工具推薦深入理解一項工具。每篇報告保留原始來源，方便延伸閱讀。</p></aside>
	</>;
}
