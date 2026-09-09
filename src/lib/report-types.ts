export const REPORT_TYPES = ["daily-news", "framework-recommendation"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_CATEGORIES = {
	"daily-news": {
		label: "資訊新聞",
		title: "每日資訊新聞",
		href: "/news",
		style: "news",
		eyebrow: "THE DAILY ARCHIVE",
		issue: "DAILY BRIEF",
		description: "回顧 AI、網頁開發與工具生態的每日觀察。",
	},
	"framework-recommendation": {
		label: "框架工具",
		title: "每日框架工具推薦",
		href: "/frameworks",
		style: "frameworks",
		eyebrow: "THE TOOL COLLECTION",
		issue: "TOOL SPOTLIGHT",
		description: "每天認識一項工具，找到適合專案的下一個選擇。",
	},
} as const;
