"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { playBell } from "@/lib/bell";
import { BOOKING_WIDGET_HASH } from "@/lib/constants";

const HEADLINE = "you've wandered a little far.";

export function NotFoundScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const ghostFourRef = useRef<HTMLSpanElement>(null);
  const ghostZeroRef = useRef<HTMLSpanElement>(null);
  const ghostFour2Ref = useRef<HTMLSpanElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const smokeRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const [bellRung, setBellRung] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tl = gsap.timeline();

    tl.set(labelRef.current, { opacity: 0, y: -6 })
      .set(stampRef.current, { opacity: 0 })
      .set(
        [ghostFourRef.current, ghostZeroRef.current, ghostFour2Ref.current],
        { opacity: 0 }
      )
      .set(headlineRef.current?.querySelectorAll("[data-w]") ?? [], {
        opacity: 0,
        y: 14,
      })
      .set(subRef.current, { opacity: 0, y: 6 })
      .set(ctasRef.current, { opacity: 0, y: 8 })
      .set(smokeRef.current, { opacity: 0 });

    if (reduced) {
      tl.to(
        [
          labelRef.current,
          stampRef.current,
          ghostFourRef.current,
          ghostZeroRef.current,
          ghostFour2Ref.current,
          ...(Array.from(headlineRef.current?.querySelectorAll("[data-w]") ?? [])),
          subRef.current,
          ctasRef.current,
          smokeRef.current,
        ],
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power2.out" }
      );
      return () => {
        tl.kill();
      };
    }

    // 1. Atmosphere — smoke wafts in
    tl.to(smokeRef.current, { opacity: 1, duration: 1.2, ease: "power2.out" }, 0);

    // 2. Service label
    tl.to(
      labelRef.current,
      { opacity: 0.7, y: 0, duration: 0.5, ease: "power2.out" },
      0.15
    );

    // 3. Big "404" — the two 4s ignite, the 0 stutters and dies dim (broken tube)
    // First 4
    tl.set(ghostFourRef.current, { opacity: 0 }, 0.35)
      .set(ghostFourRef.current, { opacity: 0.85 }, 0.39)
      .set(ghostFourRef.current, { opacity: 0.2 }, 0.43)
      .set(ghostFourRef.current, { opacity: 1 }, 0.48);

    // Second 4
    tl.set(ghostFour2Ref.current, { opacity: 0 }, 0.5)
      .set(ghostFour2Ref.current, { opacity: 0.85 }, 0.54)
      .set(ghostFour2Ref.current, { opacity: 0.2 }, 0.58)
      .set(ghostFour2Ref.current, { opacity: 1 }, 0.63);

    // Middle 0 — tries, fails, settles dim (broken)
    tl.set(ghostZeroRef.current, { opacity: 0 }, 0.66)
      .set(ghostZeroRef.current, { opacity: 0.6 }, 0.71)
      .set(ghostZeroRef.current, { opacity: 0 }, 0.76)
      .set(ghostZeroRef.current, { opacity: 0.4 }, 0.82)
      .set(ghostZeroRef.current, { opacity: 0 }, 0.88)
      .to(ghostZeroRef.current, { opacity: 0.18, duration: 0.4, ease: "power2.out" }, 0.95);

    // 4. Stamp underneath ("courtesy notice")
    tl.to(
      stampRef.current,
      { opacity: 0.55, duration: 0.5, ease: "power2.out" },
      1.0
    );

    // 5. Headline word-stagger
    const words = headlineRef.current?.querySelectorAll<HTMLSpanElement>("[data-w]");
    if (words) {
      tl.to(
        words,
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
        },
        1.05
      );
    }

    // 6. Subline + CTAs + seal
    tl.to(
      subRef.current,
      { opacity: 0.75, y: 0, duration: 0.5, ease: "power2.out" },
      1.55
    )
      .to(
        ctasRef.current,
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
        1.65
      );

    // Looping subtle dying-tube flicker on the 0
    const flickerLoop = gsap.to(ghostZeroRef.current, {
      keyframes: [
        { opacity: 0.18, duration: 1.6 },
        { opacity: 0.05, duration: 0.06 },
        { opacity: 0.4, duration: 0.06 },
        { opacity: 0.18, duration: 0.4 },
        { opacity: 0.06, duration: 0.04 },
        { opacity: 0.18, duration: 2.2 },
      ],
      repeat: -1,
      delay: 1.6,
    });

    return () => {
      tl.kill();
      flickerLoop.kill();
    };
  }, []);

  const ringBell = () => {
    if (bellRung) return;
    setBellRung(true);
    playBell();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([20, 50, 20]);
      } catch {
        /* noop */
      }
    }
    window.setTimeout(() => setBellRung(false), 2400);
  };

  const headlineWords = HEADLINE.split(" ");

  return (
    <main
      ref={rootRef}
      className="relative min-h-screen w-full overflow-hidden text-foreground"
      style={{ background: "var(--background)" }}
    >
      {/* Soft floor glow — much lighter, just a hint */}
      <div
        ref={smokeRef}
        aria-hidden
        className="absolute left-0 right-0 bottom-0 pointer-events-none"
        style={{
          height: "22vh",
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--foreground) 5%, transparent) 0%, transparent 100%)",
          filter: "blur(40px)",
        }}
      />

      {/* Service label top-left */}
      <div
        ref={labelRef}
        className="absolute font-body uppercase tracking-[0.4em] text-[10px]"
        style={{
          top: "min(7vh, 2.5rem)",
          left: "min(7vw, 3rem)",
          color: "var(--foreground)",
        }}
      >
        [ four — oh — four ]
      </div>

      {/* Center stack */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        {/* The big 404 — neon, with the middle "0" broken (dim, flickering) */}
        <div
          className="select-none italic flex items-baseline gap-1 sm:gap-2"
          aria-hidden
          style={{
            fontFamily:
              'var(--font-display-next), "Playfair Display", Georgia, serif',
            fontSize: "clamp(7rem, 22vw, 16rem)",
            lineHeight: 0.9,
            fontWeight: 400,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            marginBottom: "clamp(1.5rem, 3vw, 3rem)",
          }}
        >
          <span
            ref={ghostFourRef}
            style={{
              display: "inline-block",
              filter:
                "drop-shadow(0 0 8px var(--foreground)) drop-shadow(0 0 28px var(--foreground)) drop-shadow(0 0 70px color-mix(in srgb, var(--foreground) 60%, transparent))",
              willChange: "opacity",
            }}
          >
            4
          </span>
          <span
            ref={ghostZeroRef}
            style={{
              display: "inline-block",
              opacity: 0,
              /* dim — broken tube has only weak residual glow */
              filter:
                "drop-shadow(0 0 3px var(--foreground)) drop-shadow(0 0 8px color-mix(in srgb, var(--foreground) 30%, transparent))",
              willChange: "opacity",
            }}
          >
            0
          </span>
          <span
            ref={ghostFour2Ref}
            style={{
              display: "inline-block",
              filter:
                "drop-shadow(0 0 8px var(--foreground)) drop-shadow(0 0 28px var(--foreground)) drop-shadow(0 0 70px color-mix(in srgb, var(--foreground) 60%, transparent))",
              willChange: "opacity",
            }}
          >
            4
          </span>
        </div>

        {/* "Courtesy notice" stamp under the 404 */}
        <div
          ref={stampRef}
          className="font-body uppercase tracking-[0.5em] text-[10px] mb-10 sm:mb-14"
          style={{
            color: "var(--foreground)",
            opacity: 0,
          }}
        >
          ◦ courtesy notice ◦ middle bulb&apos;s out ◦
        </div>

        <h1
          ref={headlineRef}
          className="italic"
          style={{
            fontFamily:
              'var(--font-display-next), "Playfair Display", Georgia, serif',
            fontSize: "clamp(2rem, 5.5vw, 4rem)",
            lineHeight: 1.05,
            fontWeight: 400,
            color: "var(--foreground)",
            maxWidth: "20ch",
          }}
        >
          {headlineWords.map((w, i) => (
            <span
              key={i}
              data-w
              style={{
                display: "inline-block",
                marginRight: i === headlineWords.length - 1 ? 0 : "0.25em",
                willChange: "transform, opacity",
              }}
            >
              {w}
            </span>
          ))}
        </h1>

        <p
          ref={subRef}
          className="mt-5 italic"
          style={{
            fontFamily:
              'var(--font-display-next), "Playfair Display", Georgia, serif',
            fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
            color: "var(--foreground)",
            opacity: 0.7,
            maxWidth: "32ch",
            lineHeight: 1.5,
          }}
        >
          wrong door. happens.
        </p>

        <div
          ref={ctasRef}
          className="mt-12 sm:mt-14 flex flex-col items-center gap-4 sm:flex-row sm:gap-8"
        >
          <Link
            href="/"
            className="nav-bracket font-body uppercase italic"
            style={{
              fontSize: "0.8125rem",
              color: "var(--foreground)",
              letterSpacing: "0.02em",
            }}
          >
            back to the floor
          </Link>

          <span
            aria-hidden
            className="hidden sm:block"
            style={{
              width: 28,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, var(--foreground), transparent)",
              opacity: 0.4,
            }}
          />

          <button
            type="button"
            className="waiteraid-widget nav-bracket font-body uppercase italic cursor-pointer"
            data-hash={BOOKING_WIDGET_HASH}
            style={{
              fontSize: "0.8125rem",
              color: "var(--foreground)",
              letterSpacing: "0.02em",
              opacity: 0.85,
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          >
            save us a chair
          </button>
        </div>

        {/* The Bell — easter egg matching the speakeasy "ring the doorbell" pattern */}
        <button
          type="button"
          onClick={ringBell}
          className="mt-14 sm:mt-16 inline-flex items-center gap-3 font-body uppercase tracking-[0.4em] text-[9px] transition-colors"
          style={{
            color: "var(--foreground)",
            opacity: bellRung ? 1 : 0.45,
          }}
          aria-label="Ring the bell"
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--foreground)",
              boxShadow: bellRung
                ? "0 0 8px var(--foreground), 0 0 22px var(--foreground)"
                : "none",
              transition: "all 0.3s ease",
            }}
          />
          <span>{bellRung ? "they heard you" : "ring the bell"}</span>
        </button>
      </div>

      {/* Decorative bottom hairline */}
      <div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--foreground) 35%, transparent) 50%, transparent 100%)",
        }}
      />
    </main>
  );
}
