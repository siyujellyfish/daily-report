import { notFound } from "next/navigation";
import { ReportArchive } from "@/components/report-archive";
import { parseReportPage } from "@/lib/report-date";
import { REPORT_CATEGORIES } from "@/lib/report-types";
import { pageMetadata } from "@/lib/site";

type Props = { searchParams: Promise<{ page?: string | string[] }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: Props) {
	const page = parseReportPage((await searchParams).page);
	if (!page) notFound();
	const category = REPORT_CATEGORIES["framework-recommendation"];
	return pageMetadata(page === 1 ? "/frameworks" : `/frameworks?page=${page}`, category.title + (page > 1 ? ` · 第 ${page} 頁` : ""), category.description);
}

export default async function FrameworksPage({ searchParams }: Props) {
	const page = parseReportPage((await searchParams).page);
	if (!page) notFound();
	return <ReportArchive type="framework-recommendation" page={page} />;
}
