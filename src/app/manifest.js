import { siteConfig } from "./site-config";

export default function manifest() {
  return {
    name: siteConfig.clubName,
    short_name: "Westhood®",
    description: siteConfig.shortDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ebe8df",
    theme_color: "#ebe8df",
    icons: [36, 48, 72, 96, 144, 192].map((size) => ({
      src: `/icons/android-icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
    })),
  };
}
