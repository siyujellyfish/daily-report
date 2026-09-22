import process from "node:process";

import { neon } from "@neondatabase/serverless";

import { analyzeReportMarkdown } from "../src/lib/report-markdown.ts";

function buildPresentationUpdates(rows) {
	if (!Array.isArray(rows)) {
		throw new TypeError("Expected a JSON array of report rows.");
	}

	return rows.map((row) => {
		if (
			typeof row?.id !== "string"
			|| typeof row?.title !== "string"
			|| typeof row?.content_markdown !== "string"
		) {
			throw new TypeError("Each row must include id, title, and content_markdown strings.");
		}

		return {
			id: row.id,
			...analyzeReportMarkdown(row.content_markdown, row.title),
		};
	});
}

async function readStandardInput() {
	let input = "";
	for await (const chunk of process.stdin) input += chunk;
	return input;
}

async function transformOnly() {
	const input = await readStandardInput();
	process.stdout.write(JSON.stringify(buildPresentationUpdates(JSON.parse(input))));
}

async function applyBackfill() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error("DATABASE_URL is required with --apply.");

	const sql = neon(databaseUrl);
	const rows = await sql`
		SELECT id::text, title, content_markdown
		FROM reports
		WHERE summary IS NULL
			OR reading_minutes IS NULL
			OR headings IS NULL
		ORDER BY report_date, report_type
	`;
	const updates = buildPresentationUpdates(rows);

	if (updates.length > 0) {
		await sql.transaction(updates.map((update) => sql`
			UPDATE reports
			SET summary = ${update.summary},
				reading_minutes = ${update.readingMinutes},
				headings = ${JSON.stringify(update.headings)}::jsonb
			WHERE id = ${update.id}::uuid
		`));
	}

	const [verification] = await sql`
		SELECT
			count(*)::int AS total,
			count(*) FILTER (
				WHERE summary IS NULL
					OR reading_minutes IS NULL
					OR headings IS NULL
			)::int AS missing
		FROM reports
	`;

	process.stdout.write(`${JSON.stringify({
		updated: updates.length,
		total: verification.total,
		missing: verification.missing,
	})}\n`);
}

const mode = process.argv[2];
if (mode === "--transform-only") {
	await transformOnly();
} else if (mode === "--apply") {
	await applyBackfill();
} else {
	throw new Error("Use --transform-only or --apply.");
}
