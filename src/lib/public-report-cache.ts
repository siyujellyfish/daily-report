import "server-only";

import { cacheLife, cacheTag, revalidateTag } from "next/cache";

export const PUBLIC_REPORTS_CACHE_TAG = "public-reports";

export function configurePublicReportsCache() {
	cacheLife({
		stale: 300,
		revalidate: 3600,
		expire: 86400,
	});
	cacheTag(PUBLIC_REPORTS_CACHE_TAG);
}

export function revalidatePublicReportsCache() {
	revalidateTag(PUBLIC_REPORTS_CACHE_TAG, { expire: 0 });
}
