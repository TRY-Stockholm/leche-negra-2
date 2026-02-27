"use client";

import { motion } from "motion/react";
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
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
