"use client";

import { useState, useEffect } from "react";

interface NeonPath {
  d: string;
  index: number;
}

let cached: { viewBox: string; paths: NeonPath[] } | null = null;

function parseSvg(text: string): { viewBox: string; paths: NeonPath[] } {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  const viewBox = svg?.getAttribute("viewBox") ?? "0 0 5614.94 1083.71";
  const paths: NeonPath[] = [];
  doc.querySelectorAll("path").forEach((el) => {
    const d = el.getAttribute("d");
    if (!d) return;
    const idx = el.getAttribute("data-neon");
    paths.push({ d, index: idx != null ? Number(idx) : paths.length });
  });
  return { viewBox, paths };
}

export function NeonLogo({ isOff }: { isOff: boolean }) {
  const [data, setData] = useState(cached);

  useEffect(() => {
    if (cached) return;
    fetch("/leche-negra-logo-neon.svg")
      .then((r) => r.text())
      .then((text) => {
        cached = parseSvg(text);
        setData(cached);
      });
  }, []);

  if (!data) return null;

  return (
    <svg
      viewBox={data.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={`neon-logo w-full max-w-[560px] h-auto ${isOff ? "neon-logo--off" : ""}`}
      aria-label="Leche Negra"
      role="img"
    >
      {data.paths.map((p) => (
        <path
          key={p.index}
          d={p.d}
          className="neon-char"
          style={{ "--char-i": p.index } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}
