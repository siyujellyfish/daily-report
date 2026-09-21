const PHASE67_PREVIEW_BRANCH = "phase6.7/ui-ux";
const PHASE67_PREVIEW_DATABASE_HOST =
	"ep-calm-glitter-b3no93rk.c-4.ap-southeast-1.aws.neon.tech";

export function resolveDatabaseUrl(
	databaseUrl: string,
	vercelEnvironment = process.env.VERCEL_ENV,
	gitRef = process.env.VERCEL_GIT_COMMIT_REF,
) {
	if (
		vercelEnvironment !== "preview"
		|| gitRef !== PHASE67_PREVIEW_BRANCH
	) {
		return databaseUrl;
	}

	const url = new URL(databaseUrl);
	url.hostname = PHASE67_PREVIEW_DATABASE_HOST;
	return url.toString();
}
