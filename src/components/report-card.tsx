import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { truncateCategoryLabel } from "@/lib/category-label";
import { formatReportDate } from "@/lib/report-date";
import type { PublicCategory, PublicReportSummary } from "@/lib/reports";

export function ReportCard({
	category,
	report,
}: {
	category: PublicCategory;
	report: PublicReportSummary;
}) {
	return <Card className={`feature category-scope ${category.style}`}>
		<CardHeader className="feature-top">
			<h3 className="category" aria-label={category.title} title={category.title}>
				<span className="category-icon" aria-hidden="true">{category.icon}</span>
				<span aria-hidden="true">{truncateCategoryLabel(category.title)}</span>
			</h3>
			<span className="issue">{category.issue}</span>
		</CardHeader>
		<CardContent className="feature-body">
			<div className="metadata">
				<time dateTime={report.reportDate}>{formatReportDate(report.reportDate)}</time>
				<span>約 {report.readingMinutes} 分鐘閱讀</span>
			</div>
			<h4><Link href={`/reports/${report.slug}`} prefetch={false}>{report.title}</Link></h4>
			<p>{report.summary || "開啟報告閱讀完整內容。"}</p>
			{report.headings.length > 0 && <ol className="feature-highlights">
				{report.headings.slice(0, 3).map((heading, index) => <li key={heading.id}>
					<span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
					{heading.text}
				</li>)}
			</ol>}
		</CardContent>
		<CardFooter className="feature-footer">
			<Button asChild className="button">
				<Link
					href={`/reports/${report.slug}`}
					prefetch={false}
					aria-label={`閱讀全文：${report.title}`}
				>閱讀全文 <span aria-hidden="true">↗</span></Link>
			</Button>
			<Link
				className="text-link"
				href={category.href}
				prefetch={false}
				aria-label={`瀏覽${category.title}歷史報告`}
			>瀏覽歷史報告</Link>
		</CardFooter>
	</Card>;
}
