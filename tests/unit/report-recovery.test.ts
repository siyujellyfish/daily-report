import { describe, expect, it } from "vitest";

import { decideRecovery, isRecoveryReportType, isValidReportDate } from "../../src/lib/report-recovery";

const expected = { reportType: "framework-recommendation" as const, reportDate: "2026-10-09" };

describe("P0 recovery decision", () => {
  it("skips a published report", () => {
    expect(decideRecovery({ ...expected, published: true }, expected)).toBe("skip");
  });
  it("recovers a missing report", () => {
    expect(decideRecovery({ ...expected, published: false }, expected)).toBe("recover");
  });
  it("never treats an unavailable or mismatched status as missing", () => {
    expect(decideRecovery(null, expected)).toBe("retry-status");
    expect(decideRecovery({ ...expected, reportDate: "2026-10-08", published: false }, expected)).toBe("retry-status");
    expect(decideRecovery({ ...expected, reportType: "daily-news", published: false }, expected)).toBe("retry-status");
  });
  it("accepts only the two daily report types", () => {
    expect(isRecoveryReportType("daily-news")).toBe(true);
    expect(isRecoveryReportType("framework-recommendation")).toBe(true);
    expect(isRecoveryReportType("app-store-limited-free")).toBe(false);
    expect(isRecoveryReportType(null)).toBe(false);
  });
  it("validates real ISO calendar dates", () => {
    expect(isValidReportDate("2026-10-09")).toBe(true);
    expect(isValidReportDate("2026-02-29")).toBe(false);
    expect(isValidReportDate("2024-02-29")).toBe(true);
    expect(isValidReportDate("2026-13-01")).toBe(false);
    expect(isValidReportDate("2026-1-9")).toBe(false);
  });
});
