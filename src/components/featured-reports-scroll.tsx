"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "radix-ui";

const EDGE_TOLERANCE = 2;

export function FeaturedReportsScroll({ children }: { children: ReactNode }) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const updateControls = () => {
			const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
			setCanScrollLeft(viewport.scrollLeft > EDGE_TOLERANCE);
			setCanScrollRight(viewport.scrollLeft < maxScrollLeft - EDGE_TOLERANCE);
		};

		updateControls();
		viewport.addEventListener("scroll", updateControls, { passive: true });

		const resizeObserver = new ResizeObserver(updateControls);
		resizeObserver.observe(viewport);
		const content = viewport.firstElementChild;
		if (content instanceof HTMLElement) resizeObserver.observe(content);

		return () => {
			viewport.removeEventListener("scroll", updateControls);
			resizeObserver.disconnect();
		};
	}, []);

	const move = (direction: -1 | 1) => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const card = viewport.querySelector<HTMLElement>(".feature");
		const grid = viewport.querySelector<HTMLElement>(".featured-grid");
		const gap = grid ? Number.parseFloat(getComputedStyle(grid).columnGap) || 0 : 0;
		const distance = (card?.getBoundingClientRect().width ?? viewport.clientWidth * 0.9) + gap;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		viewport.scrollBy({
			left: direction * distance,
			behavior: reducedMotion ? "auto" : "smooth",
		});
	};

	return <div className="featured-carousel">
		<ScrollArea.Root className="featured-scroll-area" type="auto">
			<ScrollArea.Viewport ref={viewportRef} className="featured-scroll-viewport">
				<div className="featured-grid">{children}</div>
			</ScrollArea.Viewport>
		</ScrollArea.Root>
		<button
			type="button"
			className="featured-carousel-control featured-carousel-prev"
			aria-label="上一則報告"
			disabled={!canScrollLeft}
			onClick={() => move(-1)}
		>
			<span aria-hidden="true">←</span>
		</button>
		<button
			type="button"
			className="featured-carousel-control featured-carousel-next"
			aria-label="下一則報告"
			disabled={!canScrollRight}
			onClick={() => move(1)}
		>
			<span aria-hidden="true">→</span>
		</button>
	</div>;
}
