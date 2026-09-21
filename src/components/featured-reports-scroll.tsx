"use client";

import type { ReactNode } from "react";
import { ScrollArea } from "radix-ui";

export function FeaturedReportsScroll({ children }: { children: ReactNode }) {
	return <ScrollArea.Root className="featured-scroll-area" type="auto">
		<ScrollArea.Viewport className="featured-scroll-viewport">
			<div className="featured-grid">{children}</div>
		</ScrollArea.Viewport>
		<ScrollArea.Scrollbar className="featured-scrollbar" orientation="horizontal">
			<ScrollArea.Thumb className="featured-scroll-thumb" />
		</ScrollArea.Scrollbar>
	</ScrollArea.Root>;
}
