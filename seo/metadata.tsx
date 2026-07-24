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
  const pageTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : SITE_CONFIG.name;

  return {
    title: pageTitle,
    description,
    keywords: SITE_CONFIG.keywords,
    authors: [{ name: SITE_CONFIG.author, url: SITE_CONFIG.authorUrl }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.author,
    openGraph: {
      title: pageTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: SITE_CONFIG.name,
        },
      ],
      type: "website",
      siteName: SITE_CONFIG.name,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [image],
      creator: "@ai-chess-platform",
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
