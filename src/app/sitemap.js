import { siteConfig } from "./site-config";

export default function sitemap() {
  return [
    {
      url: siteConfig.url.origin,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      images: [`${siteConfig.url.origin}/waitlist.jpg`],
    },
  ];
}
