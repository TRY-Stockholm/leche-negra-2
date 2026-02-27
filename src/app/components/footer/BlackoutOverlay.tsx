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
          key="iris"
          className="fixed pointer-events-none rounded-full"
          style={{
            zIndex: 9998,
            top: "50%",
            left: "50%",
            boxShadow: "0 0 0 100vmax #0a0604",
          }}
          initial={{ width: "300vmax", height: "300vmax", x: "-50%", y: "-50%" }}
          animate={{ width: 0, height: 0, x: "-50%", y: "-50%" }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </AnimatePresence>
  );
}
