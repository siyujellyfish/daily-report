import type { ReportType } from "./report-types";

export const REPORT_TIME_ZONE = "Asia/Taipei";

export function getTaipeiReportDate(generatedAt: string | Date) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: REPORT_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date(generatedAt));
	const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
	return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isReportDate(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function formatReportDate(value: string) {
	return value.replaceAll("-", ".");
}

export function formatGeneratedAt(value: string) {
	return new Intl.DateTimeFormat("zh-TW", {
		timeZone: REPORT_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).format(new Date(value));
}

export function getReportSlug(date: string, type: ReportType) {
	return `${date}-${type}`;
}

export function parseReportSlug(slug: string): { date: string; type: ReportType } | null {
	const match = /^(\d{4}-\d{2}-\d{2})-(daily-news|framework-recommendation)$/.exec(slug);
	if (!match || !isReportDate(match[1])) return null;
	return { date: match[1], type: match[2] as ReportType };
}

export const REPORT_PAGE_SIZE = 10;

export function parseReportPage(value: string | string[] | undefined) {
	if (value === undefined) return 1;
	if (typeof value !== "string" || !/^[1-9]\d{0,6}$/.test(value)) return null;
	return Number(value);
}
