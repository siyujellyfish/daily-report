import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
	title: "Daily Report",
	description: "公開的每日資訊新聞與框架工具推薦。",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="zh-Hant">
			<body>{children}</body>
		</html>
	);
}
