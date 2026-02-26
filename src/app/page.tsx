"use client";

import { useState, useCallback, useEffect } from "react";
import type { Theme, MenuKey } from "@/lib/types";
import { menuThemeMap, isLightTheme } from "@/lib/constants";
import { NeonLogo } from "./components/NeonLogo";
import { useWeather } from "@/hooks/useWeather";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { MenuPanel } from "./components/MenuPanel";
import { NavBar } from "./components/NavBar";
import { BracketLink } from "./components/BracketLink";
import {
  TapeDeckProvider,
  useTapeDeck,
  Boombox,
  CassetteTape,
} from "./components/tape-deck";

const TAPE_THEME_MAP: Record<string, Theme> = {
  morning: "morning",
  midday: "lunch",
  evening: "dinner",
  night: "night",
};

export default function App() {
  return (
    <TapeDeckProvider>
      <PageContent />
    </TapeDeckProvider>
  );
}

function PageContent() {
  const weather = useWeather();
  const timeTheme = useTimeTheme();
  const { loadedTapeId } = useTapeDeck();
  const [hoverTheme, setHoverTheme] = useState<Theme | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);

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

  const onMenuHover = useCallback(
    (theme: Theme) => {
      if (!openMenu && !loadedTapeId) setHoverTheme(theme);
    },
    [openMenu, loadedTapeId],
  );

  const onMenuLeave = useCallback(() => {
    if (!openMenu && !loadedTapeId) setHoverTheme(null);
  }, [openMenu, loadedTapeId]);

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

  return (
    <div
      className={`min-h-screen overflow-x-hidden bg-background text-foreground font-body ${activeTheme ? `theme-${activeTheme}` : ""}`}
    >
      <NavBar weather={weather} />

      {/* Main Content — 12-column grid */}
      <div className="grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-x-4 px-5 md:px-10 min-h-[calc(100vh-52px)]">
        {/* Logo */}
        <div className="col-span-12 row-start-1 self-start pt-8 md:col-span-6 md:pt-12">
          <NeonLogo isOff={isLightTheme(activeTheme)} />

          <div className="mt-10 md:mt-16 font-display text-[clamp(1.25rem,3vw,2rem)] leading-[1.15] font-medium tracking-[-0.015em]" />
        </div>

        {/* Menu section */}
        <div className="col-span-12 row-start-2 md:col-span-6 md:row-start-2">
          <div className="mt-16">
            <p className="mb-5 text-muted-foreground font-body text-xs font-medium tracking-[0.06em] uppercase">
              <span>Menus: </span>
              <em className="font-display italic">Four</em>
              <span> Moments</span>
            </p>

            {/* Menu items grid */}
            <div className="font-display text-[clamp(3rem,8vw,6.25rem)] font-medium leading-[0.95] tracking-[-0.03em]">
              <div className="flex items-baseline flex-wrap">
                <span
                  className="cursor-pointer"
                  onClick={() => handleMenuClick("breakfast")}
                >
                  Breakfast
                </span>
                <span className="text-muted-foreground mx-1">/</span>
                <span
                  className="cursor-pointer"
                  onClick={() => handleMenuClick("lunch")}
                >
                  Lunch
                </span>
              </div>
              <div className="flex items-baseline flex-wrap">
                <span
                  className="cursor-pointer"
                  onClick={() => handleMenuClick("dinner")}
                >
                  Dinner
                </span>
                <span className="text-muted-foreground mx-1">/</span>
                <span
                  className="cursor-pointer italic"
                  onClick={() => handleMenuClick("drinks")}
                >
                  Drinks
                </span>
              </div>
            </div>

            <MenuPanel activeMenu={openMenu} onClose={handleMenuClose} />

            {/* Menu legend */}
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase">
              <span>07:00 – 11:00</span>
              <span>11:30 – 14:30</span>
              <span>17:00 – 22:00</span>
              <span className="text-accent">All Day</span>
            </div>
          </div>
        </div>

        {/* Invitation */}
        <div className="col-span-12 row-start-3 md:col-start-7 md:col-span-6 md:row-start-2 md:self-end md:pb-12">
          <div className="mt-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end">
              <div>
                <p className="mb-4 text-muted-foreground font-display italic text-[0.8125rem] tracking-[0.02em] uppercase">
                  The Invitation
                </p>
                <div className="font-display text-[clamp(1.75rem,5vw,3rem)] leading-[1.15] font-medium tracking-[-0.015em]">
                  <p>Reserve a Table</p>
                  <p>The Bar</p>
                  <p>Find Us</p>
                </div>
              </div>

              <div className="mt-8 md:mt-0 text-right">
                <p className="mb-4 text-muted-foreground font-display italic text-[0.8125rem] tracking-[0.02em] uppercase">
                  Inte <span className="not-italic">Lagom</span>
                </p>
                <div className="font-display text-[clamp(1rem,2.5vw,1.5rem)] leading-[1.5] font-medium">
                  <BracketLink>Reserve</BracketLink>
                  <BracketLink>Kvällsmeny</BracketLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boombox — right side */}
        <div className="col-span-12 row-start-4 flex justify-center py-8 overflow-visible md:col-start-7 md:col-span-5 md:row-start-1 md:self-center md:py-0">
          <Boombox brandName="LECHE NEGRA" brandSubtitle="TAPE DECK" />
        </div>

        {/* Cassette tapes — scattered near boombox */}
        <CassetteTape
          id="morning"
          className="col-span-3 row-start-5 self-center pb-8 md:pb-0 md:col-start-7 md:col-span-2 md:row-start-2 md:self-start md:mt-8"
          style={{ rotate: '-5deg' }}
        />
        <CassetteTape
          id="midday"
          className="col-span-3 col-start-4 row-start-5 self-center pb-8 md:pb-0 md:col-start-11 md:col-span-2 md:row-start-1 md:self-center"
          style={{ rotate: '3deg' }}
        />
        <CassetteTape
          id="evening"
          className="col-span-3 col-start-7 row-start-5 self-center pb-8 md:pb-0 md:col-start-9 md:col-span-2 md:row-start-2 md:self-start md:mt-12"
          style={{ rotate: '7deg' }}
        />
        <CassetteTape
          id="night"
          className="col-span-3 col-start-10 row-start-5 self-center pb-8 md:pb-0 md:col-start-11 md:col-span-2 md:row-start-2 md:self-start md:mt-4"
          style={{ rotate: '-3deg' }}
        />

      </div>
    </div>
  );
}
