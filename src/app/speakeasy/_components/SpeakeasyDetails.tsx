"use client";

import { useState, useEffect, useRef } from "react";
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
      <SpeakeasyReveal delay={1.0}>
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
                  <div className="font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.65] text-muted-foreground mt-6 max-w-[520px]">
                    {prefersReducedMotion ? (
                      <p>
                        Behind the painting, past the lady with still lips — a room
                        that trades in whispers and well-kept secrets. The cocktails
                        here have no names you&apos;ll remember by morning.
                      </p>
                    ) : (
                      <TypewriterText
                        text="Behind the painting, past the lady with still lips \u2014 a room that trades in whispers and well-kept secrets. The cocktails here have no names you\u2019ll remember by morning."
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SpeakeasyReveal>

      {/* Smoldering menu PDF button */}
      <SpeakeasyReveal delay={1.4} className="mt-6">
        <div className="speakeasy-button-wrap inline-block">
          <a
            href={menuPdfUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center justify-center border border-foreground px-8 py-4 font-body text-[0.875rem] font-medium tracking-[0.06em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors duration-300"
          >
            See Cocktails
          </a>
        </div>
      </SpeakeasyReveal>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const iRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function type() {
      if (iRef.current >= text.length) {
        setTimeout(() => setShowCursor(false), 2000);
        return;
      }
      iRef.current++;
      setDisplayed(text.slice(0, iRef.current));

      const char = text[iRef.current - 1];
      let delay = 35 + Math.random() * 25;
      if (char === "," || char === ";") delay = 180 + Math.random() * 80;
      if (char === "." || char === "!" || char === "?") delay = 280 + Math.random() * 120;
      if (char === "\u2014" || char === "\u2013") delay = 220 + Math.random() * 80;
      if (char === " ") delay = 25 + Math.random() * 15;

      timerRef.current = setTimeout(type, delay);
    }

    // Small initial delay for the panel to expand
    timerRef.current = setTimeout(type, 400);
    return () => clearTimeout(timerRef.current);
  }, [text]);

  return (
    <p>
      {displayed}
      {showCursor && (
        <span
          className="inline-block w-[2px] h-[1em] ml-[1px] align-middle"
          style={{
            backgroundColor: "#d44444",
            animation: "speakeasy-cursor-blink 0.8s step-end infinite",
          }}
        />
      )}
    </p>
  );
}
