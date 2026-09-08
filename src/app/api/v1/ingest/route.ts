import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { reports } from "@/db/schema";
import {
	getTaipeiReportDate,
	hashReportPayload,
	isAuthorizedBearer,
} from "@/lib/report-payload";
import { reportIngestSchema } from "@/schemas/report";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const ingestSecret = process.env.INGEST_SECRET;

	if (!ingestSecret) {
		return NextResponse.json(
			{ error: "Ingest endpoint is not configured." },
			{ status: 503 },
		);
	}

	if (!isAuthorizedBearer(request.headers.get("authorization"), ingestSecret)) {
		return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
	}

	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.toLowerCase().includes("application/json")) {
		return NextResponse.json(
			{ error: "Content-Type must be application/json." },
			{ status: 415 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	const parsed = reportIngestSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{
				error: "Invalid report payload.",
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				})),
			},
			{ status: 400 },
		);
	}

	if (!process.env.DATABASE_URL) {
		return NextResponse.json(
			{ error: "Database is not configured." },
			{ status: 503 },
		);
	}

	const payload = parsed.data;
	const payloadHash = hashReportPayload(payload);
	const reportDate = getTaipeiReportDate(payload.generatedAt);

	try {
		const db = getDb();
		const [created] = await db
			.insert(reports)
			.values({
				schemaVersion: payload.schemaVersion,
				reportType: payload.reportType,
				reportDate,
				title: payload.title,
				contentMarkdown: payload.contentMarkdown,
				sources: payload.sources,
				generatedAt: new Date(payload.generatedAt),
				payloadHash,
			})
			.onConflictDoNothing()
			.returning({
				id: reports.id,
				reportType: reports.reportType,
				reportDate: reports.reportDate,
			});

		if (created) {
			return NextResponse.json(
				{
					data: created,
					duplicate: false,
				},
				{ status: 201 },
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
			return NextResponse.json({ data: samePayload, duplicate: true });
		}

		const [sameReportSlot] = await db
			.select({ id: reports.id })
			.from(reports)
			.where(
				and(
					eq(reports.reportType, payload.reportType),
					eq(reports.reportDate, reportDate),
				),
			)
			.limit(1);

		if (sameReportSlot) {
			return NextResponse.json(
				{
					error: "A different report already exists for this type and date.",
					reportId: sameReportSlot.id,
				},
				{ status: 409 },
			);
		}

		return NextResponse.json(
			{ error: "Report could not be inserted because of a uniqueness conflict." },
			{ status: 409 },
		);
	} catch (error) {
		console.error("Failed to ingest report.", error);
		return NextResponse.json(
			{ error: "Failed to persist report." },
			{ status: 500 },
		);
	}
}
