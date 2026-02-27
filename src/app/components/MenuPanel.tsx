"use client";

import { useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { MenuKey, CMSMenu } from "@/lib/types";
import { menus } from "@/data/menus";
import { EASE_OUT_EXPO } from "@/lib/constants";

const MENU_KEY_TO_TITLE: Record<MenuKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  drinks: "Drinks",
};

interface MenuPanelProps {
  activeMenu: MenuKey | null;
  onClose: () => void;
  cmsMenus?: CMSMenu[];
  bookingUrl?: string | null;
}

export const MenuPanel = memo(function MenuPanel({
  activeMenu,
  onClose,
  cmsMenus,
  bookingUrl,
}: MenuPanelProps) {
  const panelEndRef = useRef<HTMLDivElement>(null);

  const cmsMenu = activeMenu
    ? cmsMenus?.find(
        (m) =>
          m.title.toLowerCase() ===
          MENU_KEY_TO_TITLE[activeMenu].toLowerCase(),
      )
    : undefined;

  return (
    <AnimatePresence mode="wait">
      {activeMenu && (
        <motion.div
          key={activeMenu}
          initial={{ gridTemplateRows: "0fr", opacity: 0 }}
          animate={{ gridTemplateRows: "1fr", opacity: 1 }}
          exit={{ gridTemplateRows: "0fr", opacity: 0 }}
          transition={{
            gridTemplateRows: { duration: 0.6, ease: EASE_OUT_EXPO },
            opacity: { duration: 0.4, ease: "easeInOut" },
          }}
          onAnimationComplete={(definition) => {
            if (
              (definition as { opacity?: number }).opacity === 1 &&
              window.innerWidth < 1024
            ) {
              panelEndRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
              });
            }
          }}
          className="grid"
        >
          <div className="overflow-hidden">
            <div className="squiggly-border-t pt-8 pb-4 mt-6">
              {/* Header */}
              <div className="flex items-baseline justify-between mb-6">
                <span className="font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground">
                  {cmsMenu?.hours ?? menus[activeMenu].hours}
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
                {cmsMenu?.intro ?? menus[activeMenu].intro}
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT_EXPO }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <button
                  className="waiteraid-widget inline-flex items-center justify-center border border-foreground px-8 py-4 font-display text-[clamp(0.875rem,1.5vw,1.0625rem)] font-medium tracking-[0.04em] uppercase hover:bg-foreground hover:text-background transition-colors duration-300 cursor-pointer"
                  data-hash="dd34bd1ef6c76ba44556cd74fbb9fd3"
                >
                  Book a Table
                </button>
                {cmsMenu?.pdfUrl && (
                  <a
                    href={cmsMenu.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center border border-muted-foreground/40 px-8 py-4 font-display text-[clamp(0.875rem,1.5vw,1.0625rem)] font-medium tracking-[0.04em] uppercase hover:border-foreground transition-colors duration-300"
                  >
                    See Menu
                  </a>
                )}
              </motion.div>
              <div ref={panelEndRef} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
