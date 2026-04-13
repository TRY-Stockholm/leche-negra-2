"use client";

import { useState, useEffect, useRef } from "react";

const IDLE_THRESHOLD_MS = 8000;

export function useIdleState(enabled = true): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!enabled) return;

    function resetTimer() {
      setIsIdle(false);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsIdle(true), IDLE_THRESHOLD_MS);
    }

    resetTimer();
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return isIdle;
}
