"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { Theme, MenuKey, SiteSettings, SocialLink, CMSMenu } from "@/lib/types";
import { menuThemeMap, isLightTheme } from "@/lib/constants";
import { NeonLogo } from "./NeonLogo";
import { EasterEggScene } from "./EasterEggScene";
import { pickScene, type SceneConfig } from "./scenes";
import { useWeather } from "@/hooks/useWeather";
import { MenuPanel } from "./MenuPanel";
import { MenuModal } from "./MenuModal";
import { NavBar } from "./NavBar";
import {
  TapeDeckProvider,
  useTapeDeck,
  CassettePlayer,
  CassetteTape,
} from "./tape-deck";
import { Ticker } from "./Ticker";
import { Footer } from "./footer";

const TAPE_THEME_MAP: Record<string, Theme> = {
  morning: "morning",
  midday: "lunch",
  evening: "dinner",
  night: "night",
};

const MENU_ITEMS: readonly { key: MenuKey; time: string; label: string; desktopSize: string }[] = [
  { key: "breakfast", time: "07:00 – 11:00", label: "Breakfast", desktopSize: "text-[clamp(2.5rem,5vw,5.5rem)]" },
  { key: "lunch", time: "11:30 – 14:30", label: "Lunch", desktopSize: "text-[clamp(2.5rem,6vw,5.5rem)]" },
  { key: "dinner", time: "17:00 – 22:00", label: "Dinner", desktopSize: "text-[clamp(2.5rem,5vw,5.5rem)]" },
  { key: "drinks", time: "All Day", label: "Drinks", desktopSize: "text-[clamp(2.5rem,5vw,5.5rem)]" },
];

interface HomePageProps {
  siteSettings: SiteSettings | null;
  socialLinks: SocialLink[];
  menus: CMSMenu[];
}

export default function HomePage({ siteSettings, socialLinks, menus }: HomePageProps) {
  return (
    <TapeDeckProvider>
      <PageContent siteSettings={siteSettings} socialLinks={socialLinks} menus={menus} />
    </TapeDeckProvider>
  );
}

