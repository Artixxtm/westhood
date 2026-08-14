import "./globals.css";
import { siteConfig } from "./site-config";

export const metadata = {
  metadataBase: siteConfig.url,
  title: {
    default: siteConfig.title,
    template: "%s | Westhood®",
  },
  description: siteConfig.description,
  applicationName: siteConfig.clubName,
  authors: [{ name: siteConfig.clubName, url: "/" }],
  creator: siteConfig.clubName,
  publisher: siteConfig.clubName,
  category: "fashion",
  keywords: [
    "Westhood",
    "Westhood Club",
    "Drop 001",
    "West Coast clothing",
    "limited clothing drops",
    "vintage sportswear",
    "streetwear",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "x-default": "/",
    },
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/icons/favicon.ico",
    apple: [
      { url: "/icons/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/icons/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/icons/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/icons/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/icons/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/icons/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-icon.png", sizes: "192x192", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/icons/apple-icon-precomposed.png",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.clubName,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/banner-og.jpg",
        width: 1200,
        height: 630,
        alt: "Westhood® Club Drop 001 private access",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.shortDescription,
    images: [
      {
        url: "/banner-og.jpg",
        width: 1200,
        height: 630,
        alt: "Westhood® Club Drop 001 private access",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#ebe8df",
    "msapplication-TileImage": "/icons/ms-icon-144x144.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ebe8df",
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url.origin}/#organization`,
        name: siteConfig.clubName,
        url: siteConfig.url.origin,
        logo: `${siteConfig.url.origin}/logo.svg`,
        description: siteConfig.description,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Los Angeles",
          addressRegion: "CA",
          addressCountry: "US",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url.origin}/#website`,
        name: siteConfig.clubName,
        url: siteConfig.url.origin,
        description: siteConfig.description,
        inLanguage: "en-US",
        publisher: { "@id": `${siteConfig.url.origin}/#organization` },
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
