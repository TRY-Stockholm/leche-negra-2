"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { useCanHover } from "@/hooks/useCanHover";

interface NeonPath {
  d: string;
  index: number;
}

let cached: { viewBox: string; paths: NeonPath[] } | null = null;

function parseSvg(text: string): { viewBox: string; paths: NeonPath[] } {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  const viewBox = svg?.getAttribute("viewBox") ?? "0 0 5614.94 1083.71";
  const paths: NeonPath[] = [];
  doc.querySelectorAll("path").forEach((el) => {
    const d = el.getAttribute("d");
    if (!d) return;
    const idx = el.getAttribute("data-neon");
    paths.push({ d, index: idx != null ? Number(idx) : paths.length });
  });
  return { viewBox, paths };
}

export function NeonLogo({
  isOff,
  onLongPressComplete,
  onLongPressEnd,
}: {
  isOff: boolean;
  onLongPressComplete?: () => void;
  onLongPressEnd?: () => void;
}) {
  const [data, setData] = useState(cached);
  const [pressed, setPressed] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggeredRef = useRef(false);
  const canHover = useCanHover();

  useEffect(() => {
    if (cached) return;
    fetch("/leche-negra-logo-neon.svg")
      .then((r) => r.text())
      .then((text) => {
        cached = parseSvg(text);
        setData(cached);
      });
  }, []);

  const startHold = useCallback(() => {
    setPressed(true);
    triggeredRef.current = false;
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / 2500, 1);
      setIntensity(t);
      if (t >= 1 && !triggeredRef.current) {
        triggeredRef.current = true;
        onLongPressComplete?.();
      }
    }, 30);
  }, [onLongPressComplete]);

  const endHold = useCallback(() => {
    setPressed(false);
    setIntensity(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (triggeredRef.current) {
      onLongPressEnd?.();
    }
  }, [onLongPressEnd]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!data) return null;

  const flickerDuration = 0.6 - intensity * 0.52;
  const vibrateDuration = 0.05 - intensity * 0.03;

  return (
    <motion.svg
      viewBox={data.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={`neon-logo w-full h-auto ${isOff ? "neon-logo--off" : ""} ${pressed ? "neon-logo--excited cursor-grabbing" : "cursor-grab"}`}
      aria-label="Leche Negra"
      role="img"
      style={{
        "--flicker-dur": `${flickerDuration}s`,
        "--vibrate-dur": `${vibrateDuration}s`,
        "--char-flicker-dur": `${2 - intensity * 1.6}s`,
      } as React.CSSProperties}
      whileHover={canHover ? { scale: 1.03 } : undefined}
      whileTap={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onTapStart={startHold}
      onTap={endHold}
      onTapCancel={endHold}
    >
      {data.paths.map((p) => (
        <path
          key={p.index}
          d={p.d}
          className="neon-char"
          style={{ "--char-i": p.index } as React.CSSProperties}
        />
      ))}
    </motion.svg>
  );
}
