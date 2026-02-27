"use client";

import { useIsMobile } from "@/hooks/useIsMobile";

const RAYS = [
  { x: 28, angle: -3, w: 40, h: 70, delay: 0 },
  { x: 50, angle: 1, w: 50, h: 80, delay: 2 },
  { x: 72, angle: -2, w: 35, h: 65, delay: 4 },
  { x: 86, angle: 2, w: 30, h: 55, delay: 1 },
];

interface GodRayLayerProps {
  activeCount: number;
}

export function GodRayLayer({ activeCount }: GodRayLayerProps) {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  const visible = activeCount >= 4;
  const intensity = Math.min(1, (activeCount - 3) / 3);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: visible ? intensity : 0,
        transition: "opacity 2s ease",
      }}
      aria-hidden="true"
    >
      {RAYS.map((ray, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            "--ray-base-angle": `${ray.angle}deg`,
            left: `${ray.x}%`,
            top: 0,
            width: `${ray.w}px`,
            height: `${ray.h}vh`,
            transformOrigin: "top center",
            scaleY: visible ? 1 : 0,
            transition: "scale 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
            background: "linear-gradient(180deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 50%, transparent 100%)",
            animation: `godray-sway ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: `${ray.delay}s`,
            willChange: "transform",
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
