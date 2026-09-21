import { notFound } from "next/navigation";

import { ReportArchive } from "@/components/report-archive";
import { parseReportPage } from "@/lib/report-date";
import { getPublishedCategory } from "@/lib/reports";
import { pageMetadata } from "@/lib/site";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ page?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props) {
	const [{ slug }, query] = await Promise.all([params, searchParams]);
	const page = parseReportPage(query.page);
	if (!page) notFound();

	const category = await getPublishedCategory(slug);
	if (!category) notFound();

	const path = page === 1 ? category.href : `${category.href}?page=${page}`;
	const title = category.title + (page > 1 ? ` · 第 ${page} 頁` : "");
	return pageMetadata(path, title, category.description);
}

export default async function CategoryPage({ params, searchParams }: Props) {
	const [{ slug }, query] = await Promise.all([params, searchParams]);
	const page = parseReportPage(query.page);
	if (!page) notFound();

	return <ReportArchive slug={slug} page={page} />;
}
