import { describe, expect, it } from "vitest";
import { chooseFrameworkCandidate, decideDailyNewsResearch } from "../../src/lib/research-fallback";

describe("P1 research fallback policy", () => {
  it("replaces duplicate and unverified framework candidates", () => {
    const candidates = [
      { name: "Repeat", verifiedPrimarySource: true, previouslyRecommended: true, breakthrough: true, fastGrowingRepresentative: false },
      { name: "Unverified", verifiedPrimarySource: false, previouslyRecommended: false, breakthrough: true, fastGrowingRepresentative: false },
      { name: "Eligible", verifiedPrimarySource: true, previouslyRecommended: false, breakthrough: true, fastGrowingRepresentative: false },
    ] as const;
    expect(chooseFrameworkCandidate(candidates)?.name).toBe("Eligible");
  });
  it("uses a verified growing representative when no breakthrough candidate qualifies", () => {
    expect(chooseFrameworkCandidate([
      { name: "Representative", verifiedPrimarySource: true, previouslyRecommended: false, breakthrough: false, fastGrowingRepresentative: true },
    ])?.name).toBe("Representative");
  });
  it("fails closed on uncertain historical deduplication or source verification", () => {
    expect(chooseFrameworkCandidate([
      { name: "Unknown", verifiedPrimarySource: true, previouslyRecommended: "unknown", breakthrough: true, fastGrowingRepresentative: true },
    ])).toBeNull();
    expect(chooseFrameworkCandidate([])).toBeNull();
  });
  it("does not misreport research outages as no news", () => {
    expect(decideDailyNewsResearch(["verified-no-update", "unavailable"])).toBe("research-unknown");
    expect(decideDailyNewsResearch([])).toBe("research-unknown");
    expect(decideDailyNewsResearch(["verified-no-update", "verified-no-update"])).toBe("publish-no-result");
  });
  it("preserves verified updates even when another category is unavailable", () => {
    expect(decideDailyNewsResearch(["unavailable", "verified-update"])).toBe("publish-updates");
  });
});
