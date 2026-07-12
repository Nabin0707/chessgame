import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/seo/config";

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        "",
        // Add more routes here as you add pages
        // "/about",
        // "/contact",
    ].map((route) => ({
        url: `${SITE_CONFIG.url}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    return routes;
}
