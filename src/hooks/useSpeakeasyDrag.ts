"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DragState {
  /** How far the footer has been dragged up in px (always >= 0) */
  offsetY: number;
  /** 0–1 progress toward threshold */
  progress: number;
  /** Whether the user is actively dragging */
  isDragging: boolean;
  /** Whether the exit transition is playing */
  isTransitioning: boolean;
}

interface UseSpeakeasyDragOptions {
  /** Max drag distance in px */
  maxDrag: number;
  /** Threshold ratio (0–1) at which the door "gives way" */
  threshold?: number;
  /** Resistance factor (higher = heavier). Applied as exponent to normalize drag. */
  resistance?: number;
}

export function useSpeakeasyDrag({
  maxDrag,
  threshold = 0.4,
  resistance = 0.55,
}: UseSpeakeasyDragOptions) {
  const router = useRouter();
  const [state, setState] = useState<DragState>({
    offsetY: 0,
    progress: 0,
    isDragging: false,
    isTransitioning: false,
  });

  const startYRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLElement | null>(null);

  /** Apply resistance curve: raw pixels → dampened pixels */
  const applyResistance = useCallback(
    (rawDelta: number) => {
      const normalized = Math.min(rawDelta / maxDrag, 1);
      const thresholdNorm = threshold;

      // Before threshold: heavy resistance (power curve with high exponent)
      // Past threshold: lighter resistance (latch releasing feel)
      if (normalized <= thresholdNorm) {
        const dampened = Math.pow(normalized / thresholdNorm, resistance) * thresholdNorm;
        return dampened * maxDrag;
      } else {
        // Past threshold — lower resistance exponent (feels like it gave way)
        const base = Math.pow(1, resistance) * thresholdNorm;
        const extra = normalized - thresholdNorm;
        const lighterResistance = 0.85;
        const dampened = base + Math.pow(extra / (1 - thresholdNorm), lighterResistance) * (1 - thresholdNorm);
        return dampened * maxDrag;
      }
    },
    [maxDrag, resistance, threshold],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (state.isTransitioning) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startYRef.current = e.clientY;
      currentOffsetRef.current = 0;
      setState((s) => ({ ...s, isDragging: true }));
    },
    [state.isTransitioning],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isDragging || state.isTransitioning) return;

      const rawDelta = startYRef.current - e.clientY;
      // Only allow upward drag
      if (rawDelta <= 0) {
        currentOffsetRef.current = 0;
        if (containerRef.current) {
          containerRef.current.style.setProperty("--speakeasy-progress", "0");
        }
        setState((s) => ({ ...s, offsetY: 0, progress: 0 }));
        return;
      }

      const dampened = applyResistance(rawDelta);
      currentOffsetRef.current = dampened;

      const progress = dampened / maxDrag;
      const glowProgress = Math.min(progress / threshold, 1);

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Update CSS custom property on container for glow (avoids React re-renders)
        if (containerRef.current) {
          containerRef.current.style.setProperty("--speakeasy-progress", String(glowProgress));
        }
        setState((s) => ({
          ...s,
          offsetY: dampened,
          progress: glowProgress,
        }));
      });
    },
    [state.isDragging, state.isTransitioning, applyResistance, maxDrag, threshold],
  );

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const triggerTransition = useCallback(() => {
    setState((s) => ({ ...s, isTransitioning: true, isDragging: false }));
    if (containerRef.current) {
      containerRef.current.style.setProperty("--speakeasy-progress", "1");
    }

    // After the footer flies up + glow fills screen, navigate
    setTimeout(() => {
      router.push("/speakeasy");
    }, prefersReducedMotion ? 100 : 600);
  }, [router, prefersReducedMotion]);

  const onPointerUp = useCallback(() => {
    if (!state.isDragging) return;

    const progress = currentOffsetRef.current / maxDrag;

    if (progress >= threshold) {
      // Past threshold — trigger exit
      triggerTransition();
    } else {
      // Snap back — rubber band
      if (containerRef.current) {
        containerRef.current.style.setProperty("--speakeasy-progress", "0");
      }
      setState({
        offsetY: 0,
        progress: 0,
        isDragging: false,
        isTransitioning: false,
      });
    }
  }, [state.isDragging, maxDrag, threshold, triggerTransition]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    state,
    containerRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    /** Call from the trigger button to hint the footer is loose */
    nudge: useCallback(() => {
      if (state.isTransitioning) return;
      setState((s) => ({ ...s, offsetY: 6, progress: 0 }));
      setTimeout(() => {
        setState((s) => {
          if (s.isDragging) return s;
          return { ...s, offsetY: 0, progress: 0 };
        });
      }, 400);
    }, [state.isTransitioning]),
  };
}
