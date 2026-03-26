"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { MenuKey, Theme } from "@/lib/types";
import { isLightTheme } from "@/lib/constants";

interface AmbientIllustrationsProps {
  activeMenu: MenuKey | null;
  activeTheme: Theme | null;
}

/* ── Spray particle ── */
interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
}

let particleId = 0;

function ParfumBottle({ illustrationFilter }: { illustrationFilter: string }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [spraying, setSpraying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spray = useCallback(() => {
    setSpraying(true);
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      // Spray upward in a cone (-40deg to -140deg from horizontal)
      const angle = -40 - Math.random() * 100;
      const distance = 30 + Math.random() * 60;
      const size = 2 + Math.random() * 4;
      newParticles.push({
        id: ++particleId,
        x: 0,
        y: 0,
        angle,
        distance,
        size,
        delay: Math.random() * 0.15,
      });
    }
    setParticles(newParticles);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setParticles([]);
      setSpraying(false);
    }, 1200);
  }, []);

  return (
    <div className="hidden md:block col-start-6 col-span-1 row-start-1 self-end mb-8 select-none">
      <motion.div
        className="relative cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.4, 0.65, 0.4],
          y: [0, -6, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ rotate: "5deg" }}
        onClick={spray}
        role="button"
        aria-label="Spray perfume"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") spray(); }}
      >
        <motion.img
          src="/parfum.svg"
          alt=""
          aria-hidden
          className="w-[120px] transition-[filter] duration-800"
          style={{ filter: illustrationFilter }}
          animate={spraying ? { scale: [1, 0.96, 1] } : {}}
          transition={{ duration: 0.2 }}
        />

        {/* Spray particles */}
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;
          return (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                left: "45%",
                top: "8%",
                backgroundColor: "var(--foreground)",
              }}
              initial={{ x: 0, y: 0, opacity: 0.6, scale: 0.5 }}
              animate={{ x: tx, y: ty, opacity: 0, scale: 1.5 }}
              transition={{
                duration: 0.6 + Math.random() * 0.4,
                delay: p.delay,
                ease: "easeOut",
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

export function AmbientIllustrations({ activeMenu, activeTheme }: AmbientIllustrationsProps) {
  // Recolor illustrations to match the theme's foreground, same as the cassette player
  // Default/speakeasy: red #e43122 → no filter needed (SVGs are already red)
  // Morning/Lunch: dark #2d2a26 → darken heavily
  // Dinner: warm cream #f0ebe3 → brighten + desaturate
  // Night: warm cream #f0ebe3 → brighten + desaturate
  const illustrationFilter = (() => {
    switch (activeTheme) {
      case "morning":
      case "lunch":
        return "brightness(0.3) sepia(1) saturate(0.4) hue-rotate(350deg)";
      case "dinner":
      case "night":
        return "brightness(1.8) saturate(0.3) sepia(0.3)";
      default:
        return "none";
    }
  })();

  return (
    <>
      {/* Napkin with lipstick — breathing below logo, desktop only */}
      <div className="hidden md:block col-start-1 col-span-4 row-start-2 self-center pointer-events-none select-none">
        <motion.img
          src="/napkin_with_lipstick.svg"
          alt=""
          aria-hidden
          className="w-[200px] transition-[filter] duration-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ rotate: "-12deg", filter: illustrationFilter }}
        />
      </div>

      {/* Parfum — interactive spray bottle */}
      <ParfumBottle illustrationFilter={illustrationFilter} />

      {/* Champagne coupe — materializes when Drinks is active */}
      <AnimatePresence>
        {activeMenu === "drinks" && (
          <motion.div
            className="hidden md:block md:col-start-5 md:col-span-2 md:row-start-3 md:self-center pointer-events-none select-none"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 0.45, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="/champange_coup.svg"
              alt=""
              aria-hidden
              className="w-[100px] md:w-[160px] transition-[filter] duration-800"
              style={{ rotate: "-8deg", filter: illustrationFilter }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
