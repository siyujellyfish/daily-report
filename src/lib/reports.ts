import "server-only";

import { and, asc, count, desc, eq, exists, sql } from "drizzle-orm";
import { cache } from "react";

import { getDb } from "@/db";
import { reportCategories, reports } from "@/db/schema";
import { getReportSlug, parseReportSlug, REPORT_PAGE_SIZE } from "./report-date";
import { presentReport, type PublicReport } from "./report-presenter";
import {
	isCategorySlug,
	presentCategory,
	type PublicCategory,
} from "./report-types";

// Explicit public projections: never send hashes, ingest metadata, visibility,
// sort order, or internal timestamps to page components.
const publicReportColumns = {
	reportType: reports.reportType,
	reportDate: reports.reportDate,
	title: reports.title,
	contentMarkdown: reports.contentMarkdown,
	sources: reports.sources,
	generatedAt: reports.generatedAt,
};

const publicCategoryColumns = {
	slug: reportCategories.slug,
	label: reportCategories.label,
	description: reportCategories.description,
};

export type { PublicCategory, PublicReport };

export const getPublishedCategories = cache(async () => {
	const db = getDb();
	const hasReport = db
		.select({ value: sql`1` })
		.from(reports)
		.where(sql`${reports.reportType}::text = ${reportCategories.slug}`);

	const rows = await db
		.select(publicCategoryColumns)
		.from(reportCategories)
		.where(and(eq(reportCategories.isVisible, true), exists(hasReport)))
		.orderBy(
			sql`${reportCategories.sortOrder} asc nulls last`,
			asc(reportCategories.createdAt),
			asc(reportCategories.slug),
		);

	return rows.map(presentCategory);
});

export const getPublishedCategory = cache(async (slug: string) => {
	if (!isCategorySlug(slug)) return null;
	const db = getDb();
	const hasReport = db
		.select({ value: sql`1` })
		.from(reports)
		.where(sql`${reports.reportType}::text = ${reportCategories.slug}`);

	const [row] = await db
		.select(publicCategoryColumns)
		.from(reportCategories)
		.where(and(
			eq(reportCategories.slug, slug),
			eq(reportCategories.isVisible, true),
			exists(hasReport),
		))
		.limit(1);

	return row ? presentCategory(row) : null;
});

export const getLatestPublishedReports = cache(async () => {
	const db = getDb();
	const categories = await getPublishedCategories();
	if (categories.length === 0) return [];

	const rows = await db
		.selectDistinctOn([reports.reportType], publicReportColumns)
		.from(reports)
		.innerJoin(reportCategories, sql`${reports.reportType}::text = ${reportCategories.slug}`)
		.where(eq(reportCategories.isVisible, true))
		.orderBy(
			reports.reportType,
			desc(reports.reportDate),
			desc(reports.generatedAt),
		);

	const byCategory = new Map(rows.map((row) => [row.reportType, presentReport(row)]));
	return categories.flatMap((category) => {
		const report = byCategory.get(category.slug);
		return report ? [{ category, report }] : [];
	});
});

// Retained as a compatibility helper for existing tests/callers while the
// public homepage uses getLatestPublishedReports().
export const getLatestReports = cache(async () => {
	const rows = await getDb()
		.selectDistinctOn([reports.reportType], publicReportColumns)
		.from(reports)
		.orderBy(reports.reportType, desc(reports.reportDate), desc(reports.generatedAt));
	return rows.map(presentReport);
});

export const getReportsByCategory = cache(async (slug: string, page: number) => {
	if (!isCategorySlug(slug)) return null;
	const category = await getPublishedCategory(slug);
	if (!category) return null;

	const db = getDb();
	const filter = eq(reports.reportType, slug);
	const [rows, totals] = await Promise.all([
		db.select(publicReportColumns).from(reports).where(filter)
			.orderBy(desc(reports.reportDate), desc(reports.generatedAt))
			.limit(REPORT_PAGE_SIZE).offset((page - 1) * REPORT_PAGE_SIZE),
		db.select({ total: count() }).from(reports).where(filter),
	]);

	return {
		category,
		reports: rows.map(presentReport),
		total: totals[0]?.total ?? 0,
		page,
		pageCount: Math.max(1, Math.ceil((totals[0]?.total ?? 0) / REPORT_PAGE_SIZE)),
	};
});

// Legacy compatibility helper. Canonical public archives use category slugs.
export const getReportsByType = cache(async (type: string, page: number) => {
	const db = getDb();
	const filter = eq(reports.reportType, type);
	const [rows, totals] = await Promise.all([
		db.select(publicReportColumns).from(reports).where(filter)
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

	const [row] = await getDb()
		.select({
			...publicReportColumns,
			categorySlug: reportCategories.slug,
			categoryLabel: reportCategories.label,
			categoryDescription: reportCategories.description,
		})
		.from(reports)
		.innerJoin(reportCategories, sql`${reports.reportType}::text = ${reportCategories.slug}`)
		.where(and(
			eq(reports.reportType, parsed.type),
			eq(reports.reportDate, parsed.date),
		))
		.limit(1);

	if (!row) return null;
	const {
		categorySlug,
		categoryLabel,
		categoryDescription,
		...report
	} = row;

	return {
		...presentReport(report),
		category: presentCategory({
			slug: categorySlug,
			label: categoryLabel,
			description: categoryDescription,
		}),
	};
});

export async function getCategorySitemapEntries() {
	return (await getPublishedCategories()).map((category) => ({
		slug: category.slug,
	}));
}

export async function getReportSitemapEntries() {
	const rows = await getDb()
		.select({
			reportType: reports.reportType,
			reportDate: reports.reportDate,
		})
		.from(reports)
		.innerJoin(reportCategories, sql`${reports.reportType}::text = ${reportCategories.slug}`)
		.where(eq(reportCategories.isVisible, true))
		.orderBy(desc(reports.reportDate), reports.reportType);

	return rows.map((row) => ({
		slug: getReportSlug(row.reportDate, row.reportType),
	}));
}
