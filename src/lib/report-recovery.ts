/**
 * Recovery is deliberately scoped to the two daily report types.
 * Weekly and ad-hoc categories are not automatically regenerated.
 */
export const RECOVERY_REPORT_TYPES = [
  "daily-news",
  "framework-recommendation",
] as const;

export type RecoveryReportType = (typeof RECOVERY_REPORT_TYPES)[number];

export function isRecoveryReportType(value: string | null): value is RecoveryReportType {
  return value === "daily-news" || value === "framework-recommendation";
}

export function isValidReportDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export type RecoveryDecision = "skip" | "recover" | "retry-status";

export function decideRecovery(
  status: { published: boolean; reportType: string; reportDate: string } | null,
  expected: { reportType: RecoveryReportType; reportDate: string },
): RecoveryDecision {
  if (!status || status.reportType !== expected.reportType || status.reportDate !== expected.reportDate) {
    return "retry-status";
  }
  return status.published ? "skip" : "recover";
}
