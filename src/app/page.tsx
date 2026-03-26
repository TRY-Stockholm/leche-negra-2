import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY, SOCIAL_LINKS_QUERY, MENUS_QUERY } from "@/sanity/queries";
import HomePage from "./components/HomePage";

export const revalidate = 60;

export default async function Page() {
  const [siteSettings, socialLinks, menus] = await Promise.all([
    client.fetch(SITE_SETTINGS_QUERY),
    client.fetch(SOCIAL_LINKS_QUERY),
    client.fetch(MENUS_QUERY),
  ]);

  return (
    <HomePage
      siteSettings={siteSettings}
      socialLinks={socialLinks}
      menus={menus}
    />
  );
}
