import { expect, test } from "vitest";

import {
	cleanupPhase6Fixtures,
	configureFixtureDatabase,
} from "./phase6-fixtures";

test("remove canonical Phase 6 fixtures", async () => {
	configureFixtureDatabase();
	await cleanupPhase6Fixtures();
	expect(true).toBe(true);
});
