import { notFound, permanentRedirect } from "next/navigation";

import { parseReportPage } from "@/lib/report-date";

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export const instant = false;

export default async function NewsPage({ searchParams }: Props) {
	const page = parseReportPage((await searchParams).page);
	if (!page) notFound();
	permanentRedirect(page === 1 ? "/category/daily-news" : `/category/daily-news?page=${page}`);
}
