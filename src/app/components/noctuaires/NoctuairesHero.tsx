"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";
import { NoctuairesLogo } from "./NoctuairesLogo";
import { NoctuairesMembershipDrawer } from "./NoctuairesMembershipDrawer";

gsap.registerPlugin(useGSAP);

interface NoctuairesHeroProps {
  phase: number;
  menuPdfUrl?: string;
  showPatience: boolean;
  mood?: string;
}

export function NoctuairesHero({
  phase,
  menuPdfUrl,
  showPatience,
  mood,
}: NoctuairesHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const idleRef = useRef<gsap.core.Tween | null>(null);
  const hasPlayed = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion) return;

      const container = containerRef.current;
      if (!container) return;

      const dome = container.querySelector("#logo-dome");
      const ring = container.querySelector("#logo-ring");
      const base = container.querySelector("#logo-base");
      const glow = glowRef.current;
      const textEls = container.querySelectorAll(".noctuaires-text-reveal");

      if (!dome || !ring || !base || !glow) return;

      // ── Initial states — prevent FOUC ──
      gsap.set(ring, {
        scale: 0,
        opacity: 0,
        transformOrigin: "center center",
      });
      gsap.set(dome, { y: -60, opacity: 0 });
      gsap.set(base, { y: 60, opacity: 0 });
      gsap.set(glow, { opacity: 0, scale: 0.8 });
      gsap.set(textEls, { y: 20, opacity: 0 });

      // will-change hint during animation
      gsap.set([ring, dome, base], { willChange: "transform, opacity" });

      // ── Entrance timeline ──
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          // Clean up GPU promotion
          gsap.set([ring, dome, base], { willChange: "auto" });

          // Idle: imperceptible continuous rotation on ring
          idleRef.current = gsap.to(ring, {
            rotation: "+=360",
            duration: 90,
            ease: "none",
            repeat: -1,
            transformOrigin: "center center",
          });
        },
      });

      // 1. Ring — the eye opens (0s)
      tl.to(
        ring,
        {
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: "back.out(1.4)",
        },
        0
      );

      // 2. Dome descends from above (0.4s)
      tl.to(
        dome,
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
        },
        0.4
      );

      // 3. Base ascends from below (0.5s)
      tl.to(
        base,
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
        },
        0.5
      );

      // 4. Glow pulse — the door is alive (1.3s)
      tl.fromTo(
        glow,
        { scale: 0.8, opacity: 0.15 },
        { scale: 1.3, opacity: 0, duration: 1.2, ease: "power2.out" },
        1.3
      );

      // 5. Text reveals — staggered fade up (1.6s)
      tl.to(
        textEls,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.15,
        },
        1.6
      );

      tlRef.current = tl;
    },
    { scope: containerRef }
  );

  // Trigger entrance when phase reaches 2
  useEffect(() => {
    if (phase >= 2 && tlRef.current && !hasPlayed.current) {
      hasPlayed.current = true;
      tlRef.current.play();
    }
  }, [phase]);

  // Cleanup idle rotation
  useEffect(() => {
    return () => {
      idleRef.current?.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center h-[calc(100dvh-65px)] px-5 md:px-10 overflow-visible"
    >
      {/* ── Logo — centered, pushed down into the space ── */}
      <div className="relative shrink-0 w-[clamp(100px,14vw,160px)] mt-auto overflow-visible">
        {/* Crimson glow pulse — positioned behind the logo */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ overflow: "visible" }}
        >
          <div
            ref={glowRef}
            className="w-[300%] aspect-square rounded-full shrink-0"
            style={{
              background:
                "radial-gradient(circle, rgba(232, 78, 60, 0.15) 0%, transparent 70%)",
            }}
          />
        </div>
        <NoctuairesLogo className="relative w-full h-auto text-white" />
      </div>

      {/* ── Text content — anchored bottom-left ── */}
      <div className="mt-auto pb-6 md:pb-10 self-start w-full">
        {/* ── Label ── */}
        <div className="noctuaires-text-reveal">
          <span className="block mb-2 font-body text-[0.6875rem] font-medium tracking-[0.04em] uppercase text-muted-foreground">
            behind the painting
          </span>
        </div>

        {/* ── Tagline ── */}
        <div className="noctuaires-text-reveal">
          <p
            className="font-display italic text-[clamp(2.5rem,8vw,5.5rem)] font-medium leading-[0.95] text-foreground mb-6"
            style={{
              textShadow:
                "0 0 30px color-mix(in srgb, var(--foreground) 20%, transparent), 0 0 60px color-mix(in srgb, var(--foreground) 8%, transparent)",
            }}
          >
            what the walls
            <br />
            remember
          </p>
        </div>

        {/* ── Patience reward ── */}
        <div
          style={{
            opacity: showPatience ? 1 : 0,
            transition: "opacity 3s ease-in-out",
          }}
        >
          {showPatience && (
            <p className="font-display italic text-[clamp(0.875rem,2vw,1.125rem)] text-muted-foreground mb-6" style={{ opacity: 0.6 }}>
              you&apos;re still here. good.
            </p>
          )}
        </div>

        {/* ── Room mood ── */}
        {mood && (
          <div className="noctuaires-text-reveal mb-4">
            <p
              className="font-display italic text-[0.8125rem] text-muted-foreground"
              style={{ opacity: 0.45 }}
            >
              {mood}
            </p>
          </div>
        )}

        {/* ── About the room ── */}
        <div className="noctuaires-text-reveal w-full">
          <AboutTheRoom />
        </div>

        {/* ── Action row ── */}
        <div className="noctuaires-text-reveal">
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-4">
              <button
                onClick={() => setDrawerOpen(true)}
                className="squiggle-hover cursor-pointer py-2 font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground transition-opacity duration-300 hover:opacity-100"
              >
                request membership
              </button>
            </div>

            <a
              href={menuPdfUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground transition-opacity duration-300 hover:opacity-80"
            >
              see cocktails <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>

      <NoctuairesMembershipDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

function AboutTheRoom() {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full mb-4">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="noctuaires-about"
        className="cursor-pointer py-2 font-body text-[0.6875rem] font-medium tracking-[0.06em] uppercase text-muted-foreground transition-opacity duration-300 hover:opacity-80"
      >
        {isOpen ? "close" : "about the room"}
      </button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            id="noctuaires-about"
            key="about"
            initial={
              prefersReducedMotion
                ? false
                : { gridTemplateRows: "0fr", opacity: 0 }
            }
            animate={{ gridTemplateRows: "1fr", opacity: 1 }}
            exit={{ gridTemplateRows: "0fr", opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    gridTemplateRows: {
                      duration: 0.6,
                      ease: EASE_OUT_EXPO,
                    },
                    opacity: { duration: 0.4, ease: "easeInOut" },
                  }
            }
            className="grid w-full"
          >
            <div className="overflow-hidden">
              <div className="font-display italic text-[clamp(0.875rem,2vw,1.0625rem)] leading-[1.65] text-muted-foreground mt-6 max-w-[520px]">
                {prefersReducedMotion ? (
                  <p>
                    Past the painting, down the stairs — a smaller room with a
                    longer pour. The menu changes when it feels like it. Most
                    people find this place by accident. You&apos;re here now.
                  </p>
                ) : (
                  <TypewriterText text="Past the painting, down the stairs — a smaller room with a longer pour. The menu changes when it feels like it. Most people find this place by accident. You're here now." />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const iRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function type() {
      if (iRef.current >= text.length) {
        setTimeout(() => setShowCursor(false), 2000);
        return;
      }
      iRef.current++;
      setDisplayed(text.slice(0, iRef.current));

      const char = text[iRef.current - 1];
      let delay = 35 + Math.random() * 25;
      if (char === "," || char === ";") delay = 180 + Math.random() * 80;
      if (char === "." || char === "!" || char === "?")
        delay = 280 + Math.random() * 120;
      if (char === "\u2014" || char === "\u2013")
        delay = 220 + Math.random() * 80;
      if (char === " ") delay = 25 + Math.random() * 15;

      timerRef.current = setTimeout(type, delay);
    }

    timerRef.current = setTimeout(type, 400);
    return () => clearTimeout(timerRef.current);
  }, [text]);

  return (
    <p>
      {displayed}
      {showCursor && (
        <span
          className="inline-block w-[2px] h-[1em] ml-[1px] align-middle"
          style={{
            backgroundColor: "var(--foreground)",
            animation: "speakeasy-cursor-blink 0.8s step-end infinite",
          }}
        />
      )}
    </p>
  );
}
