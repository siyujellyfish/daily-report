import "server-only";

import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkReportHeadings, safeSourceUrl } from "@/lib/report-markdown";
import { CodeBlock } from "./code-block";

function textContent(children: ReactNode): string {
	return Children.toArray(children).map((child) => {
		if (typeof child === "string" || typeof child === "number") return String(child);
		if (isValidElement<{ children?: ReactNode }>(child)) return textContent(child.props.children);
		return "";
	}).join("");
}

export function ReportMarkdown({ content, title }: { content: string; title: string }) {
	return <div className="prose"><ReactMarkdown
		skipHtml
		remarkPlugins={[remarkGfm, [remarkReportHeadings, { title }]]}
		remarkRehypeOptions={{ footnoteLabel: "註解", footnoteBackLabel: "返回參照" }}
		components={{
			a: ({ children, href, title: linkTitle, id, ...props }) => {
				const external = href ? safeSourceUrl(href) : null;
				return <a href={href} title={linkTitle} id={id} aria-label={props["aria-label"]} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children}{external && <span className="sr-only">（另開分頁）</span>}</a>;
			},
			pre: ({ children }) => {
				const child = Children.toArray(children)[0];
				const language = isValidElement<{ className?: string }>(child) ? (child.props.className || "").replace("language-", "") : "";
				return <CodeBlock text={textContent(children)} language={language}>{children}</CodeBlock>;
			},
			table: ({ children }) => <div className="table-scroll" tabIndex={0} role="region" aria-label="表格，可橫向捲動"><table>{children}</table></div>,
			img: ({ src, alt }) => {
				const url = typeof src === "string" ? safeSourceUrl(src) : null;
				return url ? <a href={url} target="_blank" rel="noopener noreferrer">{alt || "檢視圖片"} ↗<span className="sr-only">（另開分頁）</span></a> : <span>{alt}</span>;
			},
		}}
	>{content}</ReactMarkdown></div>;
}
