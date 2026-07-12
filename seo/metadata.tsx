import { Metadata } from "next";
import { SITE_CONFIG } from "./config";

export function constructMetadata({
    title,
    description = SITE_CONFIG.description,
    image = SITE_CONFIG.ogImage,
    icons = "/favicon.ico",
    noIndex = false,
}: {
    title?: string;
    description?: string;
    image?: string;
    icons?: string;
    noIndex?: boolean;
} = {}): Metadata {
    const pageTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.name;

    return {
        title: pageTitle,
        description,
        keywords: SITE_CONFIG.keywords,
        openGraph: {
            title: pageTitle,
            description,
            images: [
                {
                    url: image,
                },
            ],
            type: "website",
            siteName: SITE_CONFIG.name,
        },
        twitter: {
            card: "summary_large_image",
            title: pageTitle,
            description,
            images: [image],
            creator: "@biterdevs",
        },
        icons,
        metadataBase: new URL(SITE_CONFIG.url),
        ...(noIndex && {
            robots: {
                index: false,
                follow: false,
            },
        }),
    };
}
