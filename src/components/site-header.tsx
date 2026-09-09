import Link from "next/link";
import { SiteNavigation } from "./site-navigation";

export function SiteHeader() {
	return <header className="topbar"><div className="wrap header">
		<Link className="brand" href="/" aria-label="Daily Report 首頁"><span className="brand-icon" aria-hidden="true">dr.</span><span><strong>Daily Report</strong><small>每日推播</small></span></Link>
		<SiteNavigation />
	</div></header>;
}
