"use client";

import { useEffect, useRef, useState } from "react";
import { type MotionValue, motion } from "motion/react";
import { useCanHover } from "@/hooks/useCanHover";

const WHISPERS = [
  { text: "she never left", x: "12%", y: "22%" },
  { text: "the third drink is free", x: "78%", y: "32%" },
  { text: "ask about the painting", x: "82%", y: "78%" },
  { text: "we\u2019ve been expecting you", x: "8%", y: "68%" },
] as const;

const REVEAL_RADIUS = 200;

interface SpeakeasyWhispersProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

export function SpeakeasyWhispers({ mouseX, mouseY }: SpeakeasyWhispersProps) {
  const canHover = useCanHover();

  if (!canHover) return <MobileWhispers />;

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    >
      {WHISPERS.map((w, i) => (
        <DesktopWhisper key={i} {...w} mouseX={mouseX} mouseY={mouseY} />
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
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX.get() - cx, mouseY.get() - cy);
      const opacity = dist < REVEAL_RADIUS ? (1 - dist / REVEAL_RADIUS) * 0.6 : 0;
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
      style={{ left: x, top: y, color: "#a05555", opacity: 0 }}
    >
      {text}
    </span>
  );
}

function MobileWhispers() {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => {
        if (prev >= 0) return -1;
        return Math.floor(Math.random() * WHISPERS.length);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    >
      {WHISPERS.map((w, i) => (
        <motion.span
          key={i}
          className="absolute font-display italic text-[0.875rem]"
          style={{ left: w.x, top: w.y, color: "#a05555" }}
          animate={{ opacity: active === i ? 0.5 : 0 }}
          transition={{ duration: 3 }}
        >
          {w.text}
        </motion.span>
      ))}
    </div>
  );
}
