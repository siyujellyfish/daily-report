import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const nextCache = vi.hoisted(() => ({
	cacheLife: vi.fn(),
	cacheTag: vi.fn(),
	revalidateTag: vi.fn(),
}));
vi.mock("next/cache", () => nextCache);

const INTEGRATION_SECRET = "phase6-integration-secret";
const RUN_TOKEN = (process.env.GITHUB_RUN_ID ?? `local-${process.pid}`)
	.toLowerCase()
	.replace(/[^a-z0-9-]/g, "-")
	.slice(-32);
const INGEST_CATEGORY = `phase6-ingest-${RUN_TOKEN}`;

function runScopedDate(offset: number) {
	const digits = RUN_TOKEN.replace(/\D/g, "");
	const seed = Number.parseInt(digits.slice(-8), 10) || process.pid;
	const date = new Date(Date.UTC(2000, 0, 1 + ((seed * 3 + offset) % 9000)));
	return date.toISOString().slice(0, 10);
}

const V1_REPORT_DATE = runScopedDate(0);
const V2_REPORT_DATE = runScopedDate(1);
const V2_MISMATCH_DATE = runScopedDate(2);

type ReportsModule = typeof import("../../src/lib/reports");
type DbModule = typeof import("../../src/db");
type IngestRouteModule = typeof import("../../src/app/api/v1/ingest/route");

let reportsModule: ReportsModule;
let db: ReturnType<DbModule["getDb"]>;
let ingestPost: IngestRouteModule["POST"];
let previousIngestSecret: string | undefined;

async function cleanupIngestFixtures() {
	const { and, eq, or } = await import("drizzle-orm");
	const { reportCategories, reports } = await import("../../src/db/schema");

	await db.delete(reports).where(or(
		eq(reports.reportType, INGEST_CATEGORY),
		and(
			eq(reports.reportType, "daily-news"),
			eq(reports.reportDate, V1_REPORT_DATE),
		),
	));
	await db.delete(reportCategories).where(eq(reportCategories.slug, INGEST_CATEGORY));
}

function ingestRequest(payload: unknown, token = INTEGRATION_SECRET) {
	return new Request("http://localhost/api/v1/ingest", {
		method: "POST",
		headers: {
			authorization: `Bearer ${token}`,
			"content-type": "application/json",
		},
		body: JSON.stringify(payload),
	});
}

beforeAll(async () => {
	const testDatabaseUrl = process.env.TEST_DATABASE_URL;
	if (!testDatabaseUrl) {
		throw new Error("TEST_DATABASE_URL is required for isolated DB integration tests.");
	}
	if (process.env.DATABASE_URL && process.env.DATABASE_URL === testDatabaseUrl) {
		throw new Error("Refusing to run integration tests when TEST_DATABASE_URL matches DATABASE_URL.");
	}

	process.env.DATABASE_URL = testDatabaseUrl;
	previousIngestSecret = process.env.INGEST_SECRET;
	process.env.INGEST_SECRET = INTEGRATION_SECRET;

	const dbModule = await import("../../src/db");
	db = dbModule.getDb();
	await cleanupIngestFixtures();

	reportsModule = await import("../../src/lib/reports");
	({ POST: ingestPost } = await import("../../src/app/api/v1/ingest/route"));
});

afterAll(async () => {
	await cleanupIngestFixtures();
	if (previousIngestSecret === undefined) {
		delete process.env.INGEST_SECRET;
	} else {
		process.env.INGEST_SECRET = previousIngestSecret;
	}
});

