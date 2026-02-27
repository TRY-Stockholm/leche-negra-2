import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY, SOCIAL_LINKS_QUERY, MENUS_QUERY } from "@/sanity/queries";
import HomePage from "./components/HomePage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const freshClient = client.withConfig({ useCdn: false });

  const [siteSettings, socialLinks, menus] = await Promise.all([
    freshClient.fetch(SITE_SETTINGS_QUERY),
    freshClient.fetch(SOCIAL_LINKS_QUERY),
    freshClient.fetch(MENUS_QUERY),
  ]);

  return (
    <HomePage
      siteSettings={siteSettings}
      socialLinks={socialLinks}
      menus={menus}
    />
  );
}
