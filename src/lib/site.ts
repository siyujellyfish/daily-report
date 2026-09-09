import type { Metadata } from "next";

export const SITE_NAME = "Daily Report";
export const SITE_DESCRIPTION = "每日資訊新聞與框架工具推薦。追蹤 AI、網頁開發與工具生態，探索適合專案的技術選擇。";
export const SITE_URL = new URL(process.env.SITE_URL || "https://daily-report-tau-gold.vercel.app");
export const IS_PREVIEW = Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");

export function pageMetadata(path: string, title: string, description: string): Metadata {
	return {
		title,
		description,
		alternates: { canonical: new URL(path, SITE_URL).href },
		openGraph: { title, description, url: new URL(path, SITE_URL).href, siteName: SITE_NAME, locale: "zh_TW", type: "website" },
		twitter: { card: "summary", title, description },
	};
}
