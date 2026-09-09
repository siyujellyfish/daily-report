import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReportMarkdown } from "@/components/report-markdown";
import { ReportToc } from "@/components/report-toc";
import { formatGeneratedAt, formatReportDate } from "@/lib/report-date";
import { getReportBySlug } from "@/lib/reports";
import { REPORT_CATEGORIES } from "@/lib/report-types";
import { pageMetadata } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
	const report = await getReportBySlug((await params).slug);
	if (!report) notFound();
	const metadata = pageMetadata(`/reports/${report.slug}`, report.title, report.summary);
	return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: report.generatedAt } };
}

export default async function ReportPage({ params }: Props) {
	const report = await getReportBySlug((await params).slug);
	if (!report) notFound();
	const category = REPORT_CATEGORIES[report.reportType];
	return <>
		<nav className="breadcrumb" aria-label="麵包屑"><Link href="/">首頁</Link><span aria-hidden="true">/</span><Link href={category.href} prefetch={false}>{category.label}</Link><span aria-hidden="true">/</span><span aria-current="page">{formatReportDate(report.reportDate)}</span></nav>
		<div className={`article-grid ${report.headings.length < 3 ? "without-toc" : ""}`}>
			<article id="report-top"><header className="article-heading"><Link href={category.href} prefetch={false} className={`category ${category.style === "frameworks" ? "teal" : ""}`}>{category.label}</Link><h1>{report.title}</h1><div className="metadata"><time dateTime={report.generatedAt}>{formatGeneratedAt(report.generatedAt)}（台北時間）</time><span>約 {report.readingMinutes} 分鐘閱讀</span></div></header>
				<ReportToc headings={report.headings} mobile />
				<ReportMarkdown content={report.contentMarkdown} title={report.title} />
				<section className="sources" id="report-sources"><h2>參考來源</h2>
					{report.sources.length === 0 ? <p>本篇未附來源連結。</p> : <><p>延伸閱讀與原始資料。</p>{report.sources.map((source, index) => <a className="source-link" key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noopener noreferrer"><span>{source.title}<small>{source.hostname}</small></span><span aria-hidden="true">↗</span><span className="sr-only">（另開分頁）</span></a>)}</>}
				</section>
				<div className="article-return"><Button asChild className="button"><Link href={category.href} prefetch={false}>← 返回{category.label}</Link></Button><a className="text-link" href="#report-top">回到頂端 ↑</a></div>
			</article>
			<ReportToc headings={report.headings} />
		</div>
	</>;
}
