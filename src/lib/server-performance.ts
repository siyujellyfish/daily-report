import "server-only";

type PerformanceDetails = Record<string, boolean | number | string | null | undefined>;

function elapsedMilliseconds(startedAt: bigint) {
	return Number(process.hrtime.bigint() - startedAt) / 1_000_000;
}

export async function measureServerOperation<T>(
	operation: string,
	run: () => Promise<T>,
	details?: (result: T) => PerformanceDetails,
) {
	const startedAt = process.hrtime.bigint();

	try {
		const result = await run();
		console.info(JSON.stringify({
			event: "server_timing",
			operation,
			durationMs: Number(elapsedMilliseconds(startedAt).toFixed(2)),
			status: "ok",
			...details?.(result),
		}));
		return result;
	} catch (error) {
		console.error(JSON.stringify({
			event: "server_timing",
			operation,
			durationMs: Number(elapsedMilliseconds(startedAt).toFixed(2)),
			status: "error",
			errorName: error instanceof Error ? error.name : "UnknownError",
			errorMessage: error instanceof Error ? error.message : String(error),
		}));
		throw error;
	}
}
