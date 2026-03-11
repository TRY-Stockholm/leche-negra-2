import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY, SPEAKEASY_MENU_QUERY, MENUS_QUERY } from "@/sanity/queries";
import { SpeakeasyScene } from "./_components/SpeakeasyScene";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "411 — Leche Negra",
  description: "Behind the painting.",
};

export default async function SpeakeasyPage() {
  const sanity = client.withConfig({ useCdn: false });
  const [siteSettings, speakeasyMenu, menus] = await Promise.all([
    sanity.fetch(SITE_SETTINGS_QUERY),
    sanity.fetch(SPEAKEASY_MENU_QUERY),
    sanity.fetch(MENUS_QUERY),
  ]);

  return (
    <SpeakeasyScene
      siteSettings={siteSettings}
      menuPdfUrl={speakeasyMenu?.pdfUrl ?? undefined}
      cmsMenus={menus}
    />
  );
}
