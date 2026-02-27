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
  const footerRef = useRef<HTMLElement>(null);

  /** Apply resistance curve: raw pixels → dampened pixels */
  const applyResistance = useCallback(
    (rawDelta: number) => {
      const normalized = Math.min(rawDelta / maxDrag, 1);
      // Power curve creates heavy-then-lighter feel
      const dampened = Math.pow(normalized, resistance);
      return dampened * maxDrag;
    },
    [maxDrag, resistance],
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
        setState((s) => ({ ...s, offsetY: 0, progress: 0 }));
        return;
      }

      const dampened = applyResistance(rawDelta);
      currentOffsetRef.current = dampened;

      // Past threshold: reduce resistance (latch releasing feel)
      const progress = dampened / maxDrag;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setState((s) => ({
          ...s,
          offsetY: dampened,
          progress: Math.min(progress / threshold, 1),
        }));
      });
    },
    [state.isDragging, state.isTransitioning, applyResistance, maxDrag, threshold],
  );

  const triggerTransition = useCallback(() => {
    setState((s) => ({ ...s, isTransitioning: true, isDragging: false }));

    // After the footer flies up + glow fills screen, navigate
    setTimeout(() => {
      router.push("/speakeasy");
    }, 600);
  }, [router]);

  const onPointerUp = useCallback(() => {
    if (!state.isDragging) return;

    const progress = currentOffsetRef.current / maxDrag;

    if (progress >= threshold) {
      // Past threshold — trigger exit
      triggerTransition();
    } else {
      // Snap back — rubber band
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
    footerRef,
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