describe("Phase 6 isolated category reads", () => {
	it("proves TEST_DATABASE_URL points at the canonical Phase 6 fixture branch", async () => {
		const categories = await reportsModule.getPublishedCategories();
		expect(categories.map((category) => category.slug)).toEqual([
			"daily-news",
			"framework-recommendation",
			"security-news",
			"long-category-navigation-fixture",
		]);
	});

	it("excludes visible-empty and hidden-published categories", async () => {
		const categories = await reportsModule.getPublishedCategories();
		const slugs = categories.map((category) => category.slug);

		expect(slugs).not.toContain("phase6-empty-category");
		expect(slugs).not.toContain("phase6-hidden-category");
		expect(await reportsModule.getPublishedCategory("phase6-empty-category")).toBeNull();
		expect(await reportsModule.getPublishedCategory("phase6-hidden-category")).toBeNull();
		expect(await reportsModule.getPublishedCategory("Not-Safe")).toBeNull();
	});

	it("returns one newest report per published category in category order", async () => {
		const items = await reportsModule.getLatestPublishedReports();
		expect(items.map(({ category, report }) => [
			category.slug,
			report.reportDate,
		])).toEqual([
			["daily-news", "2099-01-01"],
			["framework-recommendation", "2099-01-01"],
			["security-news", "2026-09-18"],
			["long-category-navigation-fixture", "2026-09-19"],
		]);
	});

	it("paginates a canonical category deterministically", async () => {
		const result = await reportsModule.getReportsByCategory("daily-news", 1);
		expect(result).not.toBeNull();
		expect(result?.total).toBeGreaterThanOrEqual(1);
		expect(result?.pageCount).toBeGreaterThanOrEqual(1);
		expect(result?.reports.length).toBeGreaterThanOrEqual(1);
		expect(result?.reports[0]?.reportDate).toBe("2099-01-01");
		expect(result?.reports[0]?.title).toBe("Phase 6 Fixture Daily News");
	});

	it("reads a dynamic category detail with headings, source and persisted category metadata", async () => {
		const report = await reportsModule.getReportBySlug("2026-09-19-long-category-navigation-fixture");
		expect(report?.title).toBe("Phase 6.5 Long Category Layout Fixture");
		expect(report?.category.slug).toBe("long-category-navigation-fixture");
		expect(report?.category.label).toContain("超長分類標籤");
		expect(report?.headings).toEqual([
			{ id: "report-section-1", text: "First validation section", depth: 2 },
			{ id: "report-section-2", text: "Second validation section", depth: 2 },
			{ id: "report-section-3", text: "Third validation section", depth: 2 },
		]);
		expect(report?.sources).toEqual([
			{
				title: "Phase 6.5 Fixture Source",
				url: "https://example.com/phase-6-5",
				hostname: "example.com",
			},
		]);
	});

	it("returns null for missing valid report", async () => {
		expect(await reportsModule.getReportBySlug("2026-01-01-security-news")).toBeNull();
	});
});

