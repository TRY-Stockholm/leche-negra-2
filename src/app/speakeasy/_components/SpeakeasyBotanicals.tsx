"use client";

import { SpeakeasyReveal } from "./SpeakeasyReveal";

/**
 * Placeholder botanical positions.
 * Replace `src` paths with Leon's custom SVG illustrations.
 * Each slot is absolutely positioned around the viewport edges.
 */
const BOTANICAL_SLOTS = [
  { id: "top-left", x: "3%", y: "5%", size: "clamp(120px, 18vw, 220px)", rotate: -12 },
  { id: "top-right", x: "75%", y: "3%", size: "clamp(100px, 15vw, 200px)", rotate: 8 },
  { id: "bottom-left", x: "2%", y: "65%", size: "clamp(130px, 20vw, 240px)", rotate: -5 },
  { id: "bottom-right", x: "78%", y: "70%", size: "clamp(110px, 16vw, 210px)", rotate: 15 },
] as const;

export function SpeakeasyBotanicals() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {BOTANICAL_SLOTS.map((slot, i) => (
        <SpeakeasyReveal
          key={slot.id}
          delay={0.4 + i * 0.1}
          y={0}
          className="absolute inset-0"
          duration={1.2}
        >
          <div
            className="absolute"
            style={{
              left: slot.x,
              top: slot.y,
              width: slot.size,
              height: slot.size,
            }}
          >
            {/* Blurred glow duplicate behind the illustration */}
            <div
              className="absolute inset-0"
              style={{
                filter: "blur(40px)",
                opacity: 0.15,
                animation: `speakeasy-drift ${15 + i * 3}s ease-in-out infinite`,
                animationDelay: `${i * -4}s`,
              }}
            >
              <PlaceholderBotanical rotate={slot.rotate} />
            </div>

            {/* The actual illustration */}
            <div
              className="absolute inset-0"
              style={{
                opacity: 0.25,
                transform: `rotate(${slot.rotate}deg)`,
                animation: `speakeasy-drift ${18 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * -3}s`,
              }}
            >
              <PlaceholderBotanical rotate={0} />
            </div>
          </div>
        </SpeakeasyReveal>
      ))}
    </div>
  );
}

/**
 * Temporary placeholder — replace with Leon's SVG illustrations.
 * This draws a simple organic shape in burgundy.
 */
function PlaceholderBotanical({ rotate }: { rotate: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Organic vine/thorn placeholder shape */}
      <path
        d="M100 10 C120 40, 160 50, 140 90 C120 130, 160 150, 130 180 C110 190, 90 190, 70 180 C40 150, 80 130, 60 90 C40 50, 80 40, 100 10Z"
        fill="#8b2236"
        opacity="0.6"
      />
      <path
        d="M85 60 C90 45, 110 45, 115 60 C120 75, 110 85, 100 90 C90 85, 80 75, 85 60Z"
        fill="#6b1d2a"
        opacity="0.4"
      />
    </svg>
  );
}
