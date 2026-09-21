export const LEGACY_REPORT_TYPES = ["daily-news", "framework-recommendation"] as const;
export type LegacyReportType = (typeof LEGACY_REPORT_TYPES)[number];
export type ReportType = string;

export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isCategorySlug(value: string) {
	return value.length >= 1 && value.length <= 80 && CATEGORY_SLUG_PATTERN.test(value);
}

export const CATEGORY_TONES = ["blue", "teal", "violet", "amber", "rose", "cyan"] as const;
export type CategoryTone = (typeof CATEGORY_TONES)[number];

const DYNAMIC_CATEGORY_TONES = ["violet", "amber", "rose", "cyan"] as const;

const LEGACY_CATEGORY_PRESENTATION: Record<LegacyReportType, {
	title: string;
	eyebrow: string;
	issue: string;
	tone: CategoryTone;
	icon: string;
}> = {
	"daily-news": {
		title: "每日資訊新聞",
		eyebrow: "THE DAILY ARCHIVE",
		issue: "DAILY BRIEF",
		tone: "blue",
		icon: "≡",
	},
	"framework-recommendation": {
		title: "每日框架工具推薦",
		eyebrow: "THE TOOL COLLECTION",
		issue: "TOOL SPOTLIGHT",
		tone: "teal",
		icon: "⌘",
	},
};

function stableCategoryHash(slug: string) {
	let hash = 2166136261;
	for (const character of slug) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function getCategoryTone(slug: string): CategoryTone {
	if (slug === "daily-news") return "blue";
	if (slug === "framework-recommendation") return "teal";
	return DYNAMIC_CATEGORY_TONES[stableCategoryHash(slug) % DYNAMIC_CATEGORY_TONES.length];
}

export type CategoryRecord = {
	slug: string;
	label: string;
	description: string;
};

export function presentCategory(record: CategoryRecord) {
	const legacy = LEGACY_REPORT_TYPES.includes(record.slug as LegacyReportType)
		? LEGACY_CATEGORY_PRESENTATION[record.slug as LegacyReportType]
		: undefined;
	const tone = legacy?.tone ?? getCategoryTone(record.slug);

	return {
		slug: record.slug,
		label: record.label,
		title: legacy?.title ?? record.label,
		description: record.description,
		href: `/category/${record.slug}`,
		eyebrow: legacy?.eyebrow ?? "THE CATEGORY ARCHIVE",
		issue: legacy?.issue ?? "CATEGORY BRIEF",
		icon: legacy?.icon ?? "◇",
		tone,
		style: `tone-${tone}`,
	};
}

export type PublicCategory = ReturnType<typeof presentCategory>;
