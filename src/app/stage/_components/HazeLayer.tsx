"use client";

import { useIsMobile } from "@/hooks/useIsMobile";

interface HazeLayerProps {
  activeCount: number;
}

export function HazeLayer({ activeCount }: HazeLayerProps) {
  const isMobile = useIsMobile();
  const baseOpacity = isMobile ? 0.5 : 1;
  const visible = activeCount >= 2;
  const intensity = Math.min(1, (activeCount - 1) / 4);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: visible ? intensity * baseOpacity : 0,
        transition: "opacity 2s ease",
        mixBlendMode: "screen",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute"
        style={{
          left: "15%", top: "20%", width: "45vw", height: "50vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,169,110,0.06) 0%, transparent 70%)",
          animation: "haze-drift-1 35s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "40%", top: "10%", width: "50vw", height: "60vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 70%)",
          animation: "haze-drift-2 45s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "55%", top: "25%", width: "40vw", height: "45vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%)",
          animation: "haze-drift-3 55s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "25%", top: "40%", width: "55vw", height: "40vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)",
          animation: "haze-drift-1 60s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
