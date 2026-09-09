import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import { cache } from "react";

import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { getReportSlug, parseReportSlug, REPORT_PAGE_SIZE } from "./report-date";
import { presentReport, type PublicReport } from "./report-presenter";
import type { ReportType } from "./report-types";

// Explicit public projection: never send hashes, ingest metadata, or secrets to pages.
const publicColumns = {
	reportType: reports.reportType,
	reportDate: reports.reportDate,
	title: reports.title,
	contentMarkdown: reports.contentMarkdown,
	sources: reports.sources,
	generatedAt: reports.generatedAt,
};

export type { PublicReport };

export const getLatestReports = cache(async () => {
	const rows = await getDb().selectDistinctOn([reports.reportType], publicColumns)
		.from(reports)
		.orderBy(reports.reportType, desc(reports.reportDate), desc(reports.generatedAt));
	return rows.map(presentReport);
});

export const getReportsByType = cache(async (type: ReportType, page: number) => {
	const db = getDb();
	const filter = eq(reports.reportType, type);
	const [rows, totals] = await Promise.all([
		db.select(publicColumns).from(reports).where(filter)
			.orderBy(desc(reports.reportDate), desc(reports.generatedAt))
			.limit(REPORT_PAGE_SIZE).offset((page - 1) * REPORT_PAGE_SIZE),
		db.select({ total: count() }).from(reports).where(filter),
	]);
	return {
		reports: rows.map(presentReport),
		total: totals[0]?.total ?? 0,
		page,
		pageCount: Math.max(1, Math.ceil((totals[0]?.total ?? 0) / REPORT_PAGE_SIZE)),
	};
});

export const getReportBySlug = cache(async (slug: string) => {
	const parsed = parseReportSlug(slug);
	if (!parsed) return null;
	const [row] = await getDb().select(publicColumns).from(reports)
		.where(and(eq(reports.reportType, parsed.type), eq(reports.reportDate, parsed.date)))
		.limit(1);
	return row ? presentReport(row) : null;
});

export async function getReportSitemapEntries() {
	const rows = await getDb().select({ reportType: reports.reportType, reportDate: reports.reportDate })
		.from(reports).orderBy(desc(reports.reportDate), reports.reportType);
	return rows.map((row) => ({ slug: getReportSlug(row.reportDate, row.reportType) }));
}
