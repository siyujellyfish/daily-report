import type { MetadataRoute } from "next";
import { getReportSitemapEntries } from "@/lib/reports";
import { IS_PREVIEW, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	if (IS_PREVIEW) return [];
	const reports = await getReportSitemapEntries();
	return ["/", "/news", "/frameworks", ...reports.map((report) => `/reports/${report.slug}`)].map((path) => ({ url: new URL(path, SITE_URL).href }));
}
