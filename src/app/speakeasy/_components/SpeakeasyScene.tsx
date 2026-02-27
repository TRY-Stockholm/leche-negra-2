"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { SpeakeasyBackground } from "./SpeakeasyBackground";
import { SpeakeasyBotanicals } from "./SpeakeasyBotanicals";
import { SpeakeasyHeader } from "./SpeakeasyHeader";
import { SpeakeasyDetails } from "./SpeakeasyDetails";
import { SpeakeasyReveal } from "./SpeakeasyReveal";

interface SpeakeasySceneProps {
  menuPdfUrl?: string;
}

export function SpeakeasyScene({ menuPdfUrl }: SpeakeasySceneProps) {
  const router = useRouter();
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
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "#0a0604" }}
    >
      <SpeakeasyBackground />
      <SpeakeasyBotanicals />

      {/* Exit fade overlay */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50"
        style={{ backgroundColor: "#0a0604" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <SpeakeasyHeader />

        <div className="mt-12">
          <SpeakeasyDetails menuPdfUrl={menuPdfUrl} />
        </div>

        {/* Return link — quiet, nearly invisible */}
        <SpeakeasyReveal delay={1.0} className="mt-16">
          <button
            onClick={handleExit}
            aria-label="Return to homepage"
            className="cursor-pointer font-body text-[0.6875rem] tracking-[0.04em] lowercase transition-opacity duration-300 hover:opacity-60"
            style={{ color: "rgba(107,29,42,0.25)" }}
          >
            surface
          </button>
        </SpeakeasyReveal>
      </div>
    </div>
  );
}
