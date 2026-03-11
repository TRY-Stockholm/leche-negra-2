"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { NavBar } from "@/app/components/NavBar";
import { NeonLogo } from "@/app/components/NeonLogo";
import { useWeather } from "@/hooks/useWeather";
import { useIdleState } from "@/hooks/useIdleState";
import { useSpeakeasyAmbience } from "@/hooks/useSpeakeasyAmbience";
import { SpeakeasyBackground } from "./SpeakeasyBackground";
import { SpeakeasyBotanicals } from "./SpeakeasyBotanicals";
import { SpeakeasyDetails } from "./SpeakeasyDetails";
import { SpeakeasyLightPool } from "./SpeakeasyLightPool";
import { SpeakeasySmoke } from "./SpeakeasySmoke";
import { SpeakeasyWhispers } from "./SpeakeasyWhispers";
import { SpeakeasyReveal } from "./SpeakeasyReveal";
import { useMousePosition } from "@/hooks/useMousePosition";
import { useCanHover } from "@/hooks/useCanHover";
import { MenuModal } from "@/app/components/MenuModal";
import type { SiteSettings, CMSMenu } from "@/lib/types";

interface SpeakeasySceneProps {
  menuPdfUrl?: string;
  siteSettings: SiteSettings | null;
  cmsMenus?: CMSMenu[];
}

/**
 * Arrival phases:
 * -1 — Preloader ("be quiet"). Waiting for user gesture.
 *  0 — Total darkness (800ms). Black + grain only.
 *  1 — Ember glow fades in from below (2s transition).
 *  2 — Logo stutters on like a neon tube warming up (~1.2s).
 *  3 — Content reveals begin (staggered, slow).
 */

export function SpeakeasyScene({ menuPdfUrl, siteSettings, cmsMenus }: SpeakeasySceneProps) {
  const router = useRouter();
  const weather = useWeather();
  const prefersReducedMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [phase, setPhase] = useState(prefersReducedMotion ? 3 : -1);
  const [showPatience, setShowPatience] = useState(false);
  const [preloaderDismissed, setPreloaderDismissed] = useState(!!prefersReducedMotion);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { x: mouseX, y: mouseY } = useMousePosition();
  const canHover = useCanHover();
  const isIdle = useIdleState(!prefersReducedMotion && phase >= 3);
  const { startAmbience, toggleMute, isMuted } = useSpeakeasyAmbience(!prefersReducedMotion, isIdle);

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

  const handleExit = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 600);
  }, [router]);

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

      {/* Exit fade overlay */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[10000]"
        style={{ backgroundColor: "var(--background)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

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
        <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} onMenuClick={() => setMenuModalOpen(true)} />
        <MenuModal open={menuModalOpen} onClose={() => setMenuModalOpen(false)} cmsMenus={cmsMenus} />

        {/* Main Content — 12-column grid mirroring homepage */}
        <div className="flex flex-col gap-x-4 px-5 md:px-10 h-[calc(100%-65px)] md:grid md:grid-cols-12 md:grid-rows-[auto_1fr_auto]">
          {/* 411 Logo — stutters on at phase 2, click to exit */}
          <div className="shrink-0 pt-8 md:col-span-5 md:pt-16">
            <div className="max-w-[52%]">
              <button
                onClick={handleExit}
                aria-label="Return to homepage"
                className="cursor-pointer"
                style={{
                  willChange: "opacity",
                  opacity: phase < 2 ? 0 : undefined,
                  animation: phase === 2 ? "speakeasy-neon-stutter 1.2s ease-out forwards" : undefined,
                }}
              >
                <NeonLogo
                  isOff={false}
                  src="/411-logo-neon.svg"
                  label="411"
                />
              </button>
            </div>
          </div>

          {/* Bottom section — always in DOM, opacity-controlled */}
          <div
            className="mt-auto overflow-y-auto pb-4 lg:pb-8 md:col-span-12 md:self-end md:row-start-3"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
            }}
          >
            <SpeakeasyReveal delay={0} duration={1.2}>
              <span className="block mb-2 font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase text-muted-foreground">
                behind the painting
              </span>
            </SpeakeasyReveal>

            {/* Tagline — hero text */}
            <SpeakeasyReveal delay={0.4} duration={1.2}>
              <p
                className="font-display italic text-[clamp(2.5rem,8vw,5.5rem)] font-medium leading-[0.95] text-foreground mb-6"
                style={{
                  textShadow:
                    "0 0 30px color-mix(in srgb, var(--foreground) 20%, transparent), 0 0 60px color-mix(in srgb, var(--foreground) 8%, transparent)",
                }}
              >
                what the walls<br />remember
              </p>
            </SpeakeasyReveal>

            {/* Patience reward */}
            <div
              style={{
                opacity: showPatience ? 1 : 0,
                transition: "opacity 3s ease-in-out",
              }}
            >
              {showPatience && (
                <p className="font-display italic text-[clamp(0.875rem,2vw,1.125rem)] text-muted-foreground mb-6" style={{ opacity: 0.6 }}>
                  you&apos;re still here. good.
                </p>
              )}
            </div>

            {/* Action row */}
            <SpeakeasyDetails menuPdfUrl={menuPdfUrl} isMuted={isMuted} onToggleMute={toggleMute} />
          </div>
        </div>
      </div>

    </div>
  );
}
