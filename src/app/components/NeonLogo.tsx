"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion } from "motion/react";
import { useCanHover } from "@/hooks/useCanHover";

interface NeonPath {
  d: string;
  index: number;
}

const cache = new Map<string, { viewBox: string; paths: NeonPath[] }>();
const DEFAULT_SRC = "/leche-negra-logo-neon.svg";

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

export const NeonLogo = memo(function NeonLogo({
  isOff,
  src = DEFAULT_SRC,
  label = "Leche Negra",
  onLongPressComplete,
  onLongPressEnd,
}: {
  isOff: boolean;
  src?: string;
  label?: string;
  onLongPressComplete?: () => void;
  onLongPressEnd?: () => void;
}) {
  const [data, setData] = useState(cache.get(src) ?? null);
  const [pressed, setPressed] = useState(false);
  const intensityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const triggeredRef = useRef(false);
  const canHover = useCanHover();

  useEffect(() => {
    if (cache.has(src)) return;
    fetch(src)
      .then((r) => r.text())
      .then((text) => {
        const parsed = parseSvg(text);
        cache.set(src, parsed);
        setData(parsed);
      });
  }, [src]);

  const startHold = useCallback(() => {
    setPressed(true);
    triggeredRef.current = false;
    intensityRef.current = 0;
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / 500, 1);
      intensityRef.current = t;
      const el = svgRef.current;
      if (el) {
        el.style.setProperty("--flicker-dur", `${0.6 - t * 0.52}s`);
        el.style.setProperty("--vibrate-dur", `${0.05 - t * 0.03}s`);
        el.style.setProperty("--char-flicker-dur", `${2 - t * 1.6}s`);
      }
      if (t >= 1 && !triggeredRef.current) {
        triggeredRef.current = true;
        onLongPressComplete?.();
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onLongPressComplete]);

  const endHold = useCallback(() => {
    setPressed(false);
    intensityRef.current = 0;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = svgRef.current;
    if (el) {
      el.style.removeProperty("--flicker-dur");
      el.style.removeProperty("--vibrate-dur");
      el.style.removeProperty("--char-flicker-dur");
    }
    if (triggeredRef.current) {
      onLongPressEnd?.();
    }
  }, [onLongPressEnd]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!data) return null;

  return (
    <motion.svg
      ref={svgRef}
      viewBox={data.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={`neon-logo w-full h-auto ${isOff ? "neon-logo--off" : ""} ${pressed ? "neon-logo--excited cursor-grabbing" : "cursor-grab"}`}
      aria-label={label}
      role="img"
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
});
