import Link from "next/link";

import { getPublishedCategories } from "@/lib/reports";
import { SiteNavigation } from "./site-navigation";

export async function SiteHeader() {
	let categories: Awaited<ReturnType<typeof getPublishedCategories>> = [];
	try {
		categories = await getPublishedCategories();
	} catch (error) {
		console.error("Failed to load header categories.", error);
	}

	return <header className="topbar">
		<div className="wrap header">
			<Link className="brand" href="/" aria-label="Daily Report 首頁">
				<span className="brand-icon" aria-hidden="true">dr.</span>
				<span><strong>Daily Report</strong><small>每日推播</small></span>
			</Link>
			<SiteNavigation categories={categories.map(({ slug, label, href }) => ({
				slug,
				label,
				href,
			}))} />
		</div>
	</header>;
}
