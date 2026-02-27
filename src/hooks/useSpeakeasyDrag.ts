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
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Mirror boolean state in refs for reliable reads inside pointer handlers
  const isDraggingRef = useRef(false);
  const isTransitioningRef = useRef(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  /** Helper to track timeouts for cleanup */
  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutRefs.current.push(id);
    return id;
  }, []);

  /** Apply resistance curve: raw pixels → dampened pixels */
  const applyResistance = useCallback(
    (rawDelta: number) => {
      const normalized = Math.min(rawDelta / maxDrag, 1);

      // Before threshold: heavy resistance (power curve with high exponent)
      // Past threshold: lighter resistance (latch releasing feel)
      if (normalized <= threshold) {
        const dampened = Math.pow(normalized / threshold, resistance) * threshold;
        return dampened * maxDrag;
      } else {
        // Continuous at threshold boundary (base = threshold when normalized = threshold)
        const base = threshold;
        const extra = normalized - threshold;
        const lighterResistance = 0.85;
        const dampened = base + Math.pow(extra / (1 - threshold), lighterResistance) * (1 - threshold);
        return dampened * maxDrag;
      }
    },
    [maxDrag, resistance, threshold],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isTransitioningRef.current) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startYRef.current = e.clientY;
      currentOffsetRef.current = 0;
      isDraggingRef.current = true;
      setState((s) => ({ ...s, isDragging: true }));
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || isTransitioningRef.current) return;

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
    [applyResistance, maxDrag, threshold],
  );

  const triggerTransition = useCallback(() => {
    isDraggingRef.current = false;
    isTransitioningRef.current = true;
    setState((s) => ({ ...s, isTransitioning: true, isDragging: false }));
    if (containerRef.current) {
      containerRef.current.style.setProperty("--speakeasy-progress", "1");
    }

    // After the footer flies up + glow fills screen, navigate
    safeTimeout(() => {
      router.push("/speakeasy");
    }, prefersReducedMotion ? 100 : 600);
  }, [router, prefersReducedMotion, safeTimeout]);

  const snapBack = useCallback((e?: React.PointerEvent) => {
    if (e) {
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
    isDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.setProperty("--speakeasy-progress", "0");
    }
    setState({
      offsetY: 0,
      progress: 0,
      isDragging: false,
      isTransitioning: false,
    });
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      const progress = currentOffsetRef.current / maxDrag;

      if (progress >= threshold) {
        // Past threshold — trigger exit
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        triggerTransition();
      } else {
        snapBack(e);
      }
    },
    [maxDrag, threshold, triggerTransition, snapBack],
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      snapBack(e);
    },
    [snapBack],
  );

  // Cleanup rAF and timeouts on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  return {
    state,
    containerRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    /** Call from the trigger text to hint the footer is loose */
    nudge: useCallback(() => {
      if (isTransitioningRef.current || isDraggingRef.current) return;
      setState((s) => ({ ...s, offsetY: 6, progress: 0 }));
      safeTimeout(() => {
        setState((s) => {
          if (isDraggingRef.current) return s;
          return { ...s, offsetY: 0, progress: 0 };
        });
      }, 400);
    }, [safeTimeout]),
  };
}
