"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";
import { OPENING_DATE } from "@/lib/featureFlags";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(): TimeLeft | "expired" | null {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | "expired" | null>(null);

  useEffect(() => {
    const compute = (): TimeLeft | "expired" => {
      const diff = OPENING_DATE.getTime() - Date.now();
      if (diff <= 0) return "expired";
      return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      };
    };
    const result = compute();
    setTimeLeft(result);
    if (result === "expired") return;
    const id = setInterval(() => {
      const next = compute();
      setTimeLeft(next);
      if (next === "expired") clearInterval(id);
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

const UNITS = ["Days", "Hours", "Minutes", "Seconds"] as const;

const NEON_GLOW =
  "0 0 8px var(--accent), 0 0 20px var(--accent), 0 0 60px var(--accent)";

function Digit({ value, unit, index }: { value: number; unit: string; index: number }) {
  const display = String(value).padStart(2, "0");

  return (
    <motion.div
      className="flex flex-col items-center min-w-[clamp(3rem,10vw,7rem)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.08 + index * 0.06,
        ease: EASE_OUT_EXPO,
      }}
    >
      <div className="relative overflow-hidden flex items-center py-[30px] -my-[30px] px-[30px] -mx-[30px]">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            className="font-display italic text-[clamp(2.5rem,8vw,6rem)] leading-none text-accent tabular-nums"
            style={{ textShadow: NEON_GLOW }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase text-muted-foreground mt-3">
        {unit}
      </span>
    </motion.div>
  );
}

export function OpeningCountdown() {
  const timeLeft = useCountdown();

  // Before hydration — render empty to avoid mismatch
  if (timeLeft === null) return null;

  const values = timeLeft !== "expired"
    ? [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds]
    : null;

  return (
    <div className="col-span-12 self-end row-start-4 pb-6 lg:pb-8">
      <motion.div
        className="flex flex-col items-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      >
        <motion.p
          className="font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase text-muted-foreground mb-2 lg:mb-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: EASE_OUT_EXPO }}
        >
          Opening for reservations
        </motion.p>

        {values ? (
          <div className="flex gap-6 sm:gap-8 lg:gap-12">
            {UNITS.map((unit, i) => (
              <Digit key={unit} value={values[i]} unit={unit} index={i} />
            ))}
          </div>
        ) : (
          <motion.p
            className="font-display italic text-[clamp(2rem,5vw,4rem)] text-accent leading-tight"
            style={{ textShadow: NEON_GLOW }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            Reservations now open
          </motion.p>
        )}

        <motion.p
          className="font-display italic text-[clamp(0.875rem,2vw,1.25rem)] text-muted-foreground mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: EASE_OUT_EXPO }}
        >
          Wednesday, April 8
        </motion.p>
      </motion.div>
    </div>
  );
}
