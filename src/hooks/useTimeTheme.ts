"use client";

import { useState, useEffect } from "react";
import type { Theme } from "@/lib/types";

function getTimeTheme(): Theme {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return "morning";
  if (h >= 10 && h < 15) return "lunch";
  if (h >= 15 && h < 20) return "dinner";
  return "night";
}

export function useTimeTheme() {
  const [timeTheme, setTimeTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTimeTheme(getTimeTheme());
    const interval = setInterval(() => {
      setTimeTheme(getTimeTheme());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return timeTheme;
}
