import { describe, expect, it } from "vitest";
import { classifyMakeDelivery, decidePublicationFollowUp } from "../../src/lib/publication-retry";

const reportType = "framework-recommendation";

describe("P1 Make delivery classification", () => {
  it("requires exact acknowledgement", () => {
    expect(classifyMakeDelivery({ httpStatus: 200, success: true, receivedType: reportType }, reportType)).toBe("acknowledged");
    expect(classifyMakeDelivery({ httpStatus: 200, success: true, receivedType: "daily-news" }, reportType)).toBe("terminal");
    expect(classifyMakeDelivery({ httpStatus: 200, success: false }, reportType)).toBe("ambiguous");
  });
  it("separates permanent, transient and race responses", () => {
    for (const httpStatus of [400, 401, 403, 404, 415, 422]) {
      expect(classifyMakeDelivery({ httpStatus }, reportType)).toBe("terminal");
    }
    for (const httpStatus of [408, 425, 429, 500, 502, 503, 504]) {
      expect(classifyMakeDelivery({ httpStatus }, reportType)).toBe("transient");
    }
    expect(classifyMakeDelivery({ httpStatus: 409 }, reportType)).toBe("conflict");
    expect(classifyMakeDelivery({}, reportType)).toBe("ambiguous");
  });
  it("does not trust success when HTTP failed", () => {
    expect(classifyMakeDelivery({ httpStatus: 503, success: true, receivedType: reportType }, reportType)).toBe("transient");
  });
});

describe("P1 bounded retry decision", () => {
  const decide = (
    delivery: Parameters<typeof decidePublicationFollowUp>[0]["delivery"],
    presence: Parameters<typeof decidePublicationFollowUp>[0]["presence"],
    attemptsMade = 1,
    statusChecksMade = 1,
  ) => decidePublicationFollowUp({ delivery, presence, attemptsMade, statusChecksMade });

  it("confirms persisted presence even after ambiguous transport or 409", () => {
    expect(decide("ambiguous", "present")).toBe("confirmed");
    expect(decide("conflict", "present")).toBe("confirmed");
  });
  it("never sends on unknown status", () => {
    expect(decide("transient", "unknown")).toBe("retry-status");
    expect(decide("transient", "unknown", 2, 3)).toBe("status-unknown");
  });
  it("retries at most twice only after confirmed missing status", () => {
    expect(decide("transient", "missing", 1)).toBe("retry-same-payload");
    expect(decide("ambiguous", "missing", 2)).toBe("retry-same-payload");
    expect(decide("transient", "missing", 3)).toBe("failed");
  });
  it("does not retry permanent failure or conflict", () => {
    expect(decide("terminal", "missing")).toBe("failed");
    expect(decide("conflict", "missing")).toBe("failed");
  });
  it("rechecks persistence after acknowledgement without resending", () => {
    expect(decide("acknowledged", "missing")).toBe("retry-status");
    expect(decide("acknowledged", "missing", 1, 3)).toBe("failed");
  });
});
