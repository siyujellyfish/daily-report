import { expect, test } from "vitest";

import {
	cleanupPhase6Fixtures,
	configureFixtureDatabase,
} from "./phase6-fixtures";

test("remove canonical Phase 6 fixtures", { timeout: 60_000 }, async () => {
	configureFixtureDatabase();
	await cleanupPhase6Fixtures();
	expect(true).toBe(true);
});
