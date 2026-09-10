import { expect, test } from "@playwright/test";

const CLIENT_JS_BUDGET_BYTES = 1024 * 1024;
const ROUTES = [
	"/",
	"/news",
	"/reports/2026-09-09-daily-news",
];

test("cold public routes stay within the production client JavaScript budget", async ({ browser }) => {
	for (const route of ROUTES) {
		const context = await browser.newContext();
		const page = await context.newPage();
		const scripts = new Map<string, number>();
		const pending: Promise<void>[] = [];

		page.on("response", (response) => {
			const url = new URL(response.url());
			if (response.request().resourceType() !== "script" || !url.pathname.startsWith("/_next/static/chunks/")) return;
			pending.push((async () => {
				try {
					const body = await response.body();
					scripts.set(url.pathname, body.byteLength);
				} catch {
					// A failed body read is ignored here; route/navigation failures are asserted separately.
				}
			})());
		});

		const response = await page.goto(route, { waitUntil: "networkidle" });
		expect(response?.ok(), `${route} should load successfully in production mode`).toBe(true);
		await Promise.all(pending);

		const totalBytes = [...scripts.values()].reduce((sum, bytes) => sum + bytes, 0);
		console.log(`[client-js] ${route}: ${totalBytes} bytes across ${scripts.size} chunks`);
		expect(totalBytes, `${route} client JavaScript should stay below 1 MiB uncompressed`).toBeLessThanOrEqual(CLIENT_JS_BUDGET_BYTES);
		await context.close();
	}
});
