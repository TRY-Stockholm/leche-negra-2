"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { playHeartbeat } from "@/lib/heartbeat";

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
  const lastYRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLElement | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isDraggingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  /** Whether we've committed to the speakeasy drag (past the intent threshold) */
  const committedRef = useRef(false);
  /** Whether this gesture was decided (committed or rejected) */
  const decidedRef = useRef(false);
  // Px of sustained upward movement before we commit to the drag
  const INTENT_THRESHOLD = 40;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutRefs.current.push(id);
    return id;
  }, []);

  /** Apply resistance curve: raw pixels → dampened pixels */
  const applyResistance = useCallback(
    (rawDelta: number) => {
      const normalized = Math.min(rawDelta / maxDrag, 1);

      if (normalized <= threshold) {
        const dampened = Math.pow(normalized / threshold, resistance) * threshold;
        return dampened * maxDrag;
      } else {
        const base = threshold;
        const extra = normalized - threshold;
        const lighterResistance = 0.85;
        const dampened = base + Math.pow(extra / (1 - threshold), lighterResistance) * (1 - threshold);
        return dampened * maxDrag;
      }
    },
    [maxDrag, resistance, threshold],
  );

  const triggerTransition = useCallback(() => {
    isDraggingRef.current = false;
    isTransitioningRef.current = true;
    setState((s) => ({ ...s, isTransitioning: true, isDragging: false }));
    if (containerRef.current) {
      containerRef.current.style.setProperty("--speakeasy-progress", "1");
    }

    if (!prefersReducedMotion) {
      playHeartbeat();
    }

    safeTimeout(() => {
      router.push("/speakeasy");
    }, prefersReducedMotion ? 100 : 1600);
  }, [router, prefersReducedMotion, safeTimeout]);

  const snapBack = useCallback(() => {
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

  // ── Mouse (desktop) handlers via pointer events ──

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only handle mouse — touch is handled separately
      if (e.pointerType === "touch") return;
      if (isTransitioningRef.current) return;
      startYRef.current = e.clientY;
      currentOffsetRef.current = 0;
      committedRef.current = false;
      decidedRef.current = false;
      isDraggingRef.current = true;
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!isDraggingRef.current || isTransitioningRef.current) return;

      const rawDelta = startYRef.current - e.clientY;

      if (!committedRef.current) {
        if (rawDelta < INTENT_THRESHOLD) return;
        committedRef.current = true;
        try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
        setState((s) => ({ ...s, isDragging: true }));
      }

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
        if (containerRef.current) {
          containerRef.current.style.setProperty("--speakeasy-progress", String(glowProgress));
        }
        setState((s) => ({ ...s, offsetY: dampened, progress: glowProgress }));
      });
    },
    [applyResistance, maxDrag, threshold],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!isDraggingRef.current) return;

      if (!committedRef.current) {
        isDraggingRef.current = false;
        return;
      }

      const progress = currentOffsetRef.current / maxDrag;
      if (progress >= threshold) {
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        triggerTransition();
      } else {
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        snapBack();
      }
    },
    [maxDrag, threshold, triggerTransition, snapBack],
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!isDraggingRef.current) return;
      if (!committedRef.current) {
        isDraggingRef.current = false;
        return;
      }
      snapBack();
    },
    [snapBack],
  );

  // ── Touch (mobile) handlers ──
  // We use native touch events so we can selectively call preventDefault
  // only after committing to the drag. This lets the browser scroll normally
  // for any gesture that isn't a clear upward pull.

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isTransitioningRef.current) return;
      const touch = e.touches[0];
      startYRef.current = touch.clientY;
      lastYRef.current = touch.clientY;
      currentOffsetRef.current = 0;
      committedRef.current = false;
      decidedRef.current = false;
      isDraggingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || isTransitioningRef.current) return;

      const touch = e.touches[0];
      const rawDelta = startYRef.current - touch.clientY;
      lastYRef.current = touch.clientY;

      if (!decidedRef.current) {
        // User swiping down — let the browser scroll normally
        if (rawDelta < -10) {
          decidedRef.current = true;
          isDraggingRef.current = false;
          return;
        }
        // Not enough upward movement yet — let the browser handle it
        if (rawDelta < INTENT_THRESHOLD) return;
        // Commit to speakeasy drag
        decidedRef.current = true;
        committedRef.current = true;
        setState((s) => ({ ...s, isDragging: true }));
      }

      if (!committedRef.current) return;

      // Prevent scroll — we own this gesture now
      e.preventDefault();

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
        if (containerRef.current) {
          containerRef.current.style.setProperty("--speakeasy-progress", String(glowProgress));
        }
        setState((s) => ({ ...s, offsetY: dampened, progress: glowProgress }));
      });
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return;

      if (!committedRef.current) {
        isDraggingRef.current = false;
        return;
      }

      const progress = currentOffsetRef.current / maxDrag;
      if (progress >= threshold) {
        triggerTransition();
      } else {
        snapBack();
      }
    };

    const handleTouchCancel = () => {
      if (!isDraggingRef.current) return;
      if (!committedRef.current) {
        isDraggingRef.current = false;
        return;
      }
      snapBack();
    };

    // passive: false so we can call preventDefault on touchmove
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [applyResistance, maxDrag, threshold, triggerTransition, snapBack]);

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
