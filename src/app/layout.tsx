import type { Metadata } from "next";
import "@/styles/index.css";
import { CustomCursor } from "./components/CustomCursor";
import { playfairDisplay } from "./fonts";

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
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-x-hidden">
        <CustomCursor />
        {children}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://www.bokabord.se/widget.min.js" />
      </body>
    </html>
  );
}
