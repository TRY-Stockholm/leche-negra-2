"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
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

export function SpeakeasyScene({ menuPdfUrl, siteSettings }: SpeakeasySceneProps) {
  const router = useRouter();
  const weather = useWeather();
  const [isExiting, setIsExiting] = useState(false);

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
      <SpeakeasyBackground />
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
      <div className="relative z-10 min-h-screen bg-background">
        <NavBar weather={weather} bookingUrl={siteSettings?.bookingUrl} />

        {/* Main Content — 12-column grid mirroring homepage */}
        <div className="grid grid-cols-12 lg:grid-rows-[auto_1fr_auto] gap-x-4 px-5 md:px-10 min-h-[calc(100vh-65px)]">
          {/* 411 Logo — same position as homepage logo, neon glow effect */}
          <div className="col-span-12 row-start-1 self-start pt-8 md:col-span-5 md:pt-16">
            <NeonLogo
              isOff={false}
              src="/411-logo-neon.svg"
              label="411"
            />
          </div>

          {/* 411 section — bottom, mirroring menu section */}
          <div className="col-span-12 self-end row-start-4 pb-4 lg:pb-8">
            <SpeakeasyReveal delay={0}>
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
            <SpeakeasyReveal delay={0.2}>
              <p className="font-display italic text-[clamp(1rem,2.5vw,1.5rem)] text-muted-foreground mb-6">
                what the walls remember
              </p>
            </SpeakeasyReveal>

            <SpeakeasyDetails menuPdfUrl={menuPdfUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
