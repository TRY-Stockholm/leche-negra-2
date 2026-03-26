import type { Metadata } from "next";
import "@/styles/index.css";
import Script from "next/script";
import { playfairDisplay } from "./fonts";
import { LazyCustomCursor } from "./components/LazyCustomCursor";

export const metadata: Metadata = {
  title: "Leche Negra",
  description:
    "Leche Negra — a restaurant in Stockholm. Breakfast, lunch, dinner, and drinks on Engelbrektsgatan 3.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={playfairDisplay.variable}>
      <head>
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
        <Script src="https://www.bokabord.se/widget.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
