import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { IS_PREVIEW, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
	metadataBase: SITE_URL,
	title: { default: `${SITE_NAME} · 每日推播`, template: `%s · ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	robots: IS_PREVIEW ? { index: false, follow: false } : { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	return <html lang="zh-Hant" suppressHydrationWarning><body>
		<ThemeProvider>
			<a href="#main-content" className="skip">跳至主要內容</a>
			<SiteHeader />
			<main id="main-content" className="wrap" tabIndex={-1}>{children}</main>
			<footer className="site-footer"><div className="wrap footer-inner"><span><strong>Daily Report</strong>每天一點，持續探索。</span><span>AI 整理內容 · 閱讀時請核對原始來源</span></div></footer>
		</ThemeProvider>
	</body></html>;
}
