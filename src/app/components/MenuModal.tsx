"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { MenuKey, CMSMenu } from "@/lib/types";
import { menus } from "@/data/menus";

const MENU_OPTIONS: { key: MenuKey; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "drinks", label: "Drinks" },
];

const MENU_KEY_TO_TITLE: Record<MenuKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  drinks: "Drinks",
};

import { BOOKING_WIDGET_HASH } from "@/lib/constants";

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
  cmsMenus?: CMSMenu[];
}

export const MenuModal = memo(function MenuModal({
  open,
  onClose,
  cmsMenus,
}: MenuModalProps) {
  const [selectedMenu, setSelectedMenu] = useState<MenuKey | null>(null);

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) setSelectedMenu(null);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedMenu) {
          setSelectedMenu(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selectedMenu, onClose]);

  const cmsMenu = selectedMenu
    ? cmsMenus?.find(
        (m) =>
          m.title.toLowerCase() ===
          MENU_KEY_TO_TITLE[selectedMenu].toLowerCase(),
      )
    : undefined;

  const menuData = selectedMenu ? menus[selectedMenu] : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center justify-center h-full px-8">
            <AnimatePresence mode="wait">
              {!selectedMenu ? (
                /* ── Picker view ── */
                <motion.div
                  key="picker"
                  className="relative flex flex-col items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Mirror illustration — bottom right corner */}
                  <motion.img
                    src="/mirror.svg"
                    alt=""
                    aria-hidden
                    className="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-[160px] md:w-[280px] pointer-events-none select-none"
                    initial={{ opacity: 0, y: 20, rotate: 15 }}
                    animate={{ opacity: 0.35, y: 0, rotate: 10 }}
                    transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />

                  {MENU_OPTIONS.map((option, i) => (
                    <motion.button
                      key={option.key}
                      onClick={() => setSelectedMenu(option.key)}
                      className="font-display italic text-[2rem] text-accent-foreground hover:text-accent transition-colors duration-200 py-2 cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.08 + i * 0.06,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      {option.label}
                    </motion.button>
                  ))}

                  {/* Close link */}
                  <motion.button
                    onClick={onClose}
                    className="mt-6 font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    aria-label="Close menu"
                  >
                    Close
                  </motion.button>
                </motion.div>
              ) : (
                /* ── Viewer view ── */
                <motion.div
                  key={selectedMenu}
                  className="flex flex-col items-center max-w-[520px] w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {/* Hours */}
                  <span className="font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground mb-4">
                    {cmsMenu?.hours ?? menuData!.hours}
                  </span>

                  {/* Title */}
                  <h2 className="font-display italic text-[2rem] mb-6">
                    {MENU_KEY_TO_TITLE[selectedMenu]}
                  </h2>

                  {/* Intro */}
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="text-muted-foreground mb-8 font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.6] text-center"
                  >
                    {cmsMenu?.intro ?? menuData!.intro}
                  </motion.p>

                  {/* CTA buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-3 mb-8"
                  >
                    <button
                      className="waiteraid-widget inline-flex items-center justify-center border border-foreground px-8 py-4 font-display text-[clamp(0.875rem,1.5vw,1.0625rem)] font-medium tracking-[0.04em] uppercase hover:bg-foreground hover:text-background transition-colors duration-300 cursor-pointer"
                      data-hash={BOOKING_WIDGET_HASH}
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

                  {/* Back + Close */}
                  <div className="flex gap-6">
                    <button
                      onClick={() => setSelectedMenu(null)}
                      className="font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
                      aria-label="Back to menu list"
                    >
                      Back
                    </button>
                    <button
                      onClick={onClose}
                      className="font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground hover:text-accent transition-colors duration-200 cursor-pointer"
                      aria-label="Close menu"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
