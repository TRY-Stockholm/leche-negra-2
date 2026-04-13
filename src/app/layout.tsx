import type { Metadata } from "next";
import "@/styles/index.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { playfairDisplay } from "./fonts";
import { LazyCustomCursor } from "./components/LazyCustomCursor";

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
        <LazyCustomCursor />
        {children}
        <Analytics />
        <Script src="https://www.bokabord.se/widget.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
