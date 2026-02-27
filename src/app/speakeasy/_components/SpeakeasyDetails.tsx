"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";
import { SpeakeasyReveal } from "./SpeakeasyReveal";

interface SpeakeasyDetailsProps {
  menuPdfUrl?: string;
}

export function SpeakeasyDetails({ menuPdfUrl }: SpeakeasyDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full">
      {/* Expandable "about the room" trigger + panel */}
      <SpeakeasyReveal delay={0.4}>
        <div>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="speakeasy-about"
            className="cursor-pointer font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground transition-opacity duration-300 hover:opacity-80"
          >
            {isOpen ? "close" : "about the room"}
          </button>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                id="speakeasy-about"
                key="details"
                initial={
                  prefersReducedMotion
                    ? false
                    : { gridTemplateRows: "0fr", opacity: 0 }
                }
                animate={{ gridTemplateRows: "1fr", opacity: 1 }}
                exit={{ gridTemplateRows: "0fr", opacity: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        gridTemplateRows: {
                          duration: 0.6,
                          ease: EASE_OUT_EXPO,
                        },
                        opacity: { duration: 0.4, ease: "easeInOut" },
                      }
                }
                className="grid w-full"
              >
                <div className="overflow-hidden">
                  <motion.p
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { delay: 0.2, duration: 0.5 }
                    }
                    className="font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.65] text-muted-foreground mt-6 max-w-[520px]"
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
      <SpeakeasyReveal delay={0.6} className="mt-6">
        <a
          href={menuPdfUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border border-foreground px-8 py-4 font-body text-[0.875rem] font-medium tracking-[0.06em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors duration-300"
        >
          See Cocktails
        </a>
      </SpeakeasyReveal>
    </div>
  );
}
