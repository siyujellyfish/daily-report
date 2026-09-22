import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { reportCategories, reports } from "@/db/schema";
import { revalidatePublicReportsCache } from "@/lib/public-report-cache";
import { analyzeReportMarkdown } from "@/lib/report-markdown";
import {
	getTaipeiReportDate,
	hashReportPayload,
	isAuthorizedBearer,
} from "@/lib/report-payload";
import type { ReportType } from "@/lib/report-types";
import { reportIngestSchema } from "@/schemas/report";

export async function POST(request: Request) {
	const requestStartedAt = process.hrtime.bigint();
	let databaseStartedAt: bigint | null = null;
	const duration = (startedAt: bigint) => (
		Number(process.hrtime.bigint() - startedAt) / 1_000_000
	).toFixed(2);
	const respond = (body: unknown, status = 200) => {
		const timings = [`app;dur=${duration(requestStartedAt)}`];
		if (databaseStartedAt !== null) {
			timings.push(`db;dur=${duration(databaseStartedAt)}`);
		}
		return NextResponse.json(body, {
			status,
			headers: { "Server-Timing": timings.join(", ") },
		});
	};
	const ingestSecret = process.env.INGEST_SECRET;

	if (!ingestSecret) {
		return respond(
			{ error: "Ingest endpoint is not configured." },
			503,
		);
	}

	if (!isAuthorizedBearer(request.headers.get("authorization"), ingestSecret)) {
		return respond({ error: "Unauthorized." }, 401);
	}

	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.toLowerCase().includes("application/json")) {
		return respond(
			{ error: "Content-Type must be application/json." },
			415,
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return respond({ error: "Invalid JSON body." }, 400);
	}

	const parsed = reportIngestSchema.safeParse(body);
	if (!parsed.success) {
		return respond(
			{
				error: "Invalid report payload.",
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				})),
			},
			400,
		);
	}

	if (!process.env.DATABASE_URL) {
		return respond(
			{ error: "Database is not configured." },
			503,
		);
	}

	const payload = parsed.data;
	const payloadHash = hashReportPayload(payload);
	const reportDate = getTaipeiReportDate(payload.generatedAt);

	try {
		databaseStartedAt = process.hrtime.bigint();
		const db = getDb();
		const storedReportType = payload.reportType as ReportType;
		const presentation = analyzeReportMarkdown(payload.contentMarkdown, payload.title);
		const reportValues = {
			schemaVersion: payload.schemaVersion,
			reportType: storedReportType,
			reportDate,
			title: payload.title,
			contentMarkdown: payload.contentMarkdown,
			summary: presentation.summary,
			readingMinutes: presentation.readingMinutes,
			headings: presentation.headings,
			sources: payload.sources,
			generatedAt: new Date(payload.generatedAt),
			payloadHash,
		};

		let categoryCreated = false;
		let categoryMetadataMismatch = false;
		let created:
			| { id: string; reportType: ReportType; reportDate: string }
			| undefined;

		if (payload.schemaVersion === 2) {
			const [createdCategories, canonicalCategories, createdReports] = await db.batch([
				db
					.insert(reportCategories)
					.values({
						slug: payload.reportType,
						label: payload.categoryLabel,
						description: payload.categoryDescription,
					})
					.onConflictDoNothing()
					.returning({ slug: reportCategories.slug }),
				db
					.select({
						slug: reportCategories.slug,
						label: reportCategories.label,
						description: reportCategories.description,
					})
					.from(reportCategories)
					.where(eq(reportCategories.slug, payload.reportType))
					.limit(1),
				db
					.insert(reports)
					.values(reportValues)
					.onConflictDoNothing()
					.returning({
						id: reports.id,
						reportType: reports.reportType,
						reportDate: reports.reportDate,
					}),
			]);

			categoryCreated = createdCategories.length > 0;
			const canonicalCategory = canonicalCategories[0];
			created = createdReports[0];

			if (!canonicalCategory) {
				throw new Error("Category could not be created or resolved.");
			}

			categoryMetadataMismatch =
				canonicalCategory.label !== payload.categoryLabel ||
				canonicalCategory.description !== payload.categoryDescription;
		} else {
			[created] = await db
				.insert(reports)
				.values(reportValues)
				.onConflictDoNothing()
				.returning({
					id: reports.id,
					reportType: reports.reportType,
					reportDate: reports.reportDate,
				});
		}

		const category = payload.schemaVersion === 2
			? {
				category: {
					slug: payload.reportType,
					created: categoryCreated,
					metadataMismatch: categoryMetadataMismatch,
				},
			}
			: {};

		if (created) {
			try {
				revalidatePublicReportsCache();
			} catch (error) {
				// Persistence already succeeded. A cache-control failure must not turn
				// the delivery into a retry that can no longer enter the created path.
				console.error("Failed to revalidate public report caches.", error);
			}

			return respond(
				{
					data: created,
					duplicate: false,
					...category,
				},
				201,
			);
		}

		const [samePayload] = await db
			.select({
				id: reports.id,
				reportType: reports.reportType,
				reportDate: reports.reportDate,
			})
			.from(reports)
			.where(eq(reports.payloadHash, payloadHash))
			.limit(1);

		if (samePayload) {
			return respond({
				data: samePayload,
				duplicate: true,
				...category,
			});
		}

		const [sameReportSlot] = await db
			.select({ id: reports.id })
			.from(reports)
			.where(
				and(
					eq(reports.reportType, storedReportType),
					eq(reports.reportDate, reportDate),
				),
			)
			.limit(1);

		if (sameReportSlot) {
			return respond(
				{
					error: "A different report already exists for this type and date.",
					reportId: sameReportSlot.id,
				},
				409,
			);
		}

		return respond(
			{ error: "Report could not be inserted because of a uniqueness conflict." },
			409,
		);
	} catch (error) {
		console.error("Failed to ingest report.", error);
		return respond(
			{ error: "Failed to persist report." },
			500,
		);
	}
}
