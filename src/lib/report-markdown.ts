import type { Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type ReportHeading = { id: string; text: string; depth: number };
const parser = unified().use(remarkParse).use(remarkGfm);
const plainText = (node: Root | RootContent) => toString(node, { includeHtml: false }).replace(/\s+/g, " ").trim();

// One transform owns both the visible heading IDs and table of contents.
export function prepareReportTree(tree: Root, title: string) {
	const first = tree.children[0];
	if (first?.type === "heading" && first.depth === 1 && plainText(first) === title.trim()) {
		tree.children.shift();
	}
	const headings: ReportHeading[] = [];
	let headingIndex = 0;
	function walk(node: Root | RootContent) {
		if (node.type === "heading") {
			if (node.depth === 1) node.depth = 2;
			const id = `report-section-${++headingIndex}`;
			node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
			const text = plainText(node);
			if (node.depth <= 3 && text) headings.push({ id, text, depth: node.depth });
		}
		if ("children" in node) {
			for (const child of node.children) walk(child as RootContent);
		}
	}
	walk(tree);
	return headings;
}

export function remarkReportHeadings(options: { title: string }) {
	return (tree: Root) => { prepareReportTree(tree, options.title); };
}

export function analyzeReportMarkdown(markdown: string, title: string) {
	const tree = parser.parse(markdown);
	const headings = prepareReportTree(tree, title);
	const paragraphs = tree.children.filter((node) => node.type === "paragraph").map(plainText).filter(Boolean);
	const text = tree.children.filter((node) => node.type !== "html" && node.type !== "definition").map(plainText).filter(Boolean).join(" ");
	const summaryText = paragraphs[0] || text;
	const characters = Array.from(summaryText);
	return {
		headings,
		summary: characters.slice(0, 100).join("") + (characters.length > 100 ? "…" : ""),
		readingMinutes: Math.max(1, Math.ceil(Array.from(text).length / 400)),
	};
}

export function safeSourceUrl(value: string) {
	try {
		const url = new URL(value);
		return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
	} catch {
		return null;
	}
}
