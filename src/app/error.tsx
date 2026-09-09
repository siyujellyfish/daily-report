"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return <section className="empty" role="alert"><p className="eyebrow">PLEASE TRY AGAIN</p><h1>暫時無法載入報告</h1><p>請稍後重試，或返回首頁瀏覽。</p><div className="error-actions"><Button className="button" onClick={reset}>重新載入</Button><Link href="/" className="text-link">返回首頁</Link></div></section>;
}
