import { expect, test } from "@playwright/test";

const LONG_CATEGORY_LABEL = "這是一個用於驗證超長分類標籤在桌面與行動版導覽列水平捲動時仍能維持版面穩定的自適應分類驗收項目";
const LONG_REPORT_PATH = "/reports/2026-09-19-long-category-navigation-fixture";

function redirectLocation(response: { headers(): Record<string, string> }) {
	const value = response.headers().location;
	if (!value) throw new Error("Redirect response is missing Location.");
	const url = new URL(value, "http://phase6.local");
	return `${url.pathname}${url.search}`;
}

test("legacy archive routes emit HTTP 308 and preserve valid pagination", async ({ request }) => {
	let response = await request.get("/news", { maxRedirects: 0 });
	expect(response.status()).toBe(308);
	expect(redirectLocation(response)).toBe("/category/daily-news");

	response = await request.get("/frameworks", { maxRedirects: 0 });
	expect(response.status()).toBe(308);
	expect(redirectLocation(response)).toBe("/category/framework-recommendation");

	response = await request.get("/news?page=2", { maxRedirects: 0 });
	expect(response.status()).toBe(308);
	expect(redirectLocation(response)).toBe("/category/daily-news?page=2");

	response = await request.get("/frameworks?page=2", { maxRedirects: 0 });
	expect(response.status()).toBe(308);
	expect(redirectLocation(response)).toBe("/category/framework-recommendation?page=2");

	response = await request.get("/news?page=0", { maxRedirects: 0 });
	expect(response.status()).toBe(404);
});

test("published category rail and homepage adapt to four categories", async ({ page }, testInfo) => {
	await page.goto("/");

	const rail = page.getByRole("navigation", { name: "報告分類" });
	await expect(rail).toBeVisible();
	await expect(rail.getByRole("link")).toHaveCount(4);
	await expect(rail.getByRole("link", { name: "資訊新聞", exact: true })).toBeVisible();
	await expect(rail.getByRole("link", { name: "框架工具", exact: true })).toBeVisible();
	await expect(rail.getByRole("link", { name: "資安情報", exact: true })).toBeVisible();
	await expect(rail.getByRole("link", { name: LONG_CATEGORY_LABEL, exact: true })).toBeVisible();
	await expect(rail.getByText("空分類驗收")).toHaveCount(0);
	await expect(rail.getByText("隱藏分類驗收")).toHaveCount(0);

	const cards = page.locator(".featured-grid > .feature");
	await expect(cards).toHaveCount(4);

	const securityCard = cards.filter({ hasText: "資安情報" });
	await expect(securityCard).toHaveClass(/tone-(violet|amber|rose|cyan)/);
	await expect(securityCard).not.toHaveClass(/tone-blue/);
	await expect(securityCard).not.toHaveClass(/tone-teal/);

	const layout = await page.evaluate(() => {
		const grid = document.querySelector<HTMLElement>(".featured-grid");
		const rail = document.querySelector<HTMLElement>(".category-rail");
		if (!grid || !rail) throw new Error("Adaptive layout elements are missing.");
		return {
			documentWidth: document.documentElement.scrollWidth,
			viewportWidth: document.documentElement.clientWidth,
			gridColumns: getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
			railOverflowX: getComputedStyle(rail).overflowX,
			railScrollWidth: rail.scrollWidth,
			railClientWidth: rail.clientWidth,
		};
	});

	expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 2);
	expect(["auto", "scroll"]).toContain(layout.railOverflowX);
	if (testInfo.project.name.includes("mobile")) {
		expect(layout.gridColumns).toBe(1);
		expect(layout.railScrollWidth).toBeGreaterThan(layout.railClientWidth);
	} else {
		expect(layout.gridColumns).toBeGreaterThanOrEqual(3);
	}
});

test("dynamic category metadata and sitemap use canonical published routes only", async ({ page, request }) => {
	await page.goto("/category/security-news");
	await expect(page).toHaveTitle(/資安情報/);
	await expect(page.locator('meta[name="description"]')).toHaveAttribute(
		"content",
		"每日資安事件、漏洞與威脅情報整理。",
	);

	const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
	expect(new URL(canonical!).pathname).toBe("/category/security-news");

	const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
	expect(new URL(ogUrl!).pathname).toBe("/category/security-news");

	const response = await request.get("/sitemap.xml");
	expect(response.status()).toBe(200);
	const sitemap = await response.text();

	for (const path of [
		"/category/daily-news",
		"/category/framework-recommendation",
		"/category/security-news",
		"/category/long-category-navigation-fixture",
		"/reports/2026-09-18-security-news",
		LONG_REPORT_PATH,
	]) {
		expect(sitemap).toContain(path);
	}

	expect(sitemap).not.toContain("/category/phase6-empty-category");
	expect(sitemap).not.toContain("/category/phase6-hidden-category");
	expect(sitemap).not.toContain("/reports/2026-09-19-phase6-hidden-category");
	expect(sitemap).not.toMatch(/<loc>[^<]*\/news<\/loc>/);
	expect(sitemap).not.toMatch(/<loc>[^<]*\/frameworks<\/loc>/);
});

test("active category follows both archive and report detail routes", async ({ page }) => {
	await page.goto("/category/security-news");
	let rail = page.getByRole("navigation", { name: "報告分類" });
	await expect(rail.getByRole("link", { name: "資安情報", exact: true })).toHaveAttribute("aria-current", "page");

	await page.goto("/reports/2026-09-18-security-news");
	rail = page.getByRole("navigation", { name: "報告分類" });
	await expect(rail.getByRole("link", { name: "資安情報", exact: true })).toHaveAttribute("aria-current", "page");
});

test("sticky header offset keeps TOC and source anchors visible", async ({ page }, testInfo) => {
	await page.goto(LONG_REPORT_PATH);

	const target = page.locator("#report-section-2");
	if (testInfo.project.name.includes("mobile")) {
		const mobileToc = page.locator(".mobile-toc");
		await mobileToc.locator("summary").click();
		await mobileToc.getByRole("link", { name: "Second validation section" }).click();
	} else {
		await page.locator(".toc:not(.mobile-toc)").getByRole("link", { name: "Second validation section" }).click();
	}
	await expect(page).toHaveURL(/#report-section-2$/);

	await expect.poll(async () => {
		const [headerBox, targetBox] = await Promise.all([
			page.locator(".topbar").boundingBox(),
			target.boundingBox(),
		]);
		if (!headerBox || !targetBox) return -999;
		return targetBox.y - (headerBox.y + headerBox.height);
	}).toBeGreaterThanOrEqual(-2);

	await page.evaluate(() => {
		window.location.hash = "report-sources";
	});
	await expect(page).toHaveURL(/#report-sources$/);
	await expect.poll(async () => {
		const [headerBox, sourceBox] = await Promise.all([
			page.locator(".topbar").boundingBox(),
			page.locator("#report-sources").boundingBox(),
		]);
		if (!headerBox || !sourceBox) return -999;
		return sourceBox.y - (headerBox.y + headerBox.height);
	}).toBeGreaterThanOrEqual(-2);
});