function PageContent({ siteSettings, socialLinks, menus }: HomePageProps) {
  const weather = useWeather();
  const { loadedTapeId } = useTapeDeck();
  const [hoverTheme, setHoverTheme] = useState<Theme | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const [scene, setScene] = useState<SceneConfig | null>(null);
  const lastSceneIdRef = useRef<string | undefined>(undefined);

  // When a tape is loaded, override the theme
  useEffect(() => {
    if (loadedTapeId) {
      const mapped = TAPE_THEME_MAP[loadedTapeId];
      if (mapped) setHoverTheme(mapped);
    } else {
      // Tape ejected — clear override only if no menu is open
      if (!openMenu) setHoverTheme(null);
    }
  }, [loadedTapeId, openMenu]);

  const activeTheme = hoverTheme;

  const handleMenuClick = useCallback(
    (menu: MenuKey) => {
      setOpenMenu((prev) => {
        if (prev === menu) {
          if (!loadedTapeId) setHoverTheme(null);
          return null;
        }
        if (!loadedTapeId) setHoverTheme(menuThemeMap[menu]);
        return menu;
      });
    },
    [loadedTapeId],
  );

  const handleMenuClose = useCallback(() => {
    setOpenMenu(null);
    if (!loadedTapeId) setHoverTheme(null);
  }, [loadedTapeId]);

  const handleNavMenuClick = useCallback(() => {
    setMenuModalOpen(true);
  }, []);

  const handleLongPressComplete = useCallback(() => {
    const picked = pickScene(lastSceneIdRef.current);
    lastSceneIdRef.current = picked.id;
    setScene(picked);
    setEasterEgg(true);
  }, []);

  return (
    <div
      className={`bg-background text-foreground font-body ${activeTheme ? `theme-${activeTheme}` : ""}`}
    >
      <div
        className="relative z-10 min-h-screen bg-background"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
      >
        <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} onMenuClick={handleNavMenuClick} />
        <MenuModal
          open={menuModalOpen}
          onClose={() => setMenuModalOpen(false)}
          cmsMenus={menus}
        />

        {/* Main Content — 12-column grid */}
        <div className="grid grid-cols-12 lg:grid-rows-[auto_1fr_auto] gap-x-4 px-5 md:px-10 min-h-[calc(100vh-65px)]">
          {/* Logo */}
          <div className="col-span-12 row-start-1 self-start pt-6 md:col-span-5 md:pt-16">
            <div className="relative">
              <NeonLogo
                isOff={isLightTheme(activeTheme)}
                onLongPressComplete={handleLongPressComplete}
              />
              <img
                src="/touch-me.gif"
                alt="Touch me"
                className="absolute -top-4 -left-4 w-[50px] pointer-events-none select-none"
              />
            </div>
          </div>

          {/* Menu section — full-width bottom grid */}
          <div className="col-span-12 self-end row-start-4 pb-4 lg:pb-8">
            <div className="grid grid-cols-1 gap-y-4 md:flex md:gap-y-6 md:gap-x-3 lg:gap-12">
              {MENU_ITEMS.map((item) => {
                const active = openMenu === item.key;
                const timeClasses = `font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase ${
                  item.key === "drinks" ? "text-accent" : "text-muted-foreground"
                }`;
                return (
                  <motion.button
                    key={item.key}
                    className="cursor-pointer text-left capitalize"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleMenuClick(item.key)}
                    style={{
                      textShadow: active
                        ? "0 0 8px var(--accent), 0 0 20px var(--accent), 0 0 60px var(--accent)"
                        : "none",
                      transition: "text-shadow 0.5s ease",
                    }}
                  >
                    {/* Mobile layout: name left, time right */}
                    <div className="flex items-baseline justify-between md:hidden">
                      <span className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[0.95] italic">
                        {item.label}
                      </span>
                      <span className={timeClasses}>
                        {item.time}
                      </span>
                    </div>
                    {/* Desktop layout: time above, name below (unchanged) */}
                    <div className="hidden md:block">
                      <span className={`block mb-2 ${timeClasses}`}>
                        {item.time}
                      </span>
                      <span
                        className={`font-display ${item.desktopSize} font-medium leading-[0.95] italic`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <MenuPanel
              activeMenu={openMenu}
              onClose={handleMenuClose}
              cmsMenus={menus}
              bookingUrl={siteSettings?.bookingUrl}
            />
          </div>

          {/* Cassette player */}
          <div className="col-span-12 row-start-2 flex justify-center py-4 overflow-visible md:col-start-7 md:col-span-5 md:row-start-1 md:row-span-3 md:self-center md:py-0">
            <CassettePlayer />
          </div>

          {/* Tapes: 2x2 grid on mobile, scattered grid-children on desktop */}
          <div className="col-span-12 row-start-3 grid grid-cols-2 gap-3 justify-items-center md:contents">
            <CassetteTape
              id="morning"
              className="md:col-start-7 md:col-span-2 md:row-start-2 md:self-start md:mt-8"
              style={{ rotate: "-5deg" }}
            />
            <CassetteTape
              id="midday"
              className="md:col-start-11 md:col-span-2 md:row-start-1 md:self-center"
              style={{ rotate: "3deg" }}
            />
            <CassetteTape
              id="evening"
              className="md:col-start-9 md:col-span-2 md:row-start-2 md:self-start md:mt-12"
              style={{ rotate: "7deg" }}
            />
            <CassetteTape
              id="night"
              className="md:col-start-11 md:col-span-2 md:row-start-2 md:self-start md:mt-4"
              style={{ rotate: "-3deg" }}
            />
          </div>
        </div>

        {/* <Ticker /> */}
      </div>

      {/* <Ticker /> */}

      {scene && (
        <EasterEggScene
          scene={scene}
          active={easterEgg}
          onDismiss={() => setEasterEgg(false)}
        />
      )}
      <Footer siteSettings={siteSettings} socialLinks={socialLinks} />
    </div>
  );
}
