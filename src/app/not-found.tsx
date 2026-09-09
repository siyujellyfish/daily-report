import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return <section className="empty"><p className="eyebrow">PAGE NOT FOUND</p><h1>找不到這個頁面</h1><p>報告網址或頁碼可能不正確。</p><Button asChild className="button"><Link href="/">返回首頁</Link></Button></section>;
}
