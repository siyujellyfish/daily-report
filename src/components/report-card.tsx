import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatReportDate } from "@/lib/report-date";
import type { PublicReport } from "@/lib/reports";
import { REPORT_CATEGORIES, type ReportType } from "@/lib/report-types";

export function ReportCard({ type, report }: { type: ReportType; report?: PublicReport }) {
	const category = REPORT_CATEGORIES[type];
	return <Card className={`feature ${category.style}`}>
		<CardHeader className="feature-top"><h3 className="category"><span className="category-icon" aria-hidden="true">{type === "daily-news" ? "≡" : "⌘"}</span>{category.title}</h3><span className="issue">{category.issue}</span></CardHeader>
		<CardContent className="feature-body">
			{report ? <>
				<div className="metadata"><time dateTime={report.reportDate}>{formatReportDate(report.reportDate)}</time><span>約 {report.readingMinutes} 分鐘閱讀</span></div>
				<h4><Link href={`/reports/${report.slug}`} prefetch={false}>{report.title}</Link></h4>
				<p>{report.summary || "開啟報告閱讀完整內容。"}</p>
				{report.headings.length > 0 && <ol className="feature-highlights">{report.headings.slice(0, 3).map((heading, index) => <li key={heading.id}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{heading.text}</li>)}</ol>}
			</> : <div className="card-empty"><h4>尚無已發布報告</h4><p>第一篇{category.title}發布後，會顯示在這裡。</p></div>}
		</CardContent>
		<CardFooter className="feature-footer">
			{report && <Button asChild className="button"><Link href={`/reports/${report.slug}`} prefetch={false}>閱讀全文 <span aria-hidden="true">↗</span></Link></Button>}
			<Link className="text-link" href={category.href} prefetch={false}>瀏覽歷史報告</Link>
		</CardFooter>
	</Card>;
}
