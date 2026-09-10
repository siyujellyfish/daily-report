import { defineConfig, devices } from "@playwright/test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
	throw new Error("TEST_DATABASE_URL is required for production-mode performance checks.");
}
if (process.env.DATABASE_URL && process.env.DATABASE_URL === testDatabaseUrl) {
	throw new Error("Refusing to run performance checks when TEST_DATABASE_URL matches DATABASE_URL.");
}

export default defineConfig({
	testDir: "./tests/e2e-performance",
	fullyParallel: false,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: "http://127.0.0.1:3102",
		trace: "retain-on-failure",
	},
	webServer: {
		command: "pnpm start --hostname 127.0.0.1 --port 3102",
		url: "http://127.0.0.1:3102/robots.txt",
		reuseExistingServer: false,
		env: {
			...process.env,
			DATABASE_URL: testDatabaseUrl,
		},
	},
	projects: [
		{
			name: "chromium-production-budget",
			use: {
				...devices["Desktop Chrome"],
			},
		},
	],
});
