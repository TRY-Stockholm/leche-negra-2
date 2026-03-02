"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { instruments } from "./stage-config";
import { useIsMobile } from "@/hooks/useIsMobile";
import { StageAudioEngine } from "./AudioEngine";
import { SceneBackground } from "./SceneBackground";
import type { SceneBackgroundHandle } from "./SceneBackground";
import { GlowLayer } from "./GlowLayer";
import { HazeLayer } from "./HazeLayer";
import { GodRayLayer } from "./GodRayLayer";
import { BokehLayer } from "./BokehLayer";
import { ParticleCanvas } from "./ParticleCanvas";
import { SceneHotspots } from "./SceneHotspots";
import { InstrumentToolbar } from "./InstrumentToolbar";
import { VolumeControl } from "./VolumeControl";

const PRELOADER_MIN_MS = 2000;

export function StageScene() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const engineRef = useRef<StageAudioEngine | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const bgRef = useRef<SceneBackgroundHandle>(null);
  const rafRef = useRef<number>(0);

  const [activeInstruments, setActiveInstruments] = useState<Set<string>>(new Set());
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [phase, setPhase] = useState<"preloader" | "scene">("preloader");
  const [volume, setVolume] = useState(0.8);

  // Initialize audio engine, reveal scene after loading (audio unlocks on first interaction)
  useEffect(() => {
    const engine = new StageAudioEngine();
    engineRef.current = engine;

    const minTimer = new Promise((r) => setTimeout(r, PRELOADER_MIN_MS));

    Promise.all([engine.init(instruments).catch(() => {}), minTimer]).then(
      () => {
        setPhase("scene");
      },
    );

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Escape key to exit
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  // Audio-reactive loop: sets --audio-level on <main>
  useEffect(() => {
    if (!isAudioUnlocked) return;
    const el = stageRef.current;
    if (!el) return;

    const tick = () => {
      const level = engineRef.current?.getLevel() ?? 0;
      el.style.setProperty("--audio-level", level.toFixed(3));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isAudioUnlocked]);

  const handleToggle = useCallback(
    async (id: string) => {
      const engine = engineRef.current;
      if (!engine) return;

      // Lazy unlock on first interaction (requires user gesture)
      if (!isAudioUnlocked) {
        await engine.unlock();
        setIsAudioUnlocked(true);
      }

      const wasActive = engine.isActive(id);
      const nowActive = engine.toggle(id);

      setActiveInstruments((prev) => {
        const next = new Set(prev);
        if (nowActive) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });

      // On mobile, pan to musician when activating (not deactivating)
      if (isMobile && nowActive && !wasActive) {
        bgRef.current?.panToMusician(id);
      }
    },
    [isMobile, isAudioUnlocked],
  );

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    engineRef.current?.setVolume(value);
  }, []);

  const handleMuteAll = useCallback(() => {
    engineRef.current?.muteAll();
    setActiveInstruments(new Set());
  }, []);

  const activeCount = activeInstruments.size;

  return (
    <main
      ref={stageRef}
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: "var(--background, #460b08)" }}
    >
      {/* Preloader overlay */}
      <AnimatePresence>
        {phase !== "scene" && (
          <motion.div
            key="preloader"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ backgroundColor: "var(--background, #460b08)" }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(228,49,34,0.06) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            <motion.p
              key="loading"
              className="font-display italic text-[clamp(1.5rem,4vw,2.5rem)]"
              style={{ color: "var(--color-cream, #f5f0e8)", opacity: 0.7 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 0.7, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Be creative
            </motion.p>

            <p
              className="absolute bottom-8 font-mono text-[10px] uppercase tracking-[0.1em]"
              style={{ color: "#A89A8C", opacity: 0.5 }}
            >
              Best experienced with headphones
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene layers — always mounted, revealed after unlock */}
      <div
        className="absolute inset-0 transition-all duration-[1500ms] ease-out"
        style={{
          opacity: phase === "scene" ? 1 : 0.12,
          filter: `hue-rotate(${-5 + activeCount * 2.6}deg) saturate(${0.7 + activeCount * 0.1}) brightness(${1 + activeCount * 0.018})`,
        }}
      >
        <SceneBackground
          ref={bgRef}
          activeCount={activeCount}
          activeInstruments={activeInstruments}
        />
        <GlowLayer activeInstruments={activeInstruments} />
        <HazeLayer activeCount={activeCount} />
        <GodRayLayer activeCount={activeCount} />

        {/* Candle glows */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute bottom-[15%] left-[8%] h-20 w-20 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(228,49,34,0.18) 0%, transparent 70%)",
              animation: "candle-flicker 3s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-[18%] right-[12%] h-16 w-16 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(228,49,34,0.12) 0%, transparent 70%)",
              animation: "candle-flicker 4s ease-in-out infinite 1s",
            }}
          />
          <div
            className="absolute bottom-[20%] left-[45%] h-14 w-14 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(228,49,34,0.1) 0%, transparent 70%)",
              animation: "candle-flicker 5s ease-in-out infinite 2s",
            }}
          />
        </div>

        {/* Dynamic vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse ${30 + activeCount * 9}% ${25 + activeCount * 7}% at 50% 50%, transparent 0%, rgba(70,11,8,0.8) 100%)`,
            animation: activeCount === 0 ? "vignette-breathe 6s ease-in-out infinite" : "none",
            opacity: activeCount === 0 ? 1 : Math.max(0.35, 0.8 - activeCount * 0.08),
            transition: "opacity 1.5s ease",
          }}
          aria-hidden="true"
        />

        <ParticleCanvas activeCount={activeCount} />

        {/* Grain overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: isMobile ? 0.02 : 0.06 }}
          aria-hidden="true"
        >
          <svg width="100%" height="100%">
            <filter id="stage-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#stage-grain)" />
          </svg>
        </div>

        <BokehLayer activeCount={activeCount} />
      </div>

      {/* Desktop hotspots */}
      {!isMobile && (
        <SceneHotspots
          activeInstruments={activeInstruments}
          onToggle={handleToggle}
          disabled={phase !== "scene"}
        />
      )}

      {/* Volume control */}
      {isAudioUnlocked && (
        <VolumeControl
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onMuteAll={handleMuteAll}
        />
      )}

      {/* Close button */}
      <button
        onClick={() => router.push("/")}
        className="fixed top-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 hover:bg-[rgba(228,49,34,0.1)]"
        style={{
          color: "#A89A8C",
          border: "1px solid rgba(61, 47, 40, 0.5)",
          backgroundColor: "rgba(70, 11, 8, 0.85)",
          backdropFilter: "blur(8px)",
        }}
        aria-label="Close and return to homepage"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>

      {/* Instrument toolbar */}
      <InstrumentToolbar
        activeInstruments={activeInstruments}
        onToggle={handleToggle}
        disabled={phase !== "scene"}
      />

      {/* Screen reader live region */}
      <div className="sr-only" role="status" aria-live="polite">
        {activeInstruments.size === 0
          ? "No instruments playing"
          : `Playing: ${instruments.filter(i => activeInstruments.has(i.id)).map(i => i.name).join(", ")}`}
      </div>
    </main>
  );
}
