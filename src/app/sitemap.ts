import type { MetadataRoute } from "next";

import { deferDatabasePrerenderIfUnavailable } from "@/lib/database-prerender";
import {
	getCategorySitemapEntries,
	getReportSitemapEntries,
} from "@/lib/reports";
import { IS_PREVIEW, SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	if (IS_PREVIEW) return [];
	await deferDatabasePrerenderIfUnavailable();

	const [categories, reports] = await Promise.all([
		getCategorySitemapEntries(),
		getReportSitemapEntries(),
	]);

	return [
		"/",
		...categories.map((category) => `/category/${category.slug}`),
		...reports.map((report) => `/reports/${report.slug}`),
	].map((path) => ({ url: new URL(path, SITE_URL).href }));
}
