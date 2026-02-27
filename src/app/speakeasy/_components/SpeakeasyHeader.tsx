"use client";

import { SpeakeasyReveal } from "./SpeakeasyReveal";

export function SpeakeasyHeader() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* "411" — the centerpiece */}
      <SpeakeasyReveal delay={0}>
        <h1
          className="font-display text-[clamp(4rem,12vw,10rem)] leading-[0.9] tracking-tight"
          style={{
            color: "#8b2236",
            textShadow: "0 0 40px rgba(139,34,54,0.3), 0 0 80px rgba(139,34,54,0.1)",
          }}
        >
          411
        </h1>
      </SpeakeasyReveal>

      {/* Cryptic tagline */}
      <SpeakeasyReveal delay={0.2}>
        <p
          className="font-display italic text-[clamp(1.5rem,4vw,3rem)] mt-6 leading-snug"
          style={{ color: "rgba(107,29,42,0.8)" }}
        >
          what the walls remember
        </p>
      </SpeakeasyReveal>
    </div>
  );
}
