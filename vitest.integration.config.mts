import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["tests/integration/**/*.test.ts"],
		hookTimeout: 90_000,
		passWithNoTests: false,
		testTimeout: 90_000,
	},
});
