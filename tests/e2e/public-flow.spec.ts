import { expect, test } from "@playwright/test";

test("homepage links to the newest report for every published category", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1, name: "掌握新知，保持好奇。" })).toBeVisible();
	await expect(page.getByRole("link", { name: "開發技術每日追蹤｜2026-09-18", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "每日突破性工具推薦｜ARTEMIS", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 6 v2 Security Fixture", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 6.5 Long Category Layout Fixture", exact: true })).toBeVisible();
});

test("legacy news archive redirects to the canonical category", async ({ page }) => {
	await page.goto("/news");
	await expect(page).toHaveURL(/\/category\/daily-news$/);
	await expect(page.getByText("共 9 篇報告")).toBeVisible();
	const newestReport = page.getByRole("link", { name: "開發技術每日追蹤｜2026-09-18", exact: true });
	await expect(newestReport).toBeVisible();
	await expect(newestReport).toHaveClass(/archive-item/);
	await expect(page.getByRole("navigation", { name: "報告列表分頁" })).toHaveCount(0);
	await newestReport.click({ position: { x: 12, y: 12 } });
	await expect(page).toHaveURL(/\/reports\/2026-09-18-daily-news$/);
});

test("legacy framework archive redirects to the canonical filtered category", async ({ page }) => {
	await page.goto("/frameworks");
	await expect(page).toHaveURL(/\/category\/framework-recommendation$/);
	await expect(page.getByText("共 10 篇報告")).toBeVisible();
	await expect(page.getByRole("link", { name: "每日突破性工具推薦｜ARTEMIS", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "開發技術每日追蹤｜2026-09-18", exact: true })).toHaveCount(0);
});

test("dynamic report detail renders Markdown, TOC and structured sources", async ({ page }) => {
	await page.goto("/reports/2026-09-19-long-category-navigation-fixture");
	await expect(page.getByRole("heading", { level: 1, name: "Phase 6.5 Long Category Layout Fixture" })).toBeVisible();
	await expect(page.locator("#report-section-1")).toHaveText("First validation section");
	await expect(page.locator("#report-section-2")).toHaveText("Second validation section");
	await expect(page.locator("#report-section-3")).toHaveText("Third validation section");
	await expect(page.getByRole("table")).toBeVisible();
	await expect(page.getByRole("region", { name: "表格，可橫向捲動" })).toBeVisible();
	await expect(page.getByRole("button", { name: "複製程式碼" })).toBeVisible();

	const source = page.getByRole("link", { name: /Phase 6.5 Fixture Source/ });
	await expect(source).toHaveAttribute("href", "https://example.com/phase-6-5");
	await expect(source).toHaveAttribute("target", "_blank");
	await expect(source).toHaveAttribute("rel", "noopener noreferrer");
});

test("invalid, empty, hidden and missing categories or reports return 404", async ({ page }) => {
	let response = await page.goto("/reports/2026-02-30-daily-news");
	expect(response?.status()).toBe(404);

	response = await page.goto("/reports/2026-01-01-daily-news");
	expect(response?.status()).toBe(404);

	response = await page.goto("/category/not-published");
	expect(response?.status()).toBe(404);

	response = await page.goto("/category/phase6-empty-category");
	expect(response?.status()).toBe(404);

	response = await page.goto("/category/phase6-hidden-category");
	expect(response?.status()).toBe(404);

	response = await page.goto("/category/Invalid-Slug");
	expect(response?.status()).toBe(404);

	response = await page.goto("/news?page=0");
	expect(response?.status()).toBe(404);
});


test("homepage latest reports stay in one horizontal desktop row", async ({ page }, testInfo) => {
	test.skip(testInfo.project.name.includes("mobile"), "Desktop/tablet horizontal report rail only.");
	await page.goto("/");
	const viewport = page.locator(".featured-scroll-viewport");
	await expect(viewport).toBeVisible();
	const state = await page.evaluate(() => {
		const viewport = document.querySelector<HTMLElement>(".featured-scroll-viewport");
		const cards = [...document.querySelectorAll<HTMLElement>(".featured-grid > .feature")];
		if (!viewport) throw new Error("Featured report Scroll Area is missing.");
		return {
			scrollWidth: viewport.scrollWidth,
			clientWidth: viewport.clientWidth,
			tops: cards.map((card) => Math.round(card.getBoundingClientRect().top)),
		};
	});
	expect(new Set(state.tops).size).toBe(1);
	expect(state.scrollWidth).toBeGreaterThan(state.clientWidth);
});