describe("Phase 6 isolated ingest compatibility", () => {
	it("keeps v1 create, exact retry and same-slot collision semantics", async () => {
		nextCache.revalidateTag.mockClear();
		const payload = {
			schemaVersion: 1,
			reportType: "daily-news",
			title: "Phase 6.5 v1 ingest fixture",
			generatedAt: `${V1_REPORT_DATE}T08:00:00+08:00`,
			contentMarkdown: "Phase 6.5 v1 integration.",
			sources: [],
		};

		let response = await ingestPost(ingestRequest(payload));
		expect(response.status).toBe(201);
		expect((await response.json()).duplicate).toBe(false);
		expect(response.headers.get("server-timing")).toMatch(/app;dur=.*db;dur=/);
		expect(nextCache.revalidateTag).toHaveBeenCalledOnce();
		expect(nextCache.revalidateTag).toHaveBeenCalledWith(
			"public-reports",
			{ expire: 0 },
		);

		const { and, eq } = await import("drizzle-orm");
		const { reports } = await import("../../src/db/schema");
		const [stored] = await db
			.select({
				summary: reports.summary,
				readingMinutes: reports.readingMinutes,
				headings: reports.headings,
			})
			.from(reports)
			.where(and(
				eq(reports.reportType, "daily-news"),
				eq(reports.reportDate, V1_REPORT_DATE),
			))
			.limit(1);
		expect(stored).toEqual({
			summary: "Phase 6.5 v1 integration.",
			readingMinutes: 1,
			headings: [],
		});

		response = await ingestPost(ingestRequest(payload));
		expect(response.status).toBe(200);
		expect((await response.json()).duplicate).toBe(true);
		expect(nextCache.revalidateTag).toHaveBeenCalledTimes(1);

		response = await ingestPost(ingestRequest({
			...payload,
			title: "Phase 6.5 v1 collision",
		}));
		expect(response.status).toBe(409);
		expect(nextCache.revalidateTag).toHaveBeenCalledTimes(1);
	});

	it("creates a v2 category atomically, preserves canonical metadata and rejects same-slot collision", async () => {
		nextCache.revalidateTag.mockClear();
		const payload = {
			schemaVersion: 2,
			reportType: INGEST_CATEGORY,
			categoryLabel: "Phase 6 Ingest Validation",
			categoryDescription: "Canonical isolated integration metadata.",
			title: "Phase 6.5 v2 ingest fixture",
			generatedAt: `${V2_REPORT_DATE}T08:00:00+08:00`,
			contentMarkdown: "Phase 6.5 v2 integration.",
			sources: [],
		};

		let response = await ingestPost(ingestRequest(payload));
		expect(response.status).toBe(201);
		expect(await response.json()).toMatchObject({
			duplicate: false,
			category: {
				slug: INGEST_CATEGORY,
				created: true,
				metadataMismatch: false,
			},
		});
		expect(nextCache.revalidateTag).toHaveBeenCalledTimes(1);

		response = await ingestPost(ingestRequest(payload));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			duplicate: true,
			category: {
				slug: INGEST_CATEGORY,
				created: false,
				metadataMismatch: false,
			},
		});
		expect(nextCache.revalidateTag).toHaveBeenCalledTimes(1);

		response = await ingestPost(ingestRequest({
			...payload,
			categoryLabel: "Attempted Rename",
			categoryDescription: "This must not replace canonical metadata.",
			title: "Phase 6.5 v2 mismatch fixture",
			generatedAt: `${V2_MISMATCH_DATE}T08:00:00+08:00`,
		}));
		expect(response.status).toBe(201);
		expect(await response.json()).toMatchObject({
			category: {
				slug: INGEST_CATEGORY,
				created: false,
				metadataMismatch: true,
			},
		});
		expect(nextCache.revalidateTag).toHaveBeenCalledTimes(2);

		const { eq } = await import("drizzle-orm");
		const { reportCategories } = await import("../../src/db/schema");
		const [canonical] = await db
			.select({
				label: reportCategories.label,
				description: reportCategories.description,
			})
			.from(reportCategories)
			.where(eq(reportCategories.slug, INGEST_CATEGORY))
			.limit(1);
		expect(canonical).toEqual({
			label: "Phase 6 Ingest Validation",
			description: "Canonical isolated integration metadata.",
		});

		response = await ingestPost(ingestRequest({
			...payload,
			title: "Phase 6.5 v2 collision",
		}));
		expect(response.status).toBe(409);
		expect(nextCache.revalidateTag).toHaveBeenCalledTimes(2);
	});

	it("rejects unauthorized and presentation-control v2 requests before persistence", async () => {
		nextCache.revalidateTag.mockClear();
		const payload = {
			schemaVersion: 2,
			reportType: INGEST_CATEGORY,
			categoryLabel: "Phase 6 Ingest Validation",
			categoryDescription: "Canonical isolated integration metadata.",
			title: "Rejected fixture",
			generatedAt: "2000-01-05T08:00:00+08:00",
			contentMarkdown: "Rejected.",
			sources: [],
		};

		let response = await ingestPost(ingestRequest(payload, "wrong-secret"));
		expect(response.status).toBe(401);
		expect(response.headers.get("server-timing")).toMatch(/^app;dur=/);

		response = await ingestPost(ingestRequest({
			...payload,
			style: "arbitrary-css",
		}));
		expect(response.status).toBe(400);
		expect(nextCache.revalidateTag).not.toHaveBeenCalled();
	});
});
