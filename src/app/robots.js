import { siteConfig } from "./site-config";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${siteConfig.url.origin}/sitemap.xml`,
    host: siteConfig.url.origin,
  };
}
