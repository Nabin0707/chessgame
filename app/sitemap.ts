import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        "",
    ].map((route) => ({
        url: `https://ai-chess.vercel.app${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "monthly" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    return routes;
}
