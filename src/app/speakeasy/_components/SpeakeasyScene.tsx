"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { NavBar } from "@/app/components/NavBar";
import { NeonLogo } from "@/app/components/NeonLogo";
import { useWeather } from "@/hooks/useWeather";
import { SpeakeasyBackground } from "./SpeakeasyBackground";
import { SpeakeasyBotanicals } from "./SpeakeasyBotanicals";
import { SpeakeasyDetails } from "./SpeakeasyDetails";
import { SpeakeasyReveal } from "./SpeakeasyReveal";
import type { SiteSettings } from "@/lib/types";

interface SpeakeasySceneProps {
  menuPdfUrl?: string;
  siteSettings: SiteSettings | null;
}

/**
 * Arrival phases:
 * 0 — Total darkness (800ms). Black + grain only.
 * 1 — Ember glow fades in from below (2s transition).
 * 2 — Logo stutters on like a neon tube warming up (~1.2s).
 * 3 — Content reveals begin (staggered, slow).
 */

export function SpeakeasyScene({ menuPdfUrl, siteSettings }: SpeakeasySceneProps) {
  const router = useRouter();
  const weather = useWeather();
  const prefersReducedMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const [phase, setPhase] = useState(prefersReducedMotion ? 3 : 0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const t1 = setTimeout(() => setPhase(1), 800);    // ember glow
    const t2 = setTimeout(() => setPhase(2), 2800);   // logo stutter
    const t3 = setTimeout(() => setPhase(3), 4200);   // content reveals
    timerRefs.current = [t1, t2, t3];
    return () => timerRefs.current.forEach(clearTimeout);
  }, [prefersReducedMotion]);

  const handleExit = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 600);
  }, [router]);

  return (
    <div
      data-scene="speakeasy"
      className="relative min-h-screen overflow-hidden bg-background text-foreground font-body"
      style={{ isolation: "isolate" }}
    >
      <SpeakeasyBackground phase={phase} />
      <SpeakeasyBotanicals />

      {/* Exit fade overlay */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[10000]"
        style={{ backgroundColor: "#0a0604" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Content layer */}
      <div className="relative z-10 min-h-screen bg-transparent">
        <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} />

        {/* Main Content — 12-column grid mirroring homepage */}
        <div className="grid grid-cols-12 lg:grid-rows-[auto_1fr_auto] gap-x-4 px-5 md:px-10 min-h-[calc(100vh-65px)]">
          {/* 411 Logo — stutters on at phase 2 */}
          <div className="col-span-12 row-start-1 self-start pt-8 md:col-span-5 md:pt-16">
            <div className="max-w-[52%]">
              <div
                style={{
                  opacity: phase < 2 ? 0 : undefined,
                  animation: phase === 2 ? "speakeasy-neon-stutter 1.2s ease-out forwards" : undefined,
                }}
              >
                <NeonLogo
                  isOff={false}
                  src="/411-logo-neon.svg"
                  label="411"
                />
              </div>
            </div>
          </div>

          {/* 411 section — bottom, reveals at phase 3 */}
          {phase >= 3 && (
            <div className="col-span-12 self-end row-start-4 pb-4 lg:pb-8">
              <SpeakeasyReveal delay={0} duration={1.2}>
                <div className="mb-4">
                  <span className="block mb-2 font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase text-muted-foreground">
                    Behind the painting
                  </span>
                  <button
                    onClick={handleExit}
                    aria-label="Return to homepage"
                    className="cursor-pointer text-left"
                  >
                    <span
                      className="font-display text-[clamp(2.5rem,8vw,5.5rem)] font-medium leading-[0.95] italic text-foreground"
                      style={{
                        textShadow:
                          "0 0 30px rgba(212,68,68,0.2), 0 0 60px rgba(212,68,68,0.08)",
                      }}
                    >
                      411
                    </span>
                  </button>
                </div>
              </SpeakeasyReveal>

              {/* Tagline */}
              <SpeakeasyReveal delay={0.6} duration={1.2}>
                <p className="font-display italic text-[clamp(1rem,2.5vw,1.5rem)] text-muted-foreground mb-6">
                  what the walls remember
                </p>
              </SpeakeasyReveal>

              <SpeakeasyDetails menuPdfUrl={menuPdfUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
