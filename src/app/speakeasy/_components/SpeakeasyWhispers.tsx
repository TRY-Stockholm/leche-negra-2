"use client";

import { useEffect, useRef, useState } from "react";
import { type MotionValue, motion } from "motion/react";
import { useCanHover } from "@/hooks/useCanHover";

const BASE_WHISPERS = [
  { text: "she never left", x: "12%", y: "22%" },
  { text: "some doors only open once", x: "78%", y: "32%" },
  { text: "ask about the painting", x: "82%", y: "78%" },
  { text: "we\u2019ve been expecting you", x: "8%", y: "68%" },
] as const;

const TIMED_WHISPERS = [
  { text: "you remind me of someone", x: "18%", y: "48%", delayMs: 45000 },
  { text: "the painting blinks if you don\u2019t", x: "72%", y: "58%", delayMs: 90000 },
] as const;

const BASE_REVEAL_RADIUS = 200;
const EDGE_REVEAL_RADIUS = 300;
const EDGE_THRESHOLD = 0.15; // 15% of viewport

function isNearEdge(mx: number, my: number): boolean {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ex = vw * EDGE_THRESHOLD;
  const ey = vh * EDGE_THRESHOLD;
  return mx < ex || mx > vw - ex || my < ey || my > vh - ey;
}

interface SpeakeasyWhispersProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  visible?: boolean;
}

export function SpeakeasyWhispers({ mouseX, mouseY, visible = true }: SpeakeasyWhispersProps) {
  const canHover = useCanHover();
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    const timers = TIMED_WHISPERS.map((w, i) =>
      setTimeout(() => setUnlockedCount(i + 1), w.delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const allWhispers = [
    ...BASE_WHISPERS,
    ...TIMED_WHISPERS.slice(0, unlockedCount).map(({ text, x, y }) => ({ text, x, y })),
  ];

  if (!canHover) return <MobileWhispers visible={visible} whispers={allWhispers} />;

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 2, opacity: visible ? 1 : 0, transition: "opacity 2s ease-in-out" }}
      aria-hidden="true"
    >
      {allWhispers.map((w, i) => (
        <DesktopWhisper key={`${w.text}-${i}`} {...w} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
}

function DesktopWhisper({
  text,
  x,
  y,
  mouseX,
  mouseY,
}: {
  text: string;
  x: string;
  y: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const mx = mouseX.get();
      const my = mouseY.get();
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mx - cx, my - cy);
      const radius = isNearEdge(mx, my) ? EDGE_REVEAL_RADIUS : BASE_REVEAL_RADIUS;
      const opacity = dist < radius ? (1 - dist / radius) * 0.6 : 0;
      el.style.opacity = String(opacity);
    }

    const unsubX = mouseX.on("change", update);
    const unsubY = mouseY.on("change", update);
    return () => {
      unsubX();
      unsubY();
    };
  }, [mouseX, mouseY]);

  return (
    <span
      ref={ref}
      className="absolute font-display italic text-[0.875rem]"
      style={{ left: x, top: y, color: "var(--muted-foreground)", opacity: 0 }}
    >
      {text}
    </span>
  );
}

interface WhisperData {
  text: string;
  x: string;
  y: string;
}

function MobileWhispers({ visible = true, whispers }: { visible?: boolean; whispers: WhisperData[] }) {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => {
        if (prev >= 0) return -1;
        return Math.floor(Math.random() * whispers.length);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [whispers.length]);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 2, opacity: visible ? 1 : 0, transition: "opacity 2s ease-in-out" }}
      aria-hidden="true"
    >
      {whispers.map((w, i) => (
        <motion.span
          key={`${w.text}-${i}`}
          className="absolute font-display italic text-[0.875rem]"
          style={{ left: w.x, top: w.y, color: "var(--muted-foreground)", maxWidth: `calc(100% - ${w.x})` }}
          animate={{ opacity: active === i ? 0.5 : 0 }}
          transition={{ duration: 3 }}
        >
          {w.text}
        </motion.span>
      ))}
    </div>
  );
}
