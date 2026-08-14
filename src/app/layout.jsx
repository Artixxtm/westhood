import "./globals.css";

export const metadata = {
  title: "Westhood® — Private Access",
  description: "Join the Westhood® private list and unlock the first collection preview.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ebe8df",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
