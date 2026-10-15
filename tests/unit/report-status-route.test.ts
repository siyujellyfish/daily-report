import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [] as Array<{ id: string }>,
  fail: false,
}));

vi.mock("../../src/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            if (mocks.fail) throw new Error("DB unavailable");
            return mocks.rows;
          },
        }),
      }),
    }),
  }),
}));

import { GET } from "../../src/app/api/v1/reports/status/route";

function request(query: string) {
  return new Request("https://example.test/api/v1/reports/status?" + query);
}

describe("P0 publication status endpoint", () => {
  beforeEach(() => {
    mocks.rows = [];
    mocks.fail = false;
    process.env.DATABASE_URL = "postgresql://unit-test-placeholder";
  });

  it("reports a missing daily report without exposing data", async () => {
    const response = await GET(request("reportType=framework-recommendation&reportDate=2026-10-09"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({
      reportType: "framework-recommendation",
      reportDate: "2026-10-09",
      published: false,
    });
  });

  it("reports a published daily report", async () => {
    mocks.rows = [{ id: "internal-id" }];
    const response = await GET(request("reportType=daily-news&reportDate=2026-10-09"));
    expect(await response.json()).toEqual({
      reportType: "daily-news",
      reportDate: "2026-10-09",
      published: true,
    });
  });

  it("rejects unsupported categories and invalid dates", async () => {
    expect((await GET(request("reportType=app-store-limited-free&reportDate=2026-10-09"))).status).toBe(400);
    expect((await GET(request("reportType=daily-news&reportDate=2026-02-30"))).status).toBe(400);
  });

  it("does not misreport DB failures as missing", async () => {
    mocks.fail = true;
    const response = await GET(request("reportType=daily-news&reportDate=2026-10-09"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Publication status temporarily unavailable." });
  });

  it("does not query when DB configuration is missing", async () => {
    delete process.env.DATABASE_URL;
    const response = await GET(request("reportType=daily-news&reportDate=2026-10-09"));
    expect(response.status).toBe(503);
  });
});
