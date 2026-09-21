import { expect, test } from "@playwright/test";

test("homepage links to the newest report for every published category", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1, name: "掌握新知，保持好奇。" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 6 Fixture Daily News", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 6 Fixture Framework", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 6 v2 Security Fixture", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 6.5 Long Category Layout Fixture", exact: true })).toBeVisible();
});

test("legacy news archive redirects to the canonical category", async ({ page }) => {
	await page.goto("/news");
	await expect(page).toHaveURL(/\/category\/daily-news$/);
	await expect(page.getByText(/共 \d+ 篇報告/)).toBeVisible();
	const newestReport = page.getByRole("link", { name: "Phase 6 Fixture Daily News", exact: true });
	await expect(newestReport).toBeVisible();
	await expect(newestReport).toHaveClass(/archive-item/);
	await expect(page.getByRole("navigation", { name: "報告列表分頁" })).toHaveCount(0);
	await newestReport.click({ position: { x: 12, y: 12 } });
	await expect(page).toHaveURL(/\/reports\/2099-01-01-daily-news$/);
});

test("legacy framework archive redirects to the canonical filtered category", async ({ page }) => {
	await page.goto("/frameworks");
	await expect(page).toHaveURL(/\/category\/framework-recommendation$/);
	await expect(page.getByText(/共 \d+ 篇報告/)).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 6 Fixture Framework", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 6 Fixture Daily News", exact: true })).toHaveCount(0);
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


test("homepage desktop report carousel stays on one row and advances with arrow controls", async ({ page }, testInfo) => {
	test.skip(testInfo.project.name.includes("mobile"), "Desktop/tablet report carousel only.");
	await page.goto("/");
	const viewport = page.locator(".featured-scroll-viewport");
	const previous = page.getByRole("button", { name: "上一則報告" });
	const next = page.getByRole("button", { name: "下一則報告" });

	await expect(viewport).toBeVisible();
	await expect(previous).toBeVisible();
	await expect(next).toBeVisible();
	await expect(previous).toBeDisabled();
	await expect(next).toBeEnabled();

	const initial = await page.evaluate(() => {
		const viewport = document.querySelector<HTMLElement>(".featured-scroll-viewport");
		const cards = [...document.querySelectorAll<HTMLElement>(".featured-grid > .feature")];
		if (!viewport) throw new Error("Featured report Scroll Area is missing.");
		return {
			scrollWidth: viewport.scrollWidth,
			clientWidth: viewport.clientWidth,
			tops: cards.map((card) => Math.round(card.getBoundingClientRect().top)),
		};
	});
	expect(new Set(initial.tops).size).toBe(1);
	expect(initial.scrollWidth).toBeGreaterThan(initial.clientWidth);

	await next.click();
	await expect.poll(async () => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
	await expect(previous).toBeEnabled();
	await expect(next).toBeDisabled();
});
