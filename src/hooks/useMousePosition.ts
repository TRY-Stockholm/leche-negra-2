"use client";

import { useEffect } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

/** Returns raw mouse position as motion values. Consumers can apply useSpring on top. */
export function useMousePosition(): { x: MotionValue<number>; y: MotionValue<number> } {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, [x, y]);

  return { x, y };
}
