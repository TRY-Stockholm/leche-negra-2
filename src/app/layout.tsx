import type { Metadata } from "next";
import "@/styles/index.css";
import { CustomCursor } from "./components/CustomCursor";

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
    <html lang="en">
      <body className="overflow-x-hidden">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
