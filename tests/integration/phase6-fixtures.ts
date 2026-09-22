import { createHash } from "node:crypto";

import { and, eq, inArray, or } from "drizzle-orm";

import { getDb } from "../../src/db";
import { reportCategories, reports } from "../../src/db/schema";
import { analyzeReportMarkdown } from "../../src/lib/report-markdown";

export const LEGACY_FIXTURE_DATE = "2099-01-01";

const DYNAMIC_CATEGORY_SLUGS = [
	"security-news",
	"long-category-navigation-fixture",
	"phase6-empty-category",
	"phase6-hidden-category",
] as const;

function fixtureHash(name: string) {
	return createHash("sha256").update("daily-report:" + name).digest("hex");
}

export function configureFixtureDatabase() {
	const testDatabaseUrl = process.env.TEST_DATABASE_URL;
	if (!testDatabaseUrl) {
		throw new Error("TEST_DATABASE_URL is required for Phase 6 fixture management.");
	}
	if (process.env.DATABASE_URL && process.env.DATABASE_URL === testDatabaseUrl) {
		throw new Error("Refusing to manage fixtures when TEST_DATABASE_URL matches DATABASE_URL.");
	}
	process.env.DATABASE_URL = testDatabaseUrl;
}

export async function cleanupPhase6Fixtures() {
	const db = getDb();

	await db.delete(reports).where(or(
		inArray(reports.reportType, [...DYNAMIC_CATEGORY_SLUGS]),
		and(
			inArray(reports.reportType, ["daily-news", "framework-recommendation"]),
			eq(reports.reportDate, LEGACY_FIXTURE_DATE),
		),
	));

	await db.delete(reportCategories).where(inArray(
		reportCategories.slug,
		[...DYNAMIC_CATEGORY_SLUGS],
	));
}

export async function seedPhase6Fixtures() {
	const db = getDb();
	await cleanupPhase6Fixtures();

	await db.insert(reportCategories).values([
		{
			slug: "security-news",
			label: "資安情報",
			description: "每日資安事件、漏洞與威脅情報整理。",
			isVisible: true,
			createdAt: new Date("2026-09-18T08:04:55.000Z"),
			updatedAt: new Date("2026-09-18T08:04:55.000Z"),
		},
		{
			slug: "long-category-navigation-fixture",
			label: "這是一個用於驗證超長分類標籤在桌面與行動版導覽列水平捲動時仍能維持版面穩定的自適應分類驗收項目",
			description: "Phase 6.5 isolated long-label navigation and responsive layout fixture.",
			isVisible: true,
			createdAt: new Date("2026-09-19T00:00:00.000Z"),
			updatedAt: new Date("2026-09-19T00:00:00.000Z"),
		},
		{
			slug: "phase6-empty-category",
			label: "空分類驗收",
			description: "Visible but intentionally unpublished Phase 6.5 fixture.",
			isVisible: true,
			createdAt: new Date("2026-09-20T00:00:00.000Z"),
			updatedAt: new Date("2026-09-20T00:00:00.000Z"),
		},
		{
			slug: "phase6-hidden-category",
			label: "隱藏分類驗收",
			description: "Published but intentionally hidden Phase 6.5 fixture.",
			isVisible: false,
			createdAt: new Date("2026-09-21T00:00:00.000Z"),
			updatedAt: new Date("2026-09-21T00:00:00.000Z"),
		},
	]);

	const fixtureReports = [
		{
			schemaVersion: 1,
			reportType: "daily-news",
			reportDate: LEGACY_FIXTURE_DATE,
			title: "Phase 6 Fixture Daily News",
			contentMarkdown: "# Phase 6 Fixture Daily News\n\nCanonical isolated legacy fixture.",
			sources: [],
			generatedAt: new Date("2099-01-01T00:00:00.000Z"),
			payloadHash: fixtureHash("daily-news"),
		},
		{
			schemaVersion: 1,
			reportType: "framework-recommendation",
			reportDate: LEGACY_FIXTURE_DATE,
			title: "Phase 6 Fixture Framework",
			contentMarkdown: "# Phase 6 Fixture Framework\n\nCanonical isolated legacy fixture.",
			sources: [],
			generatedAt: new Date("2099-01-01T00:05:00.000Z"),
			payloadHash: fixtureHash("framework-recommendation"),
		},
		{
			schemaVersion: 2,
			reportType: "security-news",
			reportDate: "2026-09-18",
			title: "Phase 6 v2 Security Fixture",
			contentMarkdown: "# Security News\n\nPhase 6 isolated v2 fixture.",
			sources: [],
			generatedAt: new Date("2026-09-18T00:00:00.000Z"),
			payloadHash: fixtureHash("security-news"),
		},
		{
			schemaVersion: 2,
			reportType: "long-category-navigation-fixture",
			reportDate: "2026-09-19",
			title: "Phase 6.5 Long Category Layout Fixture",
			contentMarkdown: [
				"用於驗證第三個以上分類、長標籤與 sticky header。",
				"",
				"## First validation section",
				"",
				"Desktop category grid and navigation rail.",
				"",
				"| Check | Result |",
				"| --- | --- |",
				"| Dynamic category | Pass |",
				"| Long label | Pass |",
				"",
				"## Second validation section",
				"",
				"Mobile overflow and active state.",
				"",
				"```ts",
				"const fixture = true;",
				"```",
				"",
				"## Third validation section",
				"",
				"Sticky header and TOC anchor positioning.",
			].join("\n"),
			sources: [{
				title: "Phase 6.5 Fixture Source",
				url: "https://example.com/phase-6-5",
			}],
			generatedAt: new Date("2026-09-19T00:00:00.000Z"),
			payloadHash: fixtureHash("long-category-navigation-fixture"),
		},
		{
			schemaVersion: 2,
			reportType: "phase6-hidden-category",
			reportDate: "2026-09-19",
			title: "Phase 6.5 Hidden Category Fixture",
			contentMarkdown: "# Hidden fixture",
			sources: [],
			generatedAt: new Date("2026-09-19T00:10:00.000Z"),
			payloadHash: fixtureHash("phase6-hidden-category"),
		},
	];

	await db.insert(reports).values(fixtureReports.map((report) => ({
		...report,
		...analyzeReportMarkdown(report.contentMarkdown, report.title),
	})));
}
