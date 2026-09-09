import type { ReportHeading } from "@/lib/report-markdown";

function TocLinks({ headings }: { headings: ReportHeading[] }) {
	return <>{headings.map((heading) => <a key={heading.id} href={`#${heading.id}`} className={heading.depth === 3 ? "toc-nested" : undefined}>{heading.text}</a>)}<a href="#report-sources">參考來源</a></>;
}

export function ReportToc({ headings, mobile = false }: { headings: ReportHeading[]; mobile?: boolean }) {
	if (headings.length < 3) return null;
	if (mobile) return <details className="mobile-toc"><summary>本文目錄</summary><nav aria-label="本文目錄"><TocLinks headings={headings} /></nav></details>;
	return <aside className="toc"><nav aria-label="本文目錄"><strong>本文目錄</strong><TocLinks headings={headings} /></nav></aside>;
}
