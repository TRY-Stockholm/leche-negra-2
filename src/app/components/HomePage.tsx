"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Theme, MenuKey, SiteSettings, SocialLink, CMSMenu } from "@/lib/types";
import { menuThemeMap, isLightTheme } from "@/lib/constants";
import { NeonLogo } from "./NeonLogo";
import { EasterEggScene } from "./EasterEggScene";
import { pickScene, type SceneConfig } from "./scenes";
import { useWeather } from "@/hooks/useWeather";
import { MenuPanel } from "./MenuPanel";
import { NavBar } from "./NavBar";
import {
  TapeDeckProvider,
  useTapeDeck,
  CassettePlayer,
  CassetteTape,
} from "./tape-deck";
import { Ticker } from "./Ticker";
import { Footer } from "./footer";
import { motion } from "motion/react";
import { SpeakeasyGlow } from "./footer/SpeakeasyGlow";
import { BlackoutOverlay } from "./footer/BlackoutOverlay";
import { useSpeakeasyDrag } from "@/hooks/useSpeakeasyDrag";

const TAPE_THEME_MAP: Record<string, Theme> = {
  morning: "morning",
  midday: "lunch",
  evening: "dinner",
  night: "night",
};

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
  const [easterEgg, setEasterEgg] = useState(false);
  const [scene, setScene] = useState<SceneConfig | null>(null);
  const lastSceneIdRef = useRef<string | undefined>(undefined);

  const { state: dragState, containerRef, handlers: dragHandlers, nudge } = useSpeakeasyDrag({
    maxDrag: 300,
    threshold: 0.4,
    resistance: 0.55,
  });

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

  const handleLongPressComplete = useCallback(() => {
    const picked = pickScene(lastSceneIdRef.current);
    lastSceneIdRef.current = picked.id;
    setScene(picked);
    setEasterEgg(true);
  }, []);

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`bg-background text-foreground font-body ${activeTheme ? `theme-${activeTheme}` : ""}`}
    >
      {/* Glow layer — full viewport, behind everything */}
      <SpeakeasyGlow />

      {/* The "panel" — entire page moves as one rigid piece */}
      <motion.div
        style={{
          y: dragState.isTransitioning ? undefined : -dragState.offsetY,
        }}
        animate={
          dragState.isTransitioning
            ? { y: "-100vh" }
            : !dragState.isDragging
              ? { y: 0 }
              : undefined
        }
        transition={
          dragState.isTransitioning
            ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
            : !dragState.isDragging
              ? { type: "spring", stiffness: 200, damping: 25 }
              : undefined
        }
      >
        <div
          className="relative z-10 min-h-screen bg-background"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
        >
          <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} />

          {/* Main Content — 12-column grid */}
          <div className="grid grid-cols-12 lg:grid-rows-[auto_1fr_auto] gap-x-4 px-5 md:px-10 min-h-[calc(100vh-65px)]">
            {/* Logo */}
            <div className="col-span-12 row-start-1 self-start pt-8 md:col-span-5 md:pt-16">
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
              <div className="grid grid-cols-2 md:flex gap-y-6 gap-x-3 lg:gap-12">
                {[
                  {
                    key: "breakfast" as MenuKey,
                    time: "07:00 – 11:00",
                    label: "Breakfast",
                    size: "text-[clamp(2.5rem,5vw,5.5rem)]",
                  },
                  {
                    key: "lunch" as MenuKey,
                    time: "11:30 – 14:30",
                    label: "Lunch",
                    size: "text-[clamp(2.5rem,6vw,5.5rem)]",
                  },
                  {
                    key: "dinner" as MenuKey,
                    time: "17:00 – 22:00",
                    label: "Dinner",
                    size: "text-[clamp(2.5rem,5vw,5.5rem)]",
                  },
                  {
                    key: "drinks" as MenuKey,
                    time: "All Day",
                    label: "Drinks",
                    size: "text-[clamp(2.5rem,5vw,5.5rem)]",
                  },
                ].map((item) => {
                  const active = openMenu === item.key;
                  return (
                    <button
                      key={item.key}
                      className="cursor-pointer text-left capitalize"
                      onClick={() => handleMenuClick(item.key)}
                      style={{
                        textShadow: active
                          ? "0 0 8px var(--accent), 0 0 20px var(--accent), 0 0 60px var(--accent)"
                          : "none",
                        transition: "text-shadow 0.5s ease",
                      }}
                    >
                      <span
                        className={`block mb-2 font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase ${item.key === "drinks" ? "text-accent" : "text-muted-foreground"}`}
                      >
                        {item.time}
                      </span>
                      <span
                        className={`font-display ${item.size} font-medium leading-[0.95] italic`}
                      >
                        {item.label}
                      </span>
                    </button>
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

            {/* Cassette player — right side, vertically centered */}
            <div className="col-span-12 row-start-3 flex justify-center py-8 overflow-visible md:col-start-7 md:col-span-5 md:row-start-1 md:row-span-3 md:self-center md:py-0">
              <CassettePlayer />
            </div>

            {/* Cassette tapes — scattered */}
            <CassetteTape
              id="morning"
              className="col-span-3 row-start-2 self-center pb-8 md:pb-0 md:col-start-7 md:col-span-2 md:row-start-2 md:self-start md:mt-8"
              style={{ rotate: "-5deg" }}
            />
            <CassetteTape
              id="midday"
              className="col-span-3 col-start-4 row-start-2 self-center pb-8 md:pb-0 md:col-start-11 md:col-span-2 md:row-start-1 md:self-center"
              style={{ rotate: "3deg" }}
            />
            <CassetteTape
              id="evening"
              className="col-span-3 col-start-7 row-start-2 self-center pb-8 md:pb-0 md:col-start-9 md:col-span-2 md:row-start-2 md:self-start md:mt-12"
              style={{ rotate: "7deg" }}
            />
            <CassetteTape
              id="night"
              className="col-span-3 col-start-10 row-start-2 self-center pb-8 md:pb-0 md:col-start-11 md:col-span-2 md:row-start-2 md:self-start md:mt-4"
              style={{ rotate: "-3deg" }}
            />
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

        <Footer
          siteSettings={siteSettings}
          socialLinks={socialLinks}
          dragHandlers={dragHandlers}
          isDragging={dragState.isDragging}
          onDragHint={nudge}
        />
      </motion.div>

      {/* Blackout during transition — outside the moving panel */}
      <BlackoutOverlay active={dragState.isTransitioning} />
    </div>
  );
}
