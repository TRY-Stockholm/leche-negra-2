"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { MenuKey } from "@/lib/types";
import { menus } from "@/data/menus";
import { EASE_OUT_EXPO } from "@/lib/constants";

export function MenuPanel({
  activeMenu,
  onClose,
}: {
  activeMenu: MenuKey | null;
  onClose: () => void;
}) {
  const panelEndRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence mode="wait">
      {activeMenu && (
        <motion.div
          key={activeMenu}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { duration: 0.6, ease: EASE_OUT_EXPO },
            opacity: { duration: 0.4, ease: "easeInOut" },
          }}
          onAnimationComplete={(definition) => {
            if (
              (definition as { height?: string }).height === "auto" &&
              window.innerWidth < 1024
            ) {
              panelEndRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
              });
            }
          }}
          className="overflow-hidden"
        >
          <div className="border-t border-border pt-8 pb-4 mt-6">
            {/* Header */}
            <div className="flex items-baseline justify-between mb-6">
              <span className="font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground">
                {menus[activeMenu].hours}
              </span>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-accent cursor-pointer font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase"
              >
                Close
              </button>
            </div>

            {/* Intro text */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-muted-foreground mb-8 font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.6] max-w-[520px]"
            >
              {menus[activeMenu].intro}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT_EXPO }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <a
                href="#"
                className="inline-flex items-center justify-center border border-foreground px-8 py-4 font-display text-[clamp(0.875rem,1.5vw,1.0625rem)] font-medium tracking-[0.04em] uppercase hover:bg-foreground hover:text-background transition-colors duration-300"
              >
                Book a Table
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center border border-muted-foreground/40 px-8 py-4 font-display text-[clamp(0.875rem,1.5vw,1.0625rem)] font-medium tracking-[0.04em] uppercase hover:border-foreground transition-colors duration-300"
              >
                See Menu
              </a>
            </motion.div>
            <div ref={panelEndRef} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
