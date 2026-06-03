"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  Theme,
  MenuKey,
  SiteSettings,
  SocialLink,
  CMSMenu,
} from "@/lib/types";
import { menuThemeMap, isLightTheme } from "@/lib/constants";
import { OpeningCountdown } from "./OpeningCountdown";
import { NeonLogo } from "./NeonLogo";
import { EasterEggScene } from "./EasterEggScene";
import { PRIMARY_SCENE, type SceneConfig } from "./scenes";
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
import { SpeakeasyGlow } from "./footer/SpeakeasyGlow";
import { BlackoutOverlay } from "./footer/BlackoutOverlay";
import { AmbientIllustrations } from "./AmbientIllustrations";
import { useOverscrollEntry } from "@/hooks/useOverscrollEntry";
import { motion } from "motion/react";

interface HomePageProps {
  siteSettings: SiteSettings | null;
  socialLinks: SocialLink[];
  menus: CMSMenu[];
}

export default function HomePage({
  siteSettings,
  socialLinks,
  menus,
}: HomePageProps) {
  return (
    <TapeDeckProvider>
      <PageContent
        siteSettings={siteSettings}
        socialLinks={socialLinks}
        menus={menus}
      />
    </TapeDeckProvider>
  );
}

function PageContent({ siteSettings, socialLinks, menus }: HomePageProps) {
  const showMenus = siteSettings?.showMenus ?? false;
  const showBooking = siteSettings?.showBooking ?? true;
  const router = useRouter();
  const weather = useWeather();
  const { loadedTapeId } = useTapeDeck();
  const [hoverTheme, setHoverTheme] = useState<Theme | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const [scene, setScene] = useState<SceneConfig | null>(null);

  // Speakeasy entry: desktop drags the footer, touch overscrolls past the bottom.
  const { state: entry, atBottom, containerRef, pointerHandlers } = useOverscrollEntry();

  // Hover-driven theme overrides only happen via menus now; tape changes are
  // handled separately as a subtle red-hue shift, not a full theme swap.
  const activeTheme = hoverTheme;
  const tapeMood = loadedTapeId ?? null;

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

  // Holding the logo opens the floral-combustion ritual; when its video plays
  // through, the user is delivered into the speakeasy (see onComplete below).
  const handleLongPressComplete = useCallback(() => {
    setScene(PRIMARY_SCENE);
    setEasterEgg(true);
  }, []);

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`bg-background text-foreground font-body transition-colors duration-700 ${activeTheme ? `theme-${activeTheme}` : ""} ${tapeMood ? `tape-${tapeMood}` : ""}`}
      style={{ isolation: "isolate" }}
    >
      {/* Full-viewport warm glow — sits behind the page, revealed as it lifts. */}
      <SpeakeasyGlow />

      {/* The "panel" — the whole page lifts as one rigid slab off the hidden room. */}
      <motion.div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        animate={{
          y: entry.isTransitioning
            ? -window.innerHeight - 200
            : entry.isDragging
              ? -entry.offsetY
              : 0,
        }}
        transition={
          entry.isTransitioning
            ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
            : entry.isDragging
              ? { duration: 0 }
              : { type: "spring", stiffness: 200, damping: 25 }
        }
      >
        <div
          className="relative z-10 flex-1 bg-background"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
        >
          <NavBar
            weather={weather}
            bookingUrl={siteSettings?.bookingUrl}
            onMenuClick={handleNavMenuClick}
            showMenus={showMenus}
            showBooking={showBooking}
            addressMapUrl={siteSettings?.addressMapUrl}
          />
          <MenuModal
            open={menuModalOpen}
            onClose={() => setMenuModalOpen(false)}
            cmsMenus={menus}
          />

          {/* Main Content — 12-column grid */}
          <div className="grid grid-cols-12 lg:grid-rows-[auto_1fr_auto] gap-x-4 px-5 md:px-10 min-h-[calc(100svh-84px)] lg:min-h-[calc(100vh-65px)]">
          {/* Logo */}
          <div className="col-span-12 row-start-1 self-start pt-8 md:col-span-5 md:pt-16 select-none">
            <div className="relative no-select">
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
          {showMenus ? (
          <div className="col-span-12 self-end row-start-4 pb-6 lg:pb-8">
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
          ) : (
            <OpeningCountdown />
          )}

          {/* Ambient sensual illustrations */}
          <AmbientIllustrations activeMenu={openMenu} activeTheme={activeTheme} />

          {/* Cassette player — right side, vertically centered */}
          <div className="col-span-12 row-start-3 flex justify-center py-8 overflow-visible md:col-start-7 md:col-span-5 md:row-start-1 md:row-span-3 md:self-center md:py-0">
            <CassettePlayer />
          </div>

          {/* Vinyl records — scattered around the gramophone like a record crate mid-browse.
              Asymmetric on purpose: one bridges the heading to the player, one peeks from
              the corner, one anchors the lower-right, one tucks beside the gramophone's base. */}
          <CassetteTape
            id="morning"
            className="col-span-3 row-start-2 self-center pb-8 translate-y-5 translate-x-2 md:translate-y-6 md:translate-x-0 md:pb-0 md:col-start-5 md:col-span-2 md:row-start-2 md:self-center"
            style={{ rotate: "-9deg" }}
          />
          <CassetteTape
            id="midday"
            className="col-span-3 col-start-4 row-start-2 self-center pb-8 -translate-y-4 -translate-x-1 md:translate-y-0 md:pb-0 md:col-start-12 md:col-span-1 md:row-start-1 md:self-start md:mt-2 md:-translate-x-3"
            style={{ rotate: "14deg" }}
          />
          <CassetteTape
            id="evening"
            className="col-span-3 col-start-7 row-start-2 self-center pb-8 translate-y-7 translate-x-2 md:translate-y-0 md:pb-0 md:col-start-7 md:col-span-2 md:row-start-3 md:self-end md:mb-2 md:translate-x-2"
            style={{ rotate: "-4deg" }}
          />
          <CassetteTape
            id="night"
            className="col-span-3 col-start-10 row-start-2 self-center pb-8 -translate-y-2 -translate-x-2 md:translate-y-0 md:pb-0 md:col-start-12 md:col-span-1 md:row-start-3 md:self-end md:mb-6 md:-translate-x-2"
            style={{ rotate: "8deg" }}
          />
        </div>

        {/* <Ticker /> */}

          {scene && (
            <EasterEggScene
              scene={scene}
              active={easterEgg}
              onDismiss={() => setEasterEgg(false)}
              onComplete={() => router.push("/speakeasy")}
            />
          )}
        </div>

        <Footer
          siteSettings={siteSettings}
          socialLinks={socialLinks}
          pointerHandlers={pointerHandlers}
          isDragging={entry.isDragging}
          hint={atBottom}
        />
      </motion.div>

      {/* Iris blackout during the commit transition — outside the lifting panel. */}
      <BlackoutOverlay active={entry.isTransitioning} />
    </div>
  );
}
