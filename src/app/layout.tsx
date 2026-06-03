import type { Metadata, Viewport } from "next";
import "@/styles/index.css";
import { Analytics } from "@vercel/analytics/next";
import { playfairDisplay } from "./fonts";
import { LazyCustomCursor } from "./components/LazyCustomCursor";
import { WaiterAidScript } from "./components/WaiterAidScript";
import { AudioUnlockMount } from "./components/AudioUnlockMount";

export const metadata: Metadata = {
  title: {
    default: "Leche Negra",
    template: "%s | Leche Negra",
  },
  description:
    "Leche Negra — a restaurant in Stockholm. Breakfast, lunch, dinner, and drinks on Engelbrektsgatan 3.",
  metadataBase: new URL("https://lechenegra.com"),
  openGraph: {
    title: "Leche Negra",
    description:
      "A restaurant in Stockholm. Breakfast, lunch, dinner, and drinks on Engelbrektsgatan 3.",
    url: "https://lechenegra.com",
    siteName: "Leche Negra",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Leche Negra",
      },
    ],
    locale: "en",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leche Negra",
    description:
      "A restaurant in Stockholm. Breakfast, lunch, dinner, and drinks on Engelbrektsgatan 3.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  // Match the deep-red base background so the notch/home-indicator safe areas and
  // the iOS overscroll gutter blend into the page instead of flashing white.
  themeColor: "#460b08",
  colorScheme: "dark",
  // Let the page bleed into the safe areas; edges opt back in via env(safe-area-*).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={playfairDisplay.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              name: "Leche Negra",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Engelbrektsgatan 32A",
                addressLocality: "Stockholm",
                addressCountry: "SE",
              },
              url: "https://lechenegra.com",
              servesCuisine: "Contemporary",
              priceRange: "$$$",
            }),
          }}
        />
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-x-hidden">
        <AudioUnlockMount />
        <LazyCustomCursor />
        {children}
        <Analytics />
        <WaiterAidScript />
      </body>
    </html>
  );
}
