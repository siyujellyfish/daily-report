import type { MetadataRoute } from "next";
import { IS_PREVIEW, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
	return IS_PREVIEW
		? { rules: { userAgent: "*", disallow: "/" } }
		: { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: new URL("/sitemap.xml", SITE_URL).href };
}
