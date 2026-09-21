"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ScrollArea } from "radix-ui";
import { useEffect, useState } from "react";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { truncateCategoryLabel } from "@/lib/category-label";

type NavigationCategory = {
	slug: string;
	label: string;
	href: string;
};

function activeCategorySlug(pathname: string) {
	const archive = /^\/category\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(pathname);
	if (archive) return archive[1];

	const report = /^\/reports\/\d{4}-\d{2}-\d{2}-(.+)\/?$/.exec(pathname);
	return report?.[1] ?? null;
}

export function SiteNavigation({ categories }: { categories: NavigationCategory[] }) {
	const pathname = usePathname();
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();
	const activeSlug = activeCategorySlug(pathname);

	useEffect(() => {
		setMounted(true);
	}, []);

	return <div className="navigation-shell">
		<div className="header-actions">
			<Link
				className="home-link"
				href="/"
				aria-current={pathname === "/" ? "page" : undefined}
			>首頁</Link>
			<div className="theme-control">
				<label htmlFor="theme" aria-label="外觀主題">◐</label>
				<NativeSelect
					id="theme"
					aria-label="外觀主題"
					value={mounted ? theme : "system"}
					onChange={(event) => setTheme(event.target.value)}
					disabled={!mounted}
					className="theme-select"
				>
					<NativeSelectOption value="system">跟隨系統</NativeSelectOption>
					<NativeSelectOption value="light">淺色模式</NativeSelectOption>
					<NativeSelectOption value="dark">深色模式</NativeSelectOption>
				</NativeSelect>
			</div>
		</div>
		<nav className="category-rail" aria-label="報告分類">
			<ScrollArea.Root className="category-scroll-area" type="auto">
				<ScrollArea.Viewport className="category-scroll-viewport">
					<div className="category-rail-inner">
						{categories.map((category) => <Link
							key={category.slug}
							href={category.href}
							prefetch={false}
							aria-current={activeSlug === category.slug ? "page" : undefined}
							aria-label={category.label}
							title={category.label}
						>
							<span aria-hidden="true">{truncateCategoryLabel(category.label)}</span>
						</Link>)}
					</div>
				</ScrollArea.Viewport>
				<ScrollArea.Scrollbar className="category-scrollbar" orientation="horizontal">
					<ScrollArea.Thumb className="category-scroll-thumb" />
				</ScrollArea.Scrollbar>
			</ScrollArea.Root>
		</nav>
	</div>;
}
