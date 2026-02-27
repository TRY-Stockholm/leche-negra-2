"use client";

import { useIsMobile } from "@/hooks/useIsMobile";

const BOKEH_CIRCLES = [
  { x: 8, y: 25, size: 100, opacity: 0.06, duration: 20, delay: 0 },
  { x: 75, y: 15, size: 80, opacity: 0.05, duration: 18, delay: 3 },
  { x: 45, y: 70, size: 120, opacity: 0.04, duration: 25, delay: 5 },
  { x: 90, y: 55, size: 60, opacity: 0.07, duration: 16, delay: 2 },
  { x: 20, y: 60, size: 90, opacity: 0.05, duration: 22, delay: 7 },
  { x: 60, y: 30, size: 70, opacity: 0.06, duration: 19, delay: 4 },
  { x: 35, y: 80, size: 50, opacity: 0.08, duration: 15, delay: 1 },
];

interface BokehLayerProps {
  activeCount: number;
}

export function BokehLayer({ activeCount }: BokehLayerProps) {
  const isMobile = useIsMobile();
  const circles = isMobile ? BOKEH_CIRCLES.slice(0, 3) : BOKEH_CIRCLES;
  const visible = activeCount >= 3;
  const intensity = Math.min(1, (activeCount - 2) / 3);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: visible ? intensity : 0,
        transition: "opacity 2.5s ease",
      }}
      aria-hidden="true"
    >
      {circles.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            opacity: b.opacity,
            background: "radial-gradient(circle, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.1) 40%, transparent 70%)",
            animation: `bokeh-float ${b.duration}s ease-in-out infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
