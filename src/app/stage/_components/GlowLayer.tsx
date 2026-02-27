"use client";

import { instruments } from "./stage-config";

interface GlowLayerProps {
  activeInstruments: Set<string>;
}

export function GlowLayer({ activeInstruments }: GlowLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {instruments.map((inst) => {
        const isActive = activeInstruments.has(inst.id);
        return (
          <div
            key={inst.id}
            data-active={isActive || undefined}
            className="stage-glow-zone"
            style={{
              left: `${inst.position.x}%`,
              top: `${inst.position.y}%`,
              background: `radial-gradient(circle, ${inst.color}40 0%, ${inst.color}18 35%, transparent 70%)`,
            }}
          />
        );
      })}
    </div>
  );
}
