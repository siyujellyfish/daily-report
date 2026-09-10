import { expect, test } from "@playwright/test";

test("database read failure renders the retryable error state", async ({ page }) => {
	const response = await page.goto("/");
	expect(response?.status()).toBe(500);
	const errorState = page.locator("section[role='alert']");
	await expect(errorState).toBeVisible();
	await expect(errorState.getByRole("heading", { level: 1, name: "暫時無法載入報告" })).toBeVisible();
	await expect(errorState.getByText("請稍後重試，或返回首頁瀏覽。")).toBeVisible();
	const retry = errorState.getByRole("button", { name: "重新載入" });
	await expect(retry).toBeVisible();
	await expect(errorState.getByRole("link", { name: "返回首頁" })).toHaveAttribute("href", "/");
	await retry.click();
	await expect(errorState.getByRole("heading", { level: 1, name: "暫時無法載入報告" })).toBeVisible();
});
