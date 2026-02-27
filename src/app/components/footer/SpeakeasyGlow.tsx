"use client";

export function SpeakeasyGlow() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none"
      style={{
        height: 500,
        zIndex: -1,
        background: "#0a0604",
        opacity: "var(--speakeasy-progress, 0)" as unknown as number,
      }}
    >
      {/* Warm candlelight radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(201,169,110,0.25) 0%, rgba(201,169,110,0.08) 40%, transparent 70%)",
        }}
      />
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.08,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
