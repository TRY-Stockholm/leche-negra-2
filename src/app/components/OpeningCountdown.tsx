"use client";

import { motion } from "motion/react";
import { BOOKING_WIDGET_HASH, EASE_OUT_EXPO } from "@/lib/constants";

const NEON_GLOW =
  "0 0 8px var(--accent), 0 0 20px var(--accent), 0 0 60px var(--accent)";

/**
 * Landing reservations block. Reservations are open, so this always shows the
 * "Reservations now open" headline with a "Book a table" call-to-action that
 * opens the WaiterAid booking widget (same mechanism as the navbar).
 */
export function OpeningCountdown() {
  return (
    <div className="col-span-12 self-end row-start-4 pb-6 lg:pb-8">
      <motion.div
        className="flex flex-col items-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      >
        <motion.p
          className="font-display italic text-[clamp(2rem,5vw,4rem)] text-accent leading-tight"
          style={{ textShadow: NEON_GLOW }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          Reservations now open
        </motion.p>

        <motion.button
          type="button"
          className="waiteraid-widget squiggle-hover cursor-pointer mt-4 self-start font-display italic text-[clamp(1.125rem,2.4vw,1.75rem)] text-foreground transition-opacity duration-300 hover:opacity-80"
          data-hash={BOOKING_WIDGET_HASH}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE_OUT_EXPO }}
        >
          Book a table <span aria-hidden="true">&rarr;</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
