import { notFound, permanentRedirect } from "next/navigation";

import { parseReportPage } from "@/lib/report-date";

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export default async function FrameworksPage({ searchParams }: Props) {
	const page = parseReportPage((await searchParams).page);
	if (!page) notFound();
	permanentRedirect(page === 1
		? "/category/framework-recommendation"
		: `/category/framework-recommendation?page=${page}`);
}
