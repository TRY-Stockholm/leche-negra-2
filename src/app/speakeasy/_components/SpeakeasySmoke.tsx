"use client";

const WISPS = [
  { top: "18%", height: "clamp(80px, 12vh, 160px)", width: "clamp(300px, 45vw, 700px)", duration: 32, delay: 0 },
  { top: "45%", height: "clamp(60px, 10vh, 140px)", width: "clamp(250px, 40vw, 600px)", duration: 38, delay: -12 },
  { top: "70%", height: "clamp(70px, 11vh, 150px)", width: "clamp(280px, 42vw, 650px)", duration: 35, delay: -22 },
];

interface SpeakeasySmokeProps {
  visible?: boolean;
}

export function SpeakeasySmoke({ visible = true }: SpeakeasySmokeProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 2s ease-in-out" }}
      aria-hidden="true"
    >
      {WISPS.map((wisp, i) => (
        <div
          key={i}
          className="absolute left-0"
          style={{
            top: wisp.top,
            width: wisp.width,
            height: wisp.height,
            background:
              "radial-gradient(ellipse at center, rgba(212,68,68,0.04) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: `speakeasy-smoke-${i} ${wisp.duration}s linear infinite`,
            animationDelay: `${wisp.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
