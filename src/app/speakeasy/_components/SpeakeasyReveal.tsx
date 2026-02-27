"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";
import type { ReactNode } from "react";

interface SpeakeasyRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
}

export function SpeakeasyReveal({
  children,
  delay = 0,
  duration = 0.8,
  className,
  y = 12,
}: SpeakeasyRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { delay, duration, ease: EASE_OUT_EXPO }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
