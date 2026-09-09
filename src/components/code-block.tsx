"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function CodeBlock({ children, text, language }: { children: ReactNode; text: string; language: string }) {
	const [message, setMessage] = useState("");
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pre = useRef<HTMLPreElement>(null);
	useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			setMessage("程式碼已複製");
		} catch {
			if (pre.current) {
				const range = document.createRange();
				range.selectNodeContents(pre.current);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
			}
			setMessage("請按 Ctrl+C 或 ⌘C 複製已選取的程式碼");
		}
		if (timeout.current) clearTimeout(timeout.current);
		timeout.current = setTimeout(() => setMessage(""), 4000);
	}
	return <div className="codebox"><div className="codebar"><span>{language || "CODE"}</span><Button className="copy" variant="outline" size="sm" onClick={copy}>複製程式碼</Button></div><pre ref={pre} tabIndex={0} aria-label="程式碼，可橫向捲動">{children}</pre><span role="status" className={message ? "copy-status" : "sr-only"}>{message}</span></div>;
}
