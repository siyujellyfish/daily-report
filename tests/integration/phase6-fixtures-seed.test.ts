import { expect, test } from "vitest";

import {
	configureFixtureDatabase,
	seedPhase6Fixtures,
} from "./phase6-fixtures";

test("seed canonical Phase 6 fixtures", async () => {
	configureFixtureDatabase();
	await seedPhase6Fixtures();
	expect(true).toBe(true);
});
