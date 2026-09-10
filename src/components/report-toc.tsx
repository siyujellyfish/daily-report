import type { ReportHeading } from "@/lib/report-markdown";

function TocLinks({ headings }: { headings: ReportHeading[] }) {
	const totals = new Map<string, number>();
	for (const heading of headings) totals.set(heading.text, (totals.get(heading.text) ?? 0) + 1);
	const seen = new Map<string, number>();
	return <>{headings.map((heading) => {
		const occurrence = (seen.get(heading.text) ?? 0) + 1;
		seen.set(heading.text, occurrence);
		const total = totals.get(heading.text) ?? 1;
		const ariaLabel = total > 1 ? `${heading.text}（同名章節 ${occurrence} / ${total}）` : undefined;
		return <a key={heading.id} href={`#${heading.id}`} className={heading.depth === 3 ? "toc-nested" : undefined} aria-label={ariaLabel}>{heading.text}</a>;
	})}<a href="#report-sources">參考來源</a></>;
}

export function ReportToc({ headings, mobile = false }: { headings: ReportHeading[]; mobile?: boolean }) {
	if (headings.length < 3) return null;
	if (mobile) return <details className="mobile-toc"><summary>本文目錄</summary><nav aria-label="本文目錄"><TocLinks headings={headings} /></nav></details>;
	return <aside className="toc"><nav aria-label="本文目錄"><strong>本文目錄</strong><TocLinks headings={headings} /></nav></aside>;
}
