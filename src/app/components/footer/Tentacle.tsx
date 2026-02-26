"use client";

import { motion, AnimatePresence } from "motion/react";

const MAX_ROTATE = 8;

export function Tentacle({ show }: { show: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
      <AnimatePresence>
        {show && (
          <motion.img
            key="tentacle"
            src="/tentacle.png"
            alt=""
            className="absolute pointer-events-none"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 50,
              damping: 16,
              mass: 1.4,
            }}
            style={{
              height: "110%",
              width: "auto",
              left: "50%",
              bottom: "-15%",
              x: "-50%",
              transformOrigin: "50% 100%",
              filter:
                "drop-shadow(0 0 12px rgba(228,49,34,0.4)) drop-shadow(0 0 30px rgba(228,49,34,0.15))",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
