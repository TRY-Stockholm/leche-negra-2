"use client";

interface SpeakeasyBackgroundProps {
  /** 0=darkness, 1=ember glow started, 2+=fully alive */
  phase: number;
}

export function SpeakeasyBackground({ phase }: SpeakeasyBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      {/* Deep black base — always visible */}
      <div className="absolute inset-0 bg-background" />

      {/* Crimson radial glow from below — fades in at phase 1 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 85%, rgba(212,68,68,0.12) 0%, transparent 70%)",
          animation: phase >= 2 ? "speakeasy-glow-pulse 8s ease-in-out infinite" : "none",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 2s ease-in-out",
        }}
      />

      {/* Heavy vignette — tighter keyhole than before */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 38% 32% at 50% 50%, transparent 0%, rgba(10,6,4,0.95) 100%)",
          animation: phase >= 2 ? "speakeasy-vignette-breathe 10s ease-in-out infinite" : "none",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 2.5s ease-in-out",
        }}
      />

      {/* Enhanced noise/grain overlay — always visible for texture during darkness */}
      <div className="absolute inset-0" style={{ opacity: 0.18 }}>
        <svg width="100%" height="100%">
          <filter id="speakeasy-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#speakeasy-grain)" />
        </svg>
      </div>
    </div>
  );
}
