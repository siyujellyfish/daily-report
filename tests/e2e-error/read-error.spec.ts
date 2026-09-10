import { expect, test } from "@playwright/test";

test("database read failure renders the retryable error state", async ({ page }) => {
	const response = await page.goto("/");
	expect(response?.status()).toBe(500);
	await expect(page.getByRole("alert")).toBeVisible();
	await expect(page.getByRole("heading", { level: 1, name: "暫時無法載入報告" })).toBeVisible();
	await expect(page.getByText("請稍後重試，或返回首頁瀏覽。")).toBeVisible();
	const retry = page.getByRole("button", { name: "重新載入" });
	await expect(retry).toBeVisible();
	await expect(page.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
	await retry.click();
	await expect(page.getByRole("heading", { level: 1, name: "暫時無法載入報告" })).toBeVisible();
});
