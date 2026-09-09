"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function SiteNavigation() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();
	const menuRef = useRef<HTMLButtonElement>(null);
	useEffect(() => { setMounted(true); }, []);
	const links = [
		{ href: "/", label: "首頁", active: pathname === "/" },
		{ href: "/news", label: "資訊新聞", active: pathname === "/news" || pathname.endsWith("-daily-news") },
		{ href: "/frameworks", label: "框架工具", active: pathname === "/frameworks" || pathname.endsWith("-framework-recommendation") },
	];
	return (
		<div className="navigation-shell" onKeyDown={(event) => {
			if (event.key === "Escape" && open) { setOpen(false); menuRef.current?.focus(); }
		}}>
			<nav id="main-nav" className={`nav ${open ? "open" : ""}`} aria-label="主要導覽">
				{links.map((link) => <Link key={link.href} href={link.href} prefetch={false} aria-current={link.active ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}
			</nav>
			<div className="theme-control">
				<label htmlFor="theme" aria-label="外觀主題">◐</label>
				<NativeSelect id="theme" aria-label="外觀主題" value={mounted ? theme : "system"} onChange={(event) => setTheme(event.target.value)} disabled={!mounted} className="theme-select">
					<NativeSelectOption value="system">跟隨系統</NativeSelectOption>
					<NativeSelectOption value="light">淺色模式</NativeSelectOption>
					<NativeSelectOption value="dark">深色模式</NativeSelectOption>
				</NativeSelect>
			</div>
			<Button ref={menuRef} variant="outline" className="menu-toggle" aria-controls="main-nav" aria-expanded={open} onClick={() => setOpen(!open)}>選單</Button>
		</div>
	);
}
