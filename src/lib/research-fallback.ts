/** P1 deterministic eligibility policy; research and verification remain in ChatGPT Tasks. */
export interface FrameworkCandidate {
  name: string;
  verifiedPrimarySource: boolean;
  previouslyRecommended: boolean | "unknown";
  breakthrough: boolean;
  fastGrowingRepresentative: boolean;
}
export function chooseFrameworkCandidate<T extends FrameworkCandidate>(candidates: readonly T[]): T | null {
  const eligible = candidates.filter((candidate) =>
    candidate.name.trim().length > 0 &&
    candidate.verifiedPrimarySource &&
    candidate.previouslyRecommended === false
  );
  return eligible.find((candidate) => candidate.breakthrough) ??
    eligible.find((candidate) => candidate.fastGrowingRepresentative) ??
    null;
}
export type ResearchCategoryState = "verified-update" | "verified-no-update" | "unavailable";
export type DailyNewsDecision = "publish-updates" | "publish-no-result" | "research-unknown";
/** An inaccessible source/category cannot be misrepresented as proof of no news. */
export function decideDailyNewsResearch(states: readonly ResearchCategoryState[]): DailyNewsDecision {
  if (states.includes("verified-update")) return "publish-updates";
  if (states.length === 0 || states.includes("unavailable")) return "research-unknown";
  return "publish-no-result";
}
