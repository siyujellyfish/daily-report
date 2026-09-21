import { describe, expect, it } from "vitest";

import {
	CATEGORY_TONES,
	getCategoryTone,
	isCategorySlug,
	presentCategory,
} from "../../src/lib/report-types";

describe("category presentation", () => {
	it("validates safe category slugs", () => {
		expect(isCategorySlug("security-news")).toBe(true);
		expect(isCategorySlug("ai-agent")).toBe(true);
		expect(isCategorySlug("Security-News")).toBe(false);
		expect(isCategorySlug("security_news")).toBe(false);
		expect(isCategorySlug("a".repeat(81))).toBe(false);
	});

	it("preserves legacy category tones and canonical routes", () => {
		expect(getCategoryTone("daily-news")).toBe("blue");
		expect(getCategoryTone("framework-recommendation")).toBe("teal");

		expect(presentCategory({
			slug: "daily-news",
			label: "資訊新聞",
			description: "Daily.",
		})).toMatchObject({
			title: "每日資訊新聞",
			href: "/category/daily-news",
			tone: "blue",
			style: "tone-blue",
		});
	});

	it("maps future categories to a deterministic app-owned palette", () => {
		const first = getCategoryTone("security-news");
		const second = getCategoryTone("security-news");
		expect(first).toBe(second);
		expect(CATEGORY_TONES).toContain(first);
		expect(["blue", "teal"]).not.toContain(first);

		expect(presentCategory({
			slug: "security-news",
			label: "資安情報",
			description: "Security.",
		})).toMatchObject({
			title: "資安情報",
			href: "/category/security-news",
			issue: "CATEGORY BRIEF",
			icon: "◇",
			tone: first,
			style: `tone-${first}`,
		});
	});
});
