"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Entry to the speakeasy by "lifting the page" off a hidden room.
 *
 * Two input paths, one shared physics/transition core:
 *
 * - Desktop (mouse): pointer-down on the footer drags the whole page up. Same
 *   behavior as the original footer-drag — handled by the returned
 *   `pointerHandlers`, which ignore `pointerType === "touch"`.
 *
 * - Touch: overscroll-to-enter. Native scroll is left completely untouched until
 *   the page is at its bottom edge and the finger keeps pulling up. Only then do
 *   we own the gesture (preventDefault) so the page follows the finger directly.
 *   This removes the old bug where the footer sat at the bottom and "swipe up to
 *   enter" collided with "scroll down to read the footer".
 */

interface EntryState {
  /** How far the page has been lifted, in px (>= 0). */
  offsetY: number;
  /** Actively dragging/pulling. */
  isDragging: boolean;
  /** The commit transition (fly-up → navigate) is playing. */
  isTransitioning: boolean;
}

const MAX_DRAG = 300;
const THRESHOLD = 0.4;
const RESISTANCE = 0.55;
/** Upward px before a touch pull commits to lifting the page. */
const TOUCH_INTENT = 12;
/** Upward px before a mouse drag commits. */
const POINTER_INTENT = 40;
/** Px of movement before we lock a touch as vertical vs horizontal. */
const DIRECTION_LOCK = 4;

export function useOverscrollEntry() {
  const router = useRouter();
  const [state, setState] = useState<EntryState>({
    offsetY: 0,
    isDragging: false,
    isTransitioning: false,
  });
  /** True once the visitor has scrolled to the bottom — drives the hint. */
  const [atBottom, setAtBottom] = useState(false);

  /** Host for the `--speakeasy-progress` CSS var (the outer root div). */
  const containerRef = useRef<HTMLElement | null>(null);

  const startYRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const rafRef = useRef(0);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isDraggingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const committedRef = useRef(false);

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

  const setProgress = useCallback((value: number) => {
    containerRef.current?.style.setProperty("--speakeasy-progress", String(value));
  }, []);

  /** Resistance curve: raw upward px → dampened lift px. Heavy before the
      threshold, lighter after (the "latch" giving way). */
  const applyResistance = useCallback((rawDelta: number) => {
    const normalized = Math.min(rawDelta / MAX_DRAG, 1);
    if (normalized <= THRESHOLD) {
      const dampened = Math.pow(normalized / THRESHOLD, RESISTANCE) * THRESHOLD;
      return dampened * MAX_DRAG;
    }
    const extra = normalized - THRESHOLD;
    const dampened = THRESHOLD + Math.pow(extra / (1 - THRESHOLD), 0.85) * (1 - THRESHOLD);
    return dampened * MAX_DRAG;
  }, []);

  const triggerTransition = useCallback(() => {
    isDraggingRef.current = false;
    isTransitioningRef.current = true;
    committedRef.current = false;
    setState((s) => ({ ...s, isTransitioning: true, isDragging: false }));
    setProgress(1);
    safeTimeout(() => router.push("/speakeasy"), prefersReducedMotion ? 100 : 1600);
  }, [router, prefersReducedMotion, safeTimeout, setProgress]);

  const snapBack = useCallback(() => {
    isDraggingRef.current = false;
    committedRef.current = false;
    setProgress(0);
    setState({ offsetY: 0, isDragging: false, isTransitioning: false });
  }, [setProgress]);

  /** Map a raw upward delta to lift offset + glow, throttled to one rAF. */
  const renderDelta = useCallback(
    (rawDelta: number) => {
      const dampened = rawDelta > 0 ? applyResistance(rawDelta) : 0;
      currentOffsetRef.current = dampened;
      const glow = Math.min(dampened / MAX_DRAG / THRESHOLD, 1);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setProgress(glow);
        setState((s) => ({ ...s, offsetY: dampened }));
      });
    },
    [applyResistance, setProgress],
  );

  const release = useCallback(() => {
    if (!isDraggingRef.current) return;
    if (!committedRef.current) {
      isDraggingRef.current = false;
      return;
    }
    const progress = currentOffsetRef.current / MAX_DRAG;
    if (progress >= THRESHOLD) {
      triggerTransition();
    } else {
      snapBack();
    }
  }, [triggerTransition, snapBack]);

  // ── Desktop pointer (mouse) — drag from the footer ──

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (isTransitioningRef.current) return;
    startYRef.current = e.clientY;
    currentOffsetRef.current = 0;
    committedRef.current = false;
    isDraggingRef.current = true;
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!isDraggingRef.current || isTransitioningRef.current) return;
      const rawDelta = startYRef.current - e.clientY;
      if (!committedRef.current) {
        if (rawDelta < POINTER_INTENT) return;
        committedRef.current = true;
        try {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
        setState((s) => ({ ...s, isDragging: true }));
      }
      renderDelta(rawDelta);
    },
    [renderDelta],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      release();
    },
    [release],
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

  // ── Touch — overscroll-to-enter (bound to window) ──

  useEffect(() => {
    // Neutralize the native rubber-band on the document so it can't compete with
    // the pull. Scoped to the landing: restored on unmount.
    const root = document.documentElement;
    const prevOverscroll = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "contain";

    const scrollEl = () =>
      (document.scrollingElement as HTMLElement | null) ?? document.documentElement;

    const isAtBottom = () => {
      const el = scrollEl();
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    };

    let startX = 0;
    // null = undecided, true = vertical, false = horizontal (ignore)
    let verticalLock: boolean | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (isTransitioningRef.current) return;
      startYRef.current = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      currentOffsetRef.current = 0;
      committedRef.current = false;
      isDraggingRef.current = false;
      verticalLock = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isTransitioningRef.current) return;
      const y = e.touches[0].clientY;

      // Already committed: we own the gesture — page follows the finger.
      if (committedRef.current) {
        e.preventDefault();
        renderDelta(startYRef.current - y);
        return;
      }

      const dx = e.touches[0].clientX - startX;
      const rawDelta = startYRef.current - y; // upward is positive

      if (verticalLock === null) {
        if (Math.abs(rawDelta) < DIRECTION_LOCK && Math.abs(dx) < DIRECTION_LOCK) return;
        verticalLock = Math.abs(rawDelta) >= Math.abs(dx);
      }
      if (!verticalLock) return; // horizontal swipe — leave it alone
      if (rawDelta <= 0) return; // pulling down — let native scroll handle it
      if (!isAtBottom()) return; // not at the end yet — normal scrolling

      // At the bottom and pulling up: claim the gesture now so iOS can't
      // rubber-band, but don't move the page until intent is clear.
      e.preventDefault();
      if (rawDelta < TOUCH_INTENT) return;

      committedRef.current = true;
      isDraggingRef.current = true;
      startYRef.current = y; // lift grows smoothly from 0 at the commit point
      setState((s) => ({ ...s, isDragging: true }));
    };

    const onTouchEnd = () => {
      verticalLock = null;
      release();
    };

    const onTouchCancel = () => {
      verticalLock = null;
      if (committedRef.current) {
        snapBack();
      } else {
        isDraggingRef.current = false;
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
      root.style.overscrollBehaviorY = prevOverscroll;
    };
  }, [renderDelta, release, snapBack]);

  // ── Hint: track whether the visitor has reached the bottom ──

  useEffect(() => {
    const check = () => {
      const el =
        (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // Cleanup rAF + pending timeouts on unmount.
  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      cancelAnimationFrame(rafRef.current);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return {
    state,
    atBottom,
    containerRef,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
