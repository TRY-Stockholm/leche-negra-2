import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY, SPEAKEASY_MENU_QUERY, MENUS_QUERY } from "@/sanity/queries";
import { SpeakeasyScene } from "./_components/SpeakeasyScene";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Noctuaires",
  description: "Behind the painting.",
};

export default async function SpeakeasyPage() {
  const [siteSettings, speakeasyMenu, menus] = await Promise.all([
    client.fetch(SITE_SETTINGS_QUERY),
    client.fetch(SPEAKEASY_MENU_QUERY),
    client.fetch(MENUS_QUERY),
  ]);

  return (
    <SpeakeasyScene
      siteSettings={siteSettings}
      menuPdfUrl={speakeasyMenu?.pdfUrl ?? undefined}
      cmsMenus={menus}
    />
  );
}
