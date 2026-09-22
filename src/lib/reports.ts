import "server-only";

import { and, asc, desc, eq, exists, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { reportCategories, reports } from "@/db/schema";
import { configurePublicReportsCache } from "./public-report-cache";
import { getReportSlug, parseReportSlug, REPORT_PAGE_SIZE } from "./report-date";
import { analyzeReportMarkdown, type ReportHeading } from "./report-markdown";
import {
	presentReport,
	presentReportSummary,
	type PublicReport,
	type PublicReportSummary,
} from "./report-presenter";
import { measureServerOperation } from "./server-performance";
import {
	isCategorySlug,
	presentCategory,
	type PublicCategory,
} from "./report-types";

// Summary projections keep Markdown and sources out of homepage/archive reads.
// The row id is used only for the rolling-migration fallback and is never
// returned to page components.
const publicReportSummaryColumns = {
	id: reports.id,
	reportType: reports.reportType,
	reportDate: reports.reportDate,
	title: reports.title,
	summary: reports.summary,
	readingMinutes: reports.readingMinutes,
	headings: reports.headings,
};

const publicReportDetailColumns = {
	reportType: reports.reportType,
	reportDate: reports.reportDate,
	title: reports.title,
	contentMarkdown: reports.contentMarkdown,
	summary: reports.summary,
	readingMinutes: reports.readingMinutes,
	headings: reports.headings,
	sources: reports.sources,
	generatedAt: reports.generatedAt,
};

const publicCategoryColumns = {
	slug: reportCategories.slug,
	label: reportCategories.label,
	description: reportCategories.description,
};

type StoredReportSummaryRow = {
	id: string;
	reportType: string;
	reportDate: string;
	title: string;
	summary: string | null;
	readingMinutes: number | null;
	headings: ReportHeading[] | null;
};

function hasStoredPresentation(row: StoredReportSummaryRow) {
	return row.summary !== null
		&& row.readingMinutes !== null
		&& row.headings !== null;
}

async function resolveReportSummaries(rows: StoredReportSummaryRow[]) {
	const missingIds = rows
		.filter((row) => !hasStoredPresentation(row))
		.map((row) => row.id);
	const fallback = new Map<string, ReturnType<typeof analyzeReportMarkdown>>();

	if (missingIds.length > 0) {
		const legacyRows = await measureServerOperation(
			"reports.presentation-fallback",
			() => getDb()
				.select({
					id: reports.id,
					title: reports.title,
					contentMarkdown: reports.contentMarkdown,
				})
				.from(reports)
				.where(inArray(reports.id, missingIds)),
			(result) => ({ rowCount: result.length }),
		);

		for (const row of legacyRows) {
			fallback.set(
				row.id,
				analyzeReportMarkdown(row.contentMarkdown, row.title),
			);
		}
	}

	return rows.map((row) => {
		const presentation = hasStoredPresentation(row)
			? {
				summary: row.summary!,
				readingMinutes: row.readingMinutes!,
				headings: row.headings!,
			}
			: fallback.get(row.id);

		if (!presentation) {
			throw new Error(`Missing presentation data for report ${row.id}.`);
		}

		return presentReportSummary({
			reportType: row.reportType,
			reportDate: row.reportDate,
			title: row.title,
			...presentation,
		});
	});
}

export type { PublicCategory, PublicReport, PublicReportSummary };

export async function getPublishedCategories() {
	"use cache";
	configurePublicReportsCache();

	const rows = await measureServerOperation(
		"reports.published-categories",
		async () => {
			const db = getDb();
			const hasReport = db
				.select({ value: sql`1` })
				.from(reports)
				.where(sql`${reports.reportType}::text = ${reportCategories.slug}`);

			return db
				.select(publicCategoryColumns)
				.from(reportCategories)
				.where(and(eq(reportCategories.isVisible, true), exists(hasReport)))
				.orderBy(
					sql`${reportCategories.sortOrder} asc nulls last`,
					asc(reportCategories.createdAt),
					asc(reportCategories.slug),
				);
		},
		(result) => ({ rowCount: result.length }),
	);

	return rows.map(presentCategory);
}

export async function getPublishedCategory(slug: string) {
	if (!isCategorySlug(slug)) return null;
	return (await getPublishedCategories()).find((category) => category.slug === slug) ?? null;
}

export async function getLatestPublishedReports() {
	"use cache";
	configurePublicReportsCache();

	const db = getDb();
	const rankedReports = db
		.select({
			...publicReportSummaryColumns,
			rank: sql<number>`row_number() over (
				partition by ${reports.reportType}
				order by ${reports.reportDate} desc, ${reports.generatedAt} desc
			)`.as("report_rank"),
		})
		.from(reports)
		.as("ranked_reports");

	const rows = await measureServerOperation(
		"reports.latest-published",
		() => db
			.select({
				id: rankedReports.id,
				reportType: rankedReports.reportType,
				reportDate: rankedReports.reportDate,
				title: rankedReports.title,
				summary: rankedReports.summary,
				readingMinutes: rankedReports.readingMinutes,
				headings: rankedReports.headings,
				categorySlug: reportCategories.slug,
				categoryLabel: reportCategories.label,
				categoryDescription: reportCategories.description,
			})
			.from(rankedReports)
			.innerJoin(
				reportCategories,
				sql`${rankedReports.reportType}::text = ${reportCategories.slug}`,
			)
			.where(and(
				eq(reportCategories.isVisible, true),
				eq(rankedReports.rank, 1),
			))
			.orderBy(
				sql`${reportCategories.sortOrder} asc nulls last`,
				asc(reportCategories.createdAt),
				asc(reportCategories.slug),
			),
		(result) => ({ rowCount: result.length }),
	);
	const summaries = await resolveReportSummaries(rows);

	return rows.map((row, index) => ({
		category: presentCategory({
			slug: row.categorySlug,
			label: row.categoryLabel,
			description: row.categoryDescription,
		}),
		report: summaries[index],
	}));
}

// Retained as a compatibility helper for existing callers.
export async function getLatestReports() {
	"use cache";
	configurePublicReportsCache();

	const rows = await measureServerOperation(
		"reports.latest",
		() => getDb()
			.selectDistinctOn([reports.reportType], publicReportSummaryColumns)
			.from(reports)
			.orderBy(
				reports.reportType,
				desc(reports.reportDate),
				desc(reports.generatedAt),
			),
		(result) => ({ rowCount: result.length }),
	);

	return resolveReportSummaries(rows);
}

export async function getReportsByCategory(slug: string, page: number) {
	"use cache";
	configurePublicReportsCache();

	if (!isCategorySlug(slug)) return null;
	const category = await getPublishedCategory(slug);
	if (!category) return null;

	const rows = await measureServerOperation(
		"reports.category-page",
		() => getDb()
			.select({
				...publicReportSummaryColumns,
				total: sql<number>`count(*) over()`.mapWith(Number).as("total"),
			})
			.from(reports)
			.where(eq(reports.reportType, slug))
			.orderBy(desc(reports.reportDate), desc(reports.generatedAt))
			.limit(REPORT_PAGE_SIZE)
			.offset((page - 1) * REPORT_PAGE_SIZE),
		(result) => ({ categorySlug: slug, page, rowCount: result.length }),
	);
	const total = rows[0]?.total ?? 0;

	return {
		category,
		reports: await resolveReportSummaries(rows),
		total,
		page,
		pageCount: Math.max(1, Math.ceil(total / REPORT_PAGE_SIZE)),
	};
}

// Legacy compatibility helper. Canonical public archives use category slugs.
export async function getReportsByType(type: string, page: number) {
	"use cache";
	configurePublicReportsCache();

	const rows = await measureServerOperation(
		"reports.legacy-category-page",
		() => getDb()
			.select({
				...publicReportSummaryColumns,
				total: sql<number>`count(*) over()`.mapWith(Number).as("total"),
			})
			.from(reports)
			.where(eq(reports.reportType, type))
			.orderBy(desc(reports.reportDate), desc(reports.generatedAt))
			.limit(REPORT_PAGE_SIZE)
			.offset((page - 1) * REPORT_PAGE_SIZE),
		(result) => ({ categorySlug: type, page, rowCount: result.length }),
	);
	const total = rows[0]?.total ?? 0;

	return {
		reports: await resolveReportSummaries(rows),
		total,
		page,
		pageCount: Math.max(1, Math.ceil(total / REPORT_PAGE_SIZE)),
	};
}

export async function getReportBySlug(slug: string) {
	"use cache";
	configurePublicReportsCache();

	const parsed = parseReportSlug(slug);
	if (!parsed) return null;

	const [row] = await measureServerOperation(
		"reports.detail",
		() => getDb()
			.select({
				...publicReportDetailColumns,
				categorySlug: reportCategories.slug,
				categoryLabel: reportCategories.label,
				categoryDescription: reportCategories.description,
			})
			.from(reports)
			.innerJoin(
				reportCategories,
				sql`${reports.reportType}::text = ${reportCategories.slug}`,
			)
			.where(and(
				eq(reports.reportType, parsed.type),
				eq(reports.reportDate, parsed.date),
			))
			.limit(1),
		(result) => ({ found: result.length > 0 }),
	);

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
}

export async function getCategorySitemapEntries() {
	return (await getPublishedCategories()).map((category) => ({
		slug: category.slug,
	}));
}

export async function getReportSitemapEntries() {
	"use cache";
	configurePublicReportsCache();

	const rows = await measureServerOperation(
		"reports.sitemap",
		() => getDb()
			.select({
				reportType: reports.reportType,
				reportDate: reports.reportDate,
			})
			.from(reports)
			.innerJoin(
				reportCategories,
				sql`${reports.reportType}::text = ${reportCategories.slug}`,
			)
			.where(eq(reportCategories.isVisible, true))
			.orderBy(desc(reports.reportDate), reports.reportType),
		(result) => ({ rowCount: result.length }),
	);

	return rows.map((row) => ({
		slug: getReportSlug(row.reportDate, row.reportType),
	}));
}
