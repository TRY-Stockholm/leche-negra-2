"use client";

import { useEffect, useRef } from "react";
import { type MotionValue } from "motion/react";
import { SpeakeasyReveal } from "./SpeakeasyReveal";

const BOTANICAL_SLOTS = [
  { id: "top-left", x: "3%", y: "5%", size: "clamp(120px, 18vw, 220px)", rotate: -12 },
  { id: "top-right", x: "75%", y: "3%", size: "clamp(100px, 15vw, 200px)", rotate: 8 },
  { id: "bottom-left", x: "2%", y: "65%", size: "clamp(130px, 20vw, 240px)", rotate: -5 },
  { id: "bottom-right", x: "78%", y: "70%", size: "clamp(110px, 16vw, 210px)", rotate: 15 },
] as const;

const PARALLAX_FACTOR = 3;
const FLINCH_RADIUS = 250;
const FLINCH_DISTANCE = 8;

interface SpeakeasyBotanicalsProps {
  mouseX?: MotionValue<number>;
  mouseY?: MotionValue<number>;
}

export function SpeakeasyBotanicals({ mouseX, mouseY }: SpeakeasyBotanicalsProps) {
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
          <BotanicalSlot slot={slot} index={i} mouseX={mouseX} mouseY={mouseY} />
        </SpeakeasyReveal>
      ))}
    </div>
  );
}

function BotanicalSlot({
  slot,
  index,
  mouseX,
  mouseY,
}: {
  slot: (typeof BOTANICAL_SLOTS)[number];
  index: number;
  mouseX?: MotionValue<number>;
  mouseY?: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mouseX || !mouseY) return;
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mx = mouseX!.get();
      const my = mouseY!.get();

      // Parallax: shift counter to cursor (relative to viewport center)
      const vw = window.innerWidth / 2;
      const vh = window.innerHeight / 2;
      const px = -((mx - vw) / vw) * PARALLAX_FACTOR;
      const py = -((my - vh) / vh) * PARALLAX_FACTOR;

      // Flinch: shift away from cursor when close
      const dx = cx - mx;
      const dy = cy - my;
      const dist = Math.hypot(dx, dy);
      let fx = 0;
      let fy = 0;
      if (dist < FLINCH_RADIUS && dist > 0) {
        const strength = (1 - dist / FLINCH_RADIUS) * FLINCH_DISTANCE;
        fx = (dx / dist) * strength;
        fy = (dy / dist) * strength;
      }

      el.style.transform = `translate(${px + fx}px, ${py + fy}px)`;
    }

    const unsubX = mouseX.on("change", update);
    const unsubY = mouseY.on("change", update);
    return () => {
      unsubX();
      unsubY();
    };
  }, [mouseX, mouseY]);

  return (
    <div
      ref={ref}
      className="absolute"
      style={{
        left: slot.x,
        top: slot.y,
        width: slot.size,
        height: slot.size,
        transition: "transform 0.3s ease-out",
      }}
    >
      {/* Blurred glow behind the illustration */}
      <div
        className="absolute inset-0"
        style={{
          filter: "blur(40px)",
          opacity: 0.15,
          animation: `speakeasy-drift ${15 + index * 3}s ease-in-out infinite`,
          animationDelay: `${index * -4}s`,
        }}
      >
        <PlaceholderBotanical rotate={slot.rotate} />
      </div>

      {/* The illustration */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.25,
          transform: `rotate(${slot.rotate}deg)`,
          animation: `speakeasy-drift ${18 + index * 2}s ease-in-out infinite`,
          animationDelay: `${index * -3}s`,
        }}
      >
        <PlaceholderBotanical rotate={0} />
      </div>
    </div>
  );
}

function PlaceholderBotanical({ rotate }: { rotate: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M100 10 C120 40, 160 50, 140 90 C120 130, 160 150, 130 180 C110 190, 90 190, 70 180 C40 150, 80 130, 60 90 C40 50, 80 40, 100 10Z"
        fill="#d44444"
        opacity="0.6"
      />
      <path
        d="M85 60 C90 45, 110 45, 115 60 C120 75, 110 85, 100 90 C90 85, 80 75, 85 60Z"
        fill="#a05555"
        opacity="0.4"
      />
    </svg>
  );
}
