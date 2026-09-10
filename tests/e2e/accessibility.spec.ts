import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = [
	"/",
	"/news",
	"/frameworks",
	"/reports/2026-09-09-daily-news",
];

function channel(value: number) {
	const normalized = value / 255;
	return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
	const value = hex.trim().replace(/^#/, "");
	const normalized = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
	if (!/^[0-9a-f]{6}$/i.test(normalized)) throw new Error(`Unsupported color value: ${hex}`);
	const red = channel(Number.parseInt(normalized.slice(0, 2), 16));
	const green = channel(Number.parseInt(normalized.slice(2, 4), 16));
	const blue = channel(Number.parseInt(normalized.slice(4, 6), 16));
	return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(foreground: string, background: string) {
	const first = luminance(foreground);
	const second = luminance(background);
	const lighter = Math.max(first, second);
	const darker = Math.min(first, second);
	return (lighter + 0.05) / (darker + 0.05);
}

test("public pages keep one h1 and do not skip heading levels", async ({ page }) => {
	for (const route of PUBLIC_ROUTES) {
		await page.goto(route);
		const levels = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((headings) => headings
			.filter((heading) => {
				const style = getComputedStyle(heading);
				return style.display !== "none" && style.visibility !== "hidden";
			})
			.map((heading) => Number(heading.tagName.slice(1))));
		expect(levels.filter((level) => level === 1), `${route} should have exactly one h1`).toHaveLength(1);
		expect(levels[0], `${route} should begin with h1`).toBe(1);
		for (let index = 1; index < levels.length; index += 1) {
			expect(levels[index] - levels[index - 1], `${route} heading level jump at index ${index}`).toBeLessThanOrEqual(1);
		}
	}
});

test("links have meaningful accessible labels for distinct destinations", async ({ page }) => {
	for (const route of PUBLIC_ROUTES) {
		await page.goto(route);
		const links = await page.locator("a").evaluateAll((anchors) => anchors.map((anchor) => ({
			href: (anchor as HTMLAnchorElement).href,
			label: (anchor.getAttribute("aria-label") || anchor.textContent || "").replace(/\s+/g, " ").trim(),
		})));
		const weak = links.filter((link) => !link.label || /^[↗←→↑/\s]+$/.test(link.label));
		expect(weak, `${route} contains links without a meaningful label`).toEqual([]);

		const destinations = new Map<string, Set<string>>();
		for (const link of links) {
			const values = destinations.get(link.label) ?? new Set<string>();
			values.add(link.href);
			destinations.set(link.label, values);
		}
		const ambiguous = [...destinations.entries()]
			.filter(([, hrefs]) => hrefs.size > 1)
			.map(([label, hrefs]) => ({ label, hrefs: [...hrefs] }));
		expect(ambiguous, `${route} reuses an accessible link label for different destinations`).toEqual([]);
	}
});

test("light and dark text tokens meet WCAG AA normal-text contrast", async ({ page }) => {
	await page.goto("/");
	for (const theme of ["light", "dark"] as const) {
		await page.getByRole("combobox", { name: "外觀主題" }).selectOption(theme);
		await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
		const colors = await page.evaluate(() => {
			const style = getComputedStyle(document.documentElement);
			return Object.fromEntries(["--bg", "--surface", "--ink", "--muted", "--blue", "--blue-soft", "--teal", "--teal-soft", "--code", "--code-ink"]
				.map((name) => [name, style.getPropertyValue(name).trim()]));
		});
		const pairs: Array<[string, string]> = [
			["--ink", "--bg"],
			["--muted", "--bg"],
			["--muted", "--surface"],
			["--blue", "--blue-soft"],
			["--teal", "--teal-soft"],
			["--code-ink", "--code"],
		];
		for (const [foreground, background] of pairs) {
			expect(contrastRatio(colors[foreground], colors[background]), `${theme}: ${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
		}
	}
});

test("public reading flow performs no browser-side API reads", async ({ page }, testInfo) => {
	test.skip(testInfo.project.name.includes("mobile"), "The server/client data boundary is viewport-independent; mobile navigation is covered separately.");
	const apiRequests: string[] = [];
	page.on("request", (request) => {
		const url = new URL(request.url());
		if (url.pathname.startsWith("/api/")) apiRequests.push(`${request.method()} ${url.pathname}`);
	});
	await page.goto("/");
	await page.getByRole("link", { name: "資訊新聞", exact: true }).click();
	await page.getByRole("link", { name: "Phase 3 Daily News 09", exact: true }).click();
	await expect(page.getByRole("heading", { level: 1, name: "Phase 3 Daily News 09" })).toBeVisible();
	expect(apiRequests).toEqual([]);
});

test("mobile report keeps wide content inside local scroll containers", async ({ page }, testInfo) => {
	test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only layout check.");
	await page.goto("/reports/2026-09-09-daily-news");
	const layout = await page.evaluate(() => ({
		documentWidth: document.documentElement.scrollWidth,
		viewportWidth: document.documentElement.clientWidth,
		containers: [...document.querySelectorAll<HTMLElement>(".table-scroll, .codebox pre")].map((element) => ({
			overflowX: getComputedStyle(element).overflowX,
			scrollWidth: element.scrollWidth,
			clientWidth: element.clientWidth,
		})),
	}));
	expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 2);
	expect(layout.containers.length).toBeGreaterThanOrEqual(2);
	for (const container of layout.containers) {
		expect(["auto", "scroll"]).toContain(container.overflowX);
		expect(container.scrollWidth).toBeGreaterThanOrEqual(container.clientWidth);
	}
});
