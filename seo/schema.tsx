import { SITE_CONFIG } from "./config";

/**
 * JSON-LD structured data for the application.
 * Injects Organization, Website, and SoftwareApplication schemas.
 */
export function JsonLdSchema() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: `${SITE_CONFIG.url}/og-image.png`,
      description: SITE_CONFIG.description,
      sameAs: [SITE_CONFIG.links.github, SITE_CONFIG.links.twitter].filter(
        Boolean,
      ),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      description: SITE_CONFIG.description,
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      description: SITE_CONFIG.description,
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Person",
        name: "Nabin Ghimire",
        url: "https://nabinghimire23.com.np",
      },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemas),
      }}
    />
  );
}
