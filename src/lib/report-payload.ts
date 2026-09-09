import { createHash, timingSafeEqual } from "node:crypto";

import type { ReportIngestInput } from "@/schemas/report";

export function hashReportPayload(payload: ReportIngestInput) {
	return createHash("sha256")
		.update(JSON.stringify(payload), "utf8")
		.digest("hex");
}

export { getTaipeiReportDate } from "./report-date";

export function isAuthorizedBearer(
	authorizationHeader: string | null,
	secret: string,
) {
	if (!authorizationHeader) {
		return false;
	}

	const actual = Buffer.from(authorizationHeader, "utf8");
	const expected = Buffer.from(`Bearer ${secret}`, "utf8");

	if (actual.length !== expected.length) {
		return false;
	}

	return timingSafeEqual(actual, expected);
}
