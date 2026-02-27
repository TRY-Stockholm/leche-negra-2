"use client";

import { useState, useCallback } from "react";
import { instruments } from "./stage-config";

interface SceneHotspotsProps {
  activeInstruments: Set<string>;
  onToggle: (id: string) => void;
  disabled: boolean;
}

export function SceneHotspots({
  activeInstruments,
  onToggle,
  disabled,
}: SceneHotspotsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback(
    (id: string) => {
      if (!disabled) onToggle(id);
    },
    [disabled, onToggle],
  );

  return (
    <div className="absolute inset-0 z-20">
      {instruments.map((inst) => {
        const isActive = activeInstruments.has(inst.id);
        const isHovered = hoveredId === inst.id;

        return (
          <button
            key={inst.id}
            disabled={disabled}
            onClick={() => handleClick(inst.id)}
            onMouseEnter={() => setHoveredId(inst.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="absolute flex items-center justify-center transition-[background] duration-300"
            style={{
              left: `${inst.position.x}%`,
              top: `${inst.position.y}%`,
              transform: "translate(-50%, -50%)",
              width: "clamp(70px, 10vw, 120px)",
              height: "clamp(90px, 13vw, 150px)",
              cursor: disabled ? "default" : "pointer",
              borderRadius: "50%",
              background:
                isHovered && !disabled
                  ? `radial-gradient(circle, ${inst.color}18 0%, transparent 70%)`
                  : "transparent",
            }}
            aria-label={`${inst.name} — ${isActive ? "playing, click to mute" : "click to play"}`}
            aria-pressed={isActive}
          >
            <span
              className="absolute -top-8 whitespace-nowrap rounded-[2px] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-opacity duration-200"
              style={{
                backgroundColor: "rgba(70,11,8,0.92)",
                color: isActive ? inst.color : "#A89A8C",
                border: `1px solid ${isActive ? inst.color + "40" : "rgba(61,47,40,0.5)"}`,
                backdropFilter: "blur(4px)",
                opacity: isHovered && !disabled ? 1 : 0,
                pointerEvents: "none",
              }}
            >
              {inst.name}
            </span>
            {isActive && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1px solid ${inst.color}30`,
                  animation: "stage-pulse 2s ease-in-out infinite",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
