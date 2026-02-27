"use client";

import { motion, AnimatePresence } from "motion/react";

interface BlackoutOverlayProps {
  active: boolean;
}

export function BlackoutOverlay({ active }: BlackoutOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="blackout"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9998, background: "#0a0604" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeIn" }}
        />
      )}
    </AnimatePresence>
  );
}
