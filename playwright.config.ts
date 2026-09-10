import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!externalBaseUrl && !testDatabaseUrl) {
	throw new Error("Set PLAYWRIGHT_BASE_URL or TEST_DATABASE_URL before running Playwright.");
}

if (!externalBaseUrl && process.env.DATABASE_URL && process.env.DATABASE_URL === testDatabaseUrl) {
	throw new Error("Refusing to run Playwright when TEST_DATABASE_URL matches DATABASE_URL.");
}

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: externalBaseUrl ?? "http://127.0.0.1:3100",
		trace: "retain-on-failure",
	},
	webServer: externalBaseUrl ? undefined : {
		command: "pnpm dev --hostname 127.0.0.1 --port 3100",
		url: "http://127.0.0.1:3100",
		reuseExistingServer: !process.env.CI,
		env: {
			...process.env,
			DATABASE_URL: testDatabaseUrl!,
		},
	},
	projects: [
		{
			name: "chromium-desktop",
			use: {
				...devices["Desktop Chrome"],
			},
		},
		{
			name: "chromium-mobile",
			use: {
				...devices["Pixel 7"],
			},
		},
	],
});
