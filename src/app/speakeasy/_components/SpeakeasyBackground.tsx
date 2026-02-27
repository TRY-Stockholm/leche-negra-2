"use client";

export function SpeakeasyBackground() {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      {/* Deep black base */}
      <div className="absolute inset-0" style={{ backgroundColor: "#0a0604" }} />

      {/* Burgundy radial glow from below — distant candlelight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 85%, rgba(107,29,42,0.15) 0%, transparent 70%)",
          animation: "speakeasy-glow-pulse 8s ease-in-out infinite",
        }}
      />

      {/* Heavy vignette — corners near-black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 50%, transparent 0%, rgba(10,6,4,0.85) 100%)",
          animation: "speakeasy-vignette-breathe 10s ease-in-out infinite",
        }}
      />

      {/* Enhanced noise/grain overlay */}
      <div className="absolute inset-0" style={{ opacity: 0.16 }}>
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
