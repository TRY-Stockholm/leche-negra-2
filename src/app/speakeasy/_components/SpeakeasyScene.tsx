"use client";

import { useState, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { NavBar } from "@/app/components/NavBar";
import { useWeather } from "@/hooks/useWeather";
import { useIdleState } from "@/hooks/useIdleState";
import { useSpeakeasyAmbience } from "@/hooks/useSpeakeasyAmbience";
import { SpeakeasyBackground } from "./SpeakeasyBackground";
import { SpeakeasyBotanicals } from "./SpeakeasyBotanicals";
import { SpeakeasyLightPool } from "./SpeakeasyLightPool";
import { SpeakeasySmoke } from "./SpeakeasySmoke";
import { SpeakeasyWhispers } from "./SpeakeasyWhispers";
import { useMousePosition } from "@/hooks/useMousePosition";
import { useCanHover } from "@/hooks/useCanHover";
import { MenuModal } from "@/app/components/MenuModal";
import { NoctuairesHero } from "@/app/components/noctuaires/NoctuairesHero";
import type { SiteSettings, CMSMenu } from "@/lib/types";

interface SpeakeasySceneProps {
  menuPdfUrl?: string;
  siteSettings: SiteSettings | null;
  cmsMenus?: CMSMenu[];
}

/**
 * Arrival phases:
 * -1 — Preloader ("be curious"). Waiting for user gesture.
 *  0 — Total darkness (800ms). Black + grain only.
 *  1 — Ember glow fades in from below (2s transition).
 *  2 — Logo materializes via GSAP timeline (~2.5s).
 *  3 — Ambient layers fully active.
 */

export function SpeakeasyScene({ menuPdfUrl, siteSettings, cmsMenus }: SpeakeasySceneProps) {
  const weather = useWeather();
  const prefersReducedMotion = useReducedMotion();
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [phase, setPhase] = useState(prefersReducedMotion ? 3 : -1);
  const [showPatience, setShowPatience] = useState(false);
  const [preloaderDismissed, setPreloaderDismissed] = useState(!!prefersReducedMotion);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { x: mouseX, y: mouseY } = useMousePosition();
  const canHover = useCanHover();
  const isIdle = useIdleState(!prefersReducedMotion && phase >= 3);
  const { startAmbience } = useSpeakeasyAmbience(!prefersReducedMotion, isIdle);

  // Preloader shows for 2.5s, then phase sequence begins
  useEffect(() => {
    if (prefersReducedMotion) return;
    const dismiss = setTimeout(() => {
      setPreloaderDismissed(true);
      try { startAmbience(); } catch { /* audio is optional */ }
    }, 2500);
    const t0 = setTimeout(() => setPhase(0), 2500);
    const t1 = setTimeout(() => setPhase(1), 3300);
    const t2 = setTimeout(() => setPhase(2), 5300);
    const t3 = setTimeout(() => setPhase(3), 6700);
    timerRefs.current = [dismiss, t0, t1, t2, t3];
    return () => timerRefs.current.forEach(clearTimeout);
  }, [prefersReducedMotion, startAmbience]);

  // Patience reward: "you're still here. good." after 60s from phase 3
  useEffect(() => {
    if (prefersReducedMotion || phase < 3) return;
    const t = setTimeout(() => setShowPatience(true), 60000);
    return () => clearTimeout(t);
  }, [prefersReducedMotion, phase]);

  return (
    <div
      data-scene="speakeasy"
      className="relative h-dvh overflow-hidden bg-background text-foreground font-body"
      style={{ isolation: "isolate" }}
    >
      <SpeakeasyBackground phase={phase} isIdle={isIdle} />
      <SpeakeasyBotanicals mouseX={canHover ? mouseX : undefined} mouseY={canHover ? mouseY : undefined} />
      <SpeakeasyLightPool visible={phase >= 1} />
      <SpeakeasySmoke visible={phase >= 2} />
      <SpeakeasyWhispers mouseX={mouseX} mouseY={mouseY} visible={phase >= 3} />

      {/* Preloader — timed, then fades out */}
      {!prefersReducedMotion && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            backgroundColor: "#460b08",
            opacity: preloaderDismissed ? 0 : 1,
            transition: "opacity 0.8s ease-in-out",
            pointerEvents: preloaderDismissed ? "none" : "auto",
          }}
        >
          <p
            className="font-display italic text-[clamp(1.5rem,5vw,3rem)] select-none"
            style={{
              color: "#e43122",
              opacity: preloaderDismissed ? 0 : 0.7,
              transition: "opacity 1.5s ease-out 0.3s",
            }}
          >
            Be curious
          </p>
        </div>
      )}

      {/* Content layer */}
      <div className="relative z-10 h-full bg-transparent">
        <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} onMenuClick={() => setMenuModalOpen(true)} showBooking={siteSettings?.showBooking ?? true} backHref="/" addressMapUrl={siteSettings?.addressMapUrl} />
        <MenuModal open={menuModalOpen} onClose={() => setMenuModalOpen(false)} cmsMenus={cmsMenus} />

        <NoctuairesHero
          phase={phase}
          menuPdfUrl={menuPdfUrl}
          showPatience={showPatience}
          mood={siteSettings?.speakeasyMood ?? undefined}
        />
      </div>
    </div>
  );
}
