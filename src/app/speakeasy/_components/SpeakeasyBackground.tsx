"use client";

interface SpeakeasyBackgroundProps {
  /** 0=darkness, 1=ember glow started, 2+=fully alive */
  phase: number;
  isIdle?: boolean;
}

export function SpeakeasyBackground({ phase, isIdle = false }: SpeakeasyBackgroundProps) {
  const vignetteW = isIdle ? "28%" : "38%";
  const vignetteH = isIdle ? "22%" : "32%";
  const vignetteDuration = isIdle ? "4s" : "2s";

  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      {/* Deep black base — always visible */}
      <div className="absolute inset-0 bg-background" />

      {/* Crimson radial glow from below — fades in at phase 1 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 85%, color-mix(in srgb, var(--foreground) 12%, transparent) 0%, transparent 70%)",
          animation: phase >= 2 ? "speakeasy-glow-pulse 8s ease-in-out infinite" : "none",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 2s ease-in-out",
        }}
      />

      {/* Heavy vignette — tightens when idle, relaxes when active */}
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(ellipse ${vignetteW} ${vignetteH} at 50% 50%, transparent 0%, color-mix(in srgb, var(--background) 95%, transparent) 100%)`,
          animation: phase >= 2 ? "speakeasy-vignette-breathe 10s ease-in-out infinite" : "none",
          opacity: phase >= 1 ? 1 : 0,
          transition: `opacity 2.5s ease-in-out, background ${vignetteDuration} ease-in-out`,
        }}
      />

    </div>
  );
}
