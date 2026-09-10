import { getReportSlug } from "./report-date";
import { analyzeReportMarkdown, safeSourceUrl } from "./report-markdown";
import type { ReportType } from "./report-types";

export type ReportRecord = {
	reportType: ReportType;
	reportDate: string;
	title: string;
	contentMarkdown: string;
	sources: { title: string; url: string }[];
	generatedAt: Date;
};

export function presentReport(record: ReportRecord) {
	return {
		...record,
		generatedAt: record.generatedAt.toISOString(),
		slug: getReportSlug(record.reportDate, record.reportType),
		...analyzeReportMarkdown(record.contentMarkdown, record.title),
		sources: record.sources.flatMap((source) => {
			const url = safeSourceUrl(source.url);
			return url ? [{ title: source.title, url, hostname: new URL(url).hostname }] : [];
		}),
	};
}

export type PublicReport = ReturnType<typeof presentReport>;
