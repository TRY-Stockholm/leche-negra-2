"use client";

import { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";

interface DragState {
  panX: number;
  panY: number;
}

interface UseCanvasDragOptions {
  onUpdate: (x: number, y: number) => void;
}

export function useCanvasDrag({ onUpdate }: UseCanvasDragOptions) {
  const state = useRef<DragState>({ panX: 0, panY: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const rafId = useRef<number>(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-press-item]")) return;

    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    lastTime.current = performance.now();

    tweenRef.current?.kill();

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      const now = performance.now();
      const dt = Math.max(now - lastTime.current, 1);

      const factor = 0.8;
      velocity.current.x = factor * (dx / dt) * 1000 + (1 - factor) * velocity.current.x;
      velocity.current.y = factor * (dy / dt) * 1000 + (1 - factor) * velocity.current.y;

      lastPointer.current = { x: e.clientX, y: e.clientY };
      lastTime.current = now;

      state.current.panX -= dx;
      state.current.panY -= dy;
      onUpdate(state.current.panX, state.current.panY);
    },
    [onUpdate],
  );

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    const vx = -velocity.current.x;
    const vy = -velocity.current.y;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed > 50) {
      const target = {
        x: state.current.panX + vx * 0.8,
        y: state.current.panY + vy * 0.8,
      };

      const proxy = { x: state.current.panX, y: state.current.panY };
      tweenRef.current = gsap.to(proxy, {
        x: target.x,
        y: target.y,
        duration: Math.min(speed / 800, 2.5),
        ease: "power3.out",
        onUpdate: () => {
          state.current.panX = proxy.x;
          state.current.panY = proxy.y;
          onUpdate(proxy.x, proxy.y);
        },
      });
    }
  }, [onUpdate]);

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    stateRef: state,
  };
}
