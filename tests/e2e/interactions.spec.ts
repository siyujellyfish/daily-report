import { expect, test } from "@playwright/test";

const LONG_CATEGORY_LABEL = "這是一個用於驗證超長分類標籤在桌面與行動版導覽列水平捲動時仍能維持版面穩定的自適應分類驗收項目";

test("theme preference persists after reload", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("combobox", { name: "外觀主題" }).selectOption("dark");
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await expect(page.getByRole("combobox", { name: "外觀主題" })).toHaveValue("dark");
});

test("mobile category rail stays visible and navigates without a menu", async ({ page }, testInfo) => {
	test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only interaction.");
	await page.goto("/");
	const rail = page.getByRole("navigation", { name: "報告分類" });
	await expect(rail).toBeVisible();
	await expect(page.getByRole("button", { name: "選單" })).toHaveCount(0);
	await expect(rail.getByRole("link", { name: LONG_CATEGORY_LABEL, exact: true })).toBeVisible();
	await rail.getByRole("link", { name: "資安情報", exact: true }).click();
	await expect(page).toHaveURL(/\/category\/security-news$/);
	await expect(rail.getByRole("link", { name: "資安情報", exact: true })).toHaveAttribute("aria-current", "page");
});

test("dynamic report detail marks its category active in the rail", async ({ page }) => {
	await page.goto("/reports/2026-09-19-long-category-navigation-fixture");
	const rail = page.getByRole("navigation", { name: "報告分類" });
	await expect(rail.getByRole("link", { name: LONG_CATEGORY_LABEL, exact: true })).toHaveAttribute("aria-current", "page");
});

test("mobile table of contents opens and links to a heading", async ({ page }, testInfo) => {
	test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only interaction.");
	await page.goto("/reports/2026-09-19-long-category-navigation-fixture");
	await page.getByText("本文目錄", { exact: true }).first().click();
	const toc = page.locator(".mobile-toc");
	await expect(toc).toHaveAttribute("open", "");
	await toc.getByRole("link", { name: "Second validation section" }).click();
	await expect(page).toHaveURL(/#report-section-2$/);
});

test("code copy reports success", async ({ page, context }) => {
	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	await page.goto("/reports/2026-09-19-long-category-navigation-fixture");
	await page.getByRole("button", { name: "複製程式碼" }).click();
	await expect(page.getByRole("status")).toHaveText("程式碼已複製");
});

test("code copy fallback selects code when clipboard fails", async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: {
				writeText: () => Promise.reject(new Error("clipboard unavailable")),
			},
		});
	});
	await page.goto("/reports/2026-09-19-long-category-navigation-fixture");
	await page.getByRole("button", { name: "複製程式碼" }).click();
	await expect(page.getByRole("status")).toContainText("Ctrl+C");
	const selected = await page.evaluate(() => window.getSelection()?.toString() ?? "");
	expect(selected).toContain("const fixture = true;");
});

test("keyboard focus is visible on the skip link", async ({ page }) => {
	await page.goto("/");
	await page.keyboard.press("Tab");
	const skip = page.getByRole("link", { name: "跳至主要內容" });
	await expect(skip).toBeFocused();
	await expect(skip).toBeVisible();
});
