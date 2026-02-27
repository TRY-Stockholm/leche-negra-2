"use client";

import { useCallback } from "react";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (value: number) => void;
  onMuteAll: () => void;
}

export function VolumeControl({ volume, onVolumeChange, onMuteAll }: VolumeControlProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange(parseFloat(e.target.value));
    },
    [onVolumeChange],
  );

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-[2px] px-4 py-3"
      style={{
        backgroundColor: "rgba(70, 11, 8, 0.85)",
        border: "1px solid rgba(61, 47, 40, 0.5)",
        backdropFilter: "blur(8px)",
      }}
    >
      <label
        htmlFor="stage-volume"
        className="font-mono text-[10px] uppercase tracking-[0.1em]"
        style={{ color: "#A89A8C" }}
      >
        Vol
      </label>
      <input
        id="stage-volume"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleChange}
        className="h-1 w-20 cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, #e43122 0%, #e43122 ${volume * 100}%, #3D2F28 ${volume * 100}%, #3D2F28 100%)`,
        }}
        aria-label="Master volume"
      />
      <button
        onClick={onMuteAll}
        className="min-h-8 rounded-[2px] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors duration-300 hover:bg-[rgba(228,49,34,0.1)]"
        style={{
          color: "#A89A8C",
          border: "1px solid rgba(61, 47, 40, 0.5)",
        }}
        aria-label="Mute all instruments"
      >
        Reset
      </button>
    </div>
  );
}
