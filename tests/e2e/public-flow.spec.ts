import { expect, test } from "@playwright/test";

test("homepage links to the newest reports", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1, name: "掌握新知，保持好奇。" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 3 Daily News 09" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 3 Framework Fixture" })).toBeVisible();
});

test("daily-news archive paginates newest first", async ({ page }) => {
	await page.goto("/news");
	await expect(page.getByText("共 13 篇報告")).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 3 Daily News 09", exact: true })).toBeVisible();
	await expect(page.getByRole("navigation", { name: "報告列表分頁" })).toBeVisible();

	await page.getByRole("link", { name: "下一頁" }).click();
	await expect(page).toHaveURL(/\/news\?page=2$/);
	await expect(page.getByText("第 2 / 2 頁")).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 3 Daily News 28", exact: true })).toBeVisible();
});

test("framework archive is filtered correctly", async ({ page }) => {
	await page.goto("/frameworks");
	await expect(page.getByText("共 2 篇報告")).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 3 Framework Fixture", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "P1 End-to-End Test", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Phase 3 Daily News 09", exact: true })).toHaveCount(0);
});

test("report detail renders Markdown, TOC and structured sources", async ({ page }) => {
	await page.goto("/reports/2026-09-09-daily-news");
	await expect(page.getByRole("heading", { level: 1, name: "Phase 3 Daily News 09" })).toBeVisible();
	await expect(page.locator("#report-section-1")).toHaveText("Alpha");
	await expect(page.locator("#report-section-2")).toHaveText("Beta");
	await expect(page.locator("#report-section-3")).toHaveText("Alpha");
	await expect(page.getByRole("table")).toBeVisible();
	await expect(page.getByRole("region", { name: "表格，可橫向捲動" })).toBeVisible();
	await expect(page.getByRole("button", { name: "複製程式碼" })).toBeVisible();

	const source = page.getByRole("link", { name: /Example Docs/ });
	await expect(source).toHaveAttribute("href", "https://example.com/docs");
	await expect(source).toHaveAttribute("target", "_blank");
	await expect(source).toHaveAttribute("rel", "noopener noreferrer");
});

test("invalid and missing reports return 404", async ({ page }) => {
	let response = await page.goto("/reports/2026-02-30-daily-news");
	expect(response?.status()).toBe(404);

	response = await page.goto("/reports/2026-01-01-daily-news");
	expect(response?.status()).toBe(404);

	response = await page.goto("/news?page=0");
	expect(response?.status()).toBe(404);
});
