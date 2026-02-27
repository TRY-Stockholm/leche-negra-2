import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";
import { SpeakeasyScene } from "./_components/SpeakeasyScene";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "411 — Leche Negra",
  description: "Behind the painting.",
};

export default async function SpeakeasyPage() {
  const siteSettings = await client
    .withConfig({ useCdn: false })
    .fetch(SITE_SETTINGS_QUERY);

  return <SpeakeasyScene siteSettings={siteSettings} />;
}
