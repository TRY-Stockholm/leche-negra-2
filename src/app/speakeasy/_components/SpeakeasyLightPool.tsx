"use client";

import { motion, useSpring } from "motion/react";
import { useMousePosition } from "@/hooks/useMousePosition";
import { useCanHover } from "@/hooks/useCanHover";

const POOL_SIZE = 600;
const SPRING = { damping: 50, stiffness: 80, mass: 1.2 };

interface SpeakeasyLightPoolProps {
  visible?: boolean;
}

export function SpeakeasyLightPool({ visible = true }: SpeakeasyLightPoolProps) {
  const { x, y } = useMousePosition();
  const canHover = useCanHover();

  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  if (!canHover) {
    return (
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 1, opacity: visible ? 1 : 0, transition: "opacity 2s ease-in-out" }}
        aria-hidden="true"
      >
        <div
          className="absolute left-1/2 bottom-[15%] -translate-x-1/2"
          style={{
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(212,68,68,0.08) 0%, rgba(212,68,68,0.03) 40%, transparent 70%)",
            filter: "blur(30px)",
            animation: "speakeasy-glow-pulse 8s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0"
      style={{
        zIndex: 1,
        x: springX,
        y: springY,
        width: POOL_SIZE,
        height: POOL_SIZE,
        marginLeft: -POOL_SIZE / 2,
        marginTop: -POOL_SIZE / 2,
        background:
          "radial-gradient(circle, rgba(212,68,68,0.07) 0%, rgba(212,68,68,0.03) 30%, transparent 70%)",
        filter: "blur(20px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 2s ease-in-out",
      }}
      aria-hidden="true"
    />
  );
}
