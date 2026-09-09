import Link from "next/link";
import { notFound } from "next/navigation";
import { formatReportDate, REPORT_PAGE_SIZE } from "@/lib/report-date";
import { getReportsByType } from "@/lib/reports";
import { REPORT_CATEGORIES, type ReportType } from "@/lib/report-types";

export async function ReportArchive({ type, page }: { type: ReportType; page: number }) {
	const category = REPORT_CATEGORIES[type];
	const result = await getReportsByType(type, page);
	if (page > result.pageCount) notFound();
	const pageHref = (number: number) => number === 1 ? category.href : `${category.href}?page=${number}`;
	const pages = [...new Set([1, page - 1, page, page + 1, result.pageCount])].filter((number) => number >= 1 && number <= result.pageCount).sort((a, b) => a - b);
	return <div className={category.style}>
		<header className="archive-header"><p className="eyebrow">{category.eyebrow}</p><h1>{category.title}</h1><p>{category.description}</p></header>
		<div className="archive-meta"><span>共 {result.total} 篇報告</span><span>由新到舊{result.total > 0 && ` · 第 ${page} / ${result.pageCount} 頁`}</span></div>
		{result.total === 0 ? <section className="empty"><h2>尚無已發布報告</h2><p>報告發布後，將依日期顯示在這裡。</p><Link className="text-link" href="/">返回首頁</Link></section> : <>
			<ol className="archive-list" start={(page - 1) * REPORT_PAGE_SIZE + 1}>{result.reports.map((report) => <li className="archive-item" key={report.slug}>
				<time className="archive-date" dateTime={report.reportDate}>{formatReportDate(report.reportDate)}</time>
				<div><h2><Link href={`/reports/${report.slug}`} prefetch={false}>{report.title}</Link></h2><p>{report.summary}</p></div>
				<Link href={`/reports/${report.slug}`} prefetch={false} className="archive-arrow" aria-label={`閱讀：${report.title}`}>↗</Link>
			</li>)}</ol>
			{result.pageCount > 1 && <nav className="pagination" aria-label="報告列表分頁">
				{page > 1 ? <Link href={pageHref(page - 1)} prefetch={false} aria-label="上一頁">←</Link> : <span className="disabled" aria-disabled="true">←</span>}
				{pages.map((number, index) => <span className="page-group" key={number}>{index > 0 && number - pages[index - 1] > 1 && <span aria-hidden="true" className="ellipsis">…</span>}<Link href={pageHref(number)} prefetch={false} aria-label={`第 ${number} 頁`} aria-current={page === number ? "page" : undefined}>{number}</Link></span>)}
				{page < result.pageCount ? <Link href={pageHref(page + 1)} prefetch={false} aria-label="下一頁">→</Link> : <span className="disabled" aria-disabled="true">→</span>}
			</nav>}
		</>}
	</div>;
}
