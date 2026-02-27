"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
  const engineRef = useRef<StageAudioEngine | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const bgRef = useRef<SceneBackgroundHandle>(null);
  const rafRef = useRef<number>(0);

  const [activeInstruments, setActiveInstruments] = useState<Set<string>>(new Set());
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [phase, setPhase] = useState<"preloader" | "ready" | "scene">("preloader");
  const [volume, setVolume] = useState(0.8);

  // Initialize audio engine
  useEffect(() => {
    const engine = new StageAudioEngine();
    engineRef.current = engine;

    const minTimer = new Promise((r) => setTimeout(r, PRELOADER_MIN_MS));

    engine.init(instruments).then(() => {
      minTimer.then(() => setPhase("ready"));
    });

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

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

  const handleUnlock = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    await engine.unlock();
    setIsAudioUnlocked(true);
    setPhase("scene");
  }, []);

  const handleToggle = useCallback(
    (id: string) => {
      const engine = engineRef.current;
      if (!engine) return;

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
    [isMobile],
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
      style={{ backgroundColor: "var(--color-charcoal, #1a1210)" }}
    >
      {/* Preloader / Audio unlock overlay */}
      <AnimatePresence>
        {phase !== "scene" && (
          <motion.div
            key="preloader"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ backgroundColor: "var(--color-charcoal, #1a1210)" }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            <AnimatePresence mode="wait">
              {phase === "preloader" ? (
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
              ) : (
                <motion.button
                  key="unlock"
                  onClick={handleUnlock}
                  className="flex flex-col items-center gap-6 rounded-[2px] border px-12 py-8 transition-all duration-500 hover:border-[var(--color-brass,#c9a96e)] hover:bg-[rgba(201,169,110,0.1)]"
                  style={{
                    borderColor: "rgba(201, 169, 110, 0.3)",
                    color: "var(--color-cream, #f5f0e8)",
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  autoFocus
                >
                  <span className="font-display text-2xl tracking-[-0.02em]">
                    Be creative
                  </span>
                  <span
                    className="font-mono text-xs uppercase tracking-[0.12em]"
                    style={{ color: "#A89A8C" }}
                  >
                    Tap to begin
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

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
          opacity: isAudioUnlocked ? 1 : 0.12,
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
              background: "radial-gradient(circle, rgba(201,169,110,0.18) 0%, transparent 70%)",
              animation: "candle-flicker 3s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-[18%] right-[12%] h-16 w-16 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)",
              animation: "candle-flicker 4s ease-in-out infinite 1s",
            }}
          />
          <div
            className="absolute bottom-[20%] left-[45%] h-14 w-14 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(201,169,110,0.1) 0%, transparent 70%)",
              animation: "candle-flicker 5s ease-in-out infinite 2s",
            }}
          />
        </div>

        {/* Dynamic vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse ${30 + activeCount * 9}% ${25 + activeCount * 7}% at 50% 50%, transparent 0%, rgba(26,18,16,0.8) 100%)`,
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
          disabled={!isAudioUnlocked}
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

      {/* Instrument toolbar */}
      <InstrumentToolbar
        activeInstruments={activeInstruments}
        onToggle={handleToggle}
        disabled={!isAudioUnlocked}
      />

      {/* Screen reader live region */}
      <div className="sr-only" role="status" aria-live="polite">
        {activeInstruments.size === 0
          ? "No instruments playing"
          : `Playing: ${Array.from(activeInstruments).join(", ")}`}
      </div>
    </main>
  );
}
