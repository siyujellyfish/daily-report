import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { getTaipeiReportDate } from "@/lib/report-date";
import { isRecoveryReportType, isValidReportDate } from "@/lib/report-recovery";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/**
 * Read-only publication presence probe for the two daily schedules.
 * Only the already-public fact of a report's existence is returned.
 * No report body, DB identifiers, credentials, or internal error details.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const reportType = params.get("reportType");
  const reportDate = params.get("reportDate") ?? getTaipeiReportDate(new Date().toISOString());

  if (!isRecoveryReportType(reportType) || !isValidReportDate(reportDate)) {
    return respond({ error: "Invalid reportType or reportDate." }, 400);
  }

  if (!process.env.DATABASE_URL) {
    return respond({ error: "Publication status temporarily unavailable." }, 503);
  }

  try {
    const rows = await getDb()
      .select({ id: reports.id })
      .from(reports)
      .where(and(eq(reports.reportType, reportType), eq(reports.reportDate, reportDate)))
      .limit(1);

    return respond({
      reportType,
      reportDate,
      published: rows.length > 0,
    });
  } catch (error) {
    console.error("Publication status query failed.", error);
    return respond({ error: "Publication status temporarily unavailable." }, 503);
  }
}
