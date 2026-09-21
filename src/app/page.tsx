import { ReportCard } from "@/components/report-card";
import { formatReportDate } from "@/lib/report-date";
import { getLatestPublishedReports } from "@/lib/reports";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("/", "每日推播", SITE_DESCRIPTION);

export default async function Home() {
	const items = await getLatestPublishedReports();
	const latestDate = items.map(({ report }) => report.reportDate).sort().at(-1);

	return <>
		<section className="intro">
			<div>
				<p className="eyebrow">A daily dose of technology</p>
				<h1>掌握新知，保持好奇。</h1>
				<p>依主題整理每日值得關注的資訊與工具，保留來源方便延伸閱讀。</p>
			</div>
			{latestDate && <div className="edition">
				<strong>{formatReportDate(latestDate)}</strong>
				<span>最新刊期 / TAIPEI</span>
			</div>}
		</section>
		<section aria-labelledby="latest-heading">
			<div className="section-head">
				<h2 id="latest-heading">最新報告</h2>
				<span>依分類呈現最新內容</span>
			</div>
			{items.length > 0
				? <div className="featured-grid">
					{items.map(({ category, report }) => <ReportCard
						key={category.slug}
						category={category}
						report={report}
					/>)}
				</div>
				: <div className="empty compact-empty">
					<h2>尚無已發布報告</h2>
					<p>第一篇報告發布後，會顯示在這裡。</p>
				</div>}
		</section>
		<aside className="editorial-note">
			<strong>關於這份日報</strong>
			<p>分類會隨已發布內容自動出現；每篇報告保留原始來源，方便核對與延伸閱讀。</p>
		</aside>
	</>;
}
