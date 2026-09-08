import { createHash, timingSafeEqual } from "node:crypto";

import type { ReportIngestInput } from "@/schemas/report";

export function hashReportPayload(payload: ReportIngestInput) {
	return createHash("sha256")
		.update(JSON.stringify(payload), "utf8")
		.digest("hex");
}

export function getTaipeiReportDate(generatedAt: string) {
	const date = new Date(generatedAt);
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Taipei",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parts.find((part) => part.type === "day")?.value;

	if (!year || !month || !day) {
		throw new Error("Unable to derive report date.");
	}

	return `${year}-${month}-${day}`;
}

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
