import { getReportSlug } from "./report-date";
import {
	analyzeReportMarkdown,
	safeSourceUrl,
	type ReportHeading,
} from "./report-markdown";

export type ReportPresentationRecord = {
	summary: string;
	readingMinutes: number;
	headings: ReportHeading[];
};

export type ReportSummaryRecord = ReportPresentationRecord & {
	reportType: string;
	reportDate: string;
	title: string;
};

export type ReportRecord = {
	reportType: string;
	reportDate: string;
	title: string;
	contentMarkdown: string;
	summary?: string | null;
	readingMinutes?: number | null;
	headings?: ReportHeading[] | null;
	sources: { title: string; url: string }[];
	generatedAt: Date;
};

export function presentReportSummary(record: ReportSummaryRecord) {
	return {
		...record,
		slug: getReportSlug(record.reportDate, record.reportType),
	};
}

export function presentReport(record: ReportRecord) {
	const presentation = record.summary !== null && record.summary !== undefined
		&& record.readingMinutes !== null && record.readingMinutes !== undefined
		&& record.headings !== null && record.headings !== undefined
		? {
			summary: record.summary,
			readingMinutes: record.readingMinutes,
			headings: record.headings,
		}
		: analyzeReportMarkdown(record.contentMarkdown, record.title);

	return {
		...record,
		...presentation,
		generatedAt: record.generatedAt.toISOString(),
		slug: getReportSlug(record.reportDate, record.reportType),
		sources: record.sources.flatMap((source) => {
			const url = safeSourceUrl(source.url);
			return url ? [{ title: source.title, url, hostname: new URL(url).hostname }] : [];
		}),
	};
}

export type PublicReport = ReturnType<typeof presentReport>;
export type PublicReportSummary = ReturnType<typeof presentReportSummary>;
