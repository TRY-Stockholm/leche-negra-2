"use client";

import { instruments } from "./stage-config";

interface InstrumentToolbarProps {
  activeInstruments: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

export function InstrumentToolbar({
  activeInstruments,
  onToggle,
  disabled,
}: InstrumentToolbarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30"
      role="toolbar"
      aria-label="Instrument controls"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(0deg, rgba(70,11,8,0.85) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="relative flex items-center justify-center gap-3 px-4 pb-5 pt-10 md:gap-5"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        {instruments.map((inst) => {
          const isActive = activeInstruments.has(inst.id);
          return (
            <button
              key={inst.id}
              onClick={() => !disabled && onToggle(inst.id)}
              disabled={disabled}
              className="group flex flex-col items-center gap-1.5 px-2 py-2 transition-opacity duration-300 md:px-0 md:py-0"
              style={{ opacity: disabled ? 0.2 : 1, minHeight: 44, minWidth: 44 }}
              aria-label={`${inst.name} — ${isActive ? "playing" : "muted"}`}
              aria-pressed={isActive}
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 12 : 7,
                  height: isActive ? 12 : 7,
                  backgroundColor: isActive ? inst.color : "rgba(168,154,140,0.3)",
                  boxShadow: isActive
                    ? `0 0 8px ${inst.color}60, 0 0 16px ${inst.color}30`
                    : "none",
                  animation: isActive ? "stage-pulse 2s ease-in-out infinite" : "none",
                }}
              />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.12em] transition-colors duration-300"
                style={{ color: isActive ? inst.color : "rgba(168,154,140,0.5)" }}
              >
                {inst.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
