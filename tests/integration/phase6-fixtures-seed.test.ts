import { expect, test } from "vitest";

import {
	configureFixtureDatabase,
	seedPhase6Fixtures,
} from "./phase6-fixtures";

test("seed canonical Phase 6 fixtures", { timeout: 60_000 }, async () => {
	configureFixtureDatabase();
	await seedPhase6Fixtures();
	expect(true).toBe(true);
});
