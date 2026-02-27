"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";
import { SpeakeasyReveal } from "./SpeakeasyReveal";

interface SpeakeasyDetailsProps {
  menuPdfUrl?: string;
}

export function SpeakeasyDetails({ menuPdfUrl }: SpeakeasyDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      {/* Expandable "about the room" trigger + panel */}
      <SpeakeasyReveal delay={0.6} className="w-full">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="cursor-pointer font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase transition-opacity duration-300 hover:opacity-80"
            style={{ color: "rgba(107,29,42,0.4)" }}
          >
            {isOpen ? "close" : "about the room"}
          </button>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key="details"
                initial={{ gridTemplateRows: "0fr", opacity: 0 }}
                animate={{ gridTemplateRows: "1fr", opacity: 1 }}
                exit={{ gridTemplateRows: "0fr", opacity: 0 }}
                transition={{
                  gridTemplateRows: { duration: 0.6, ease: EASE_OUT_EXPO },
                  opacity: { duration: 0.4, ease: "easeInOut" },
                }}
                className="grid w-full"
              >
                <div className="overflow-hidden">
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.65] text-center mt-6"
                    style={{ color: "rgba(107,29,42,0.7)" }}
                  >
                    Behind the painting, past the lady with still lips — a room
                    that trades in whispers and well-kept secrets. The cocktails
                    here have no names you&apos;ll remember by morning.
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SpeakeasyReveal>

      {/* Menu PDF button */}
      <SpeakeasyReveal delay={0.8}>
        <a
          href={menuPdfUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border px-8 py-4 font-body text-[0.875rem] font-medium tracking-[0.06em] uppercase transition-all duration-400"
          style={{
            color: "#8b2236",
            borderColor: "#8b2236",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#8b2236";
            e.currentTarget.style.color = "#0a0604";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(139,34,54,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#8b2236";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          See Cocktails
        </a>
      </SpeakeasyReveal>
    </div>
  );
}
