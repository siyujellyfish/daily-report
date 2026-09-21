import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const INTEGRATION_SECRET = "phase6-integration-secret";
const INGEST_CATEGORY = "phase6-ingest-validation";
const V1_REPORT_DATE = "2000-01-02";
const V2_REPORT_DATE = "2000-01-03";
const V2_MISMATCH_DATE = "2000-01-04";

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
			["daily-news", "2026-09-18"],
			["framework-recommendation", "2026-09-18"],
			["security-news", "2026-09-18"],
			["long-category-navigation-fixture", "2026-09-19"],
		]);
	});

	it("paginates a canonical category deterministically", async () => {
		const result = await reportsModule.getReportsByCategory("daily-news", 1);
		expect(result).not.toBeNull();
		expect(result?.total).toBe(9);
		expect(result?.pageCount).toBe(1);
		expect(result?.reports).toHaveLength(9);
		expect(result?.reports[0]?.reportDate).toBe("2026-09-18");
		expect(result?.reports.at(-1)?.reportDate).toBe("2026-09-10");
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
		const payload = {
			schemaVersion: 1,
			reportType: "daily-news",
			title: "Phase 6.5 v1 ingest fixture",
			generatedAt: "2000-01-02T08:00:00+08:00",
			contentMarkdown: "Phase 6.5 v1 integration.",
			sources: [],
		};

		let response = await ingestPost(ingestRequest(payload));
		expect(response.status).toBe(201);
		expect((await response.json()).duplicate).toBe(false);

		response = await ingestPost(ingestRequest(payload));
		expect(response.status).toBe(200);
		expect((await response.json()).duplicate).toBe(true);

		response = await ingestPost(ingestRequest({
			...payload,
			title: "Phase 6.5 v1 collision",
		}));
		expect(response.status).toBe(409);
	});

	it("creates a v2 category atomically, preserves canonical metadata and rejects same-slot collision", async () => {
		const payload = {
			schemaVersion: 2,
			reportType: INGEST_CATEGORY,
			categoryLabel: "Phase 6 Ingest Validation",
			categoryDescription: "Canonical isolated integration metadata.",
			title: "Phase 6.5 v2 ingest fixture",
			generatedAt: "2000-01-03T08:00:00+08:00",
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

		response = await ingestPost(ingestRequest({
			...payload,
			categoryLabel: "Attempted Rename",
			categoryDescription: "This must not replace canonical metadata.",
			title: "Phase 6.5 v2 mismatch fixture",
			generatedAt: "2000-01-04T08:00:00+08:00",
		}));
		expect(response.status).toBe(201);
		expect(await response.json()).toMatchObject({
			category: {
				slug: INGEST_CATEGORY,
				created: false,
				metadataMismatch: true,
			},
		});

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
	});

	it("rejects unauthorized and presentation-control v2 requests before persistence", async () => {
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

		response = await ingestPost(ingestRequest({
			...payload,
			style: "arbitrary-css",
		}));
		expect(response.status).toBe(400);
	});
});
