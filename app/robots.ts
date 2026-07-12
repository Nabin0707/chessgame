import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/seo/config";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/"], // Common practice to disallow API routes
            },
        ],
        sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    };
}
