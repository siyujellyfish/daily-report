import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e-error",
	fullyParallel: false,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: "http://127.0.0.1:3101",
		trace: "retain-on-failure",
	},
	webServer: {
		command: "pnpm dev --hostname 127.0.0.1 --port 3101",
		url: "http://127.0.0.1:3101/robots.txt",
		reuseExistingServer: false,
		env: {
			...process.env,
			DATABASE_URL: "",
		},
	},
	projects: [
		{
			name: "chromium-read-error",
			use: {
				...devices["Desktop Chrome"],
			},
		},
	],
});
