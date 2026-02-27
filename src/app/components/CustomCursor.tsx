"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

const CURSOR_SIZE = 84;
const HOVER_SIZE = 112;
const GRAB_SIZE = 96;
const RUDE_SIZE = 112;
const SPRING = { damping: 40, stiffness: 400, mass: 0.2 };

// Hotspot pixel offsets: how far from the div's top-left the cursor "tip" sits.
// Computed from each SVG's viewBox aspect ratio + preserveAspectRatio centering.
const CURSOR_HOTSPOT = { x: 3, y: 0 };
const HOVER_HOTSPOT = { x: 49, y: 0 };
const GRAB_HOTSPOT = { x: 48, y: 14 };
const RUDE_HOTSPOT = { x: 56, y: 0 };

// ~12% chance per qualifying click, minimum 10s between triggers
const RUDE_CHANCE = 0.12;
const RUDE_DURATION = 1400;
const RUDE_COOLDOWN = 10_000;

let svgCache: string | null = null;
let hoverSvgCache: string | null = null;
let grabSvgCache: string | null = null;
let rudeSvgCache: string | null = null;

const rIC =
  typeof requestIdleCallback === "function"
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 1) as unknown as number;
const cIC =
  typeof cancelIdleCallback === "function"
    ? cancelIdleCallback
    : (id: number) => clearTimeout(id);

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, select, textarea, label, [data-cursor='pointer']";

function fetchSvg(
  url: string,
  cache: { current: string | null },
  colorSvg: (raw: string) => string,
  setSvg: (html: string) => void,
  cancelled: { current: boolean },
) {
  if (cache.current) {
    setSvg(colorSvg(cache.current));
    return;
  }
  fetch(url)
    .then((r) => r.text())
    .then((raw) => {
      cache.current = raw;
      if (!cancelled.current) setSvg(colorSvg(raw));
    });
}

export function CustomCursor() {
  const [isHoverDevice, setIsHoverDevice] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    setIsHoverDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsHoverDevice(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!isHoverDevice) return null;

  return <CustomCursorInner />;
}

function CustomCursorInner() {
  const [svgHtml, setSvgHtml] = useState<string | null>(svgCache);
  const [hoverSvgHtml, setHoverSvgHtml] = useState<string | null>(null);
  const [grabSvgHtml, setGrabSvgHtml] = useState<string | null>(null);
  const [rudeSvgHtml, setRudeSvgHtml] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rudeActive, setRudeActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const lastRudeAt = useRef(0);
  const rudeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useSpring(mouseX, SPRING);
  const y = useSpring(mouseY, SPRING);

  // Color an SVG that uses the OpenNoTape group
  const colorSvg = useCallback((raw: string) => {
    const fg = getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim();
    return raw.replace(
      '<g id="OpenNoTape">',
      `<g id="OpenNoTape" fill="${fg}">`,
    );
  }, []);

  // Fetch main cursor
  useEffect(() => {
    const cancelled = { current: false };
    const svgCacheRef = { current: svgCache };
    fetchSvg("/MousePointer.svg", svgCacheRef, colorSvg, (html) => {
      svgCache = svgCacheRef.current;
      setSvgHtml(html);
    }, cancelled);
    return () => { cancelled.current = true; };
  }, [colorSvg]);

  // Fetch hover, grab, rude cursors on idle
  useEffect(() => {
    const cancelled = { current: false };
    const cacheRef = { current: hoverSvgCache };
    const id = rIC(() =>
      fetchSvg("/PointerOnHover.svg", cacheRef, colorSvg, (html) => {
        hoverSvgCache = cacheRef.current;
        setHoverSvgHtml(html);
      }, cancelled),
    );
    return () => { cancelled.current = true; cIC(id); };
  }, [colorSvg]);

  useEffect(() => {
    const cancelled = { current: false };
    const cacheRef = { current: grabSvgCache };
    const id = rIC(() =>
      fetchSvg("/PointerGrab.svg", cacheRef, colorSvg, (html) => {
        grabSvgCache = cacheRef.current;
        setGrabSvgHtml(html);
      }, cancelled),
    );
    return () => { cancelled.current = true; cIC(id); };
  }, [colorSvg]);

  useEffect(() => {
    const cancelled = { current: false };
    const cacheRef = { current: rudeSvgCache };
    const id = rIC(() =>
      fetchSvg("/FuckYou.svg", cacheRef, colorSvg, (html) => {
        rudeSvgCache = cacheRef.current;
        setRudeSvgHtml(html);
      }, cancelled),
    );
    return () => { cancelled.current = true; cIC(id); };
  }, [colorSvg]);

  // Re-color all cursors when theme changes
  useEffect(() => {
    const recolor = () => {
      const fg = getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim();
      const colorWithFg = (raw: string) =>
        raw.replace('<g id="OpenNoTape">', `<g id="OpenNoTape" fill="${fg}">`);
      if (svgCache) setSvgHtml(colorWithFg(svgCache));
      if (hoverSvgCache) setHoverSvgHtml(colorWithFg(hoverSvgCache));
      if (grabSvgCache) setGrabSvgHtml(colorWithFg(grabSvgCache));
      if (rudeSvgCache) setRudeSvgHtml(colorWithFg(rudeSvgCache));
    };

    const observer = new MutationObserver(recolor);
    const wrapper = document.body.firstElementChild;
    if (wrapper) {
      observer.observe(wrapper, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    return () => observer.disconnect();
  }, []);

  // Hide system cursor
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("cursor", "none", "important");

    const style = document.createElement("style");
    style.id = "hide-system-cursor";
    style.textContent =
      "html, html *, html *::before, html *::after { cursor: none !important; }";
    document.head.appendChild(style);

    return () => {
      html.style.removeProperty("cursor");
      style.remove();
    };
  }, []);

  // Track mouse position + detect hover over interactive elements
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }

      const target = e.target as Element | null;
      const isInteractive = target?.closest?.(INTERACTIVE_SELECTOR) != null;
      setHovering((prev) => (prev === isInteractive ? prev : isInteractive));
    };

    const handleLeave = () => {
      visibleRef.current = false;
      setVisible(false);
    };
    const handleEnter = () => {
      visibleRef.current = true;
      setVisible(true);
    };

    window.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerleave", handleLeave);
    document.addEventListener("pointerenter", handleEnter);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      document.removeEventListener("pointerenter", handleEnter);
    };
  }, [mouseX, mouseY]);

  // Swap to grab cursor while dragging
  useEffect(() => {
    const handleDown = () => setDragging(true);
    const handleUp = () => setDragging(false);

    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, []);

  // Random rude cursor flash on user actions
  const rudeActiveRef = useRef(false);
  const rudeSvgRef = useRef(rudeSvgHtml);
  rudeSvgRef.current = rudeSvgHtml;

  useEffect(() => {
    const maybeFlash = () => {
      if (!rudeSvgRef.current) return;
      if (rudeActiveRef.current) return;
      const now = Date.now();
      if (now - lastRudeAt.current < RUDE_COOLDOWN) return;
      if (Math.random() > RUDE_CHANCE) return;

      lastRudeAt.current = now;
      rudeActiveRef.current = true;
      setRudeActive(true);
      rudeTimerRef.current = setTimeout(() => {
        rudeActiveRef.current = false;
        setRudeActive(false);
        rudeTimerRef.current = null;
      }, RUDE_DURATION);
    };

    window.addEventListener("pointerup", maybeFlash);
    return () => {
      window.removeEventListener("pointerup", maybeFlash);
      if (rudeTimerRef.current) clearTimeout(rudeTimerRef.current);
    };
  }, []);

  if (!svgHtml) return null;

  // Priority: rude > grab > hover > default
  const isRude = rudeActive && rudeSvgHtml;
  const isGrab = !isRude && dragging && grabSvgHtml;
  const isHover = !isRude && !isGrab && hovering && hoverSvgHtml;

  const activeSvg = isRude
    ? rudeSvgHtml
    : isGrab
      ? grabSvgHtml
      : isHover
        ? hoverSvgHtml
        : svgHtml;
  const activeSize = isRude
    ? RUDE_SIZE
    : isGrab
      ? GRAB_SIZE
      : isHover
        ? HOVER_SIZE
        : CURSOR_SIZE;
  const activeHotspot = isRude
    ? RUDE_HOTSPOT
    : isGrab
      ? GRAB_HOTSPOT
      : isHover
        ? HOVER_HOTSPOT
        : CURSOR_HOTSPOT;

  return (
    <motion.div
      className="custom-cursor pointer-events-none fixed top-0 left-0 z-[9999]"
      style={{
        width: activeSize,
        height: activeSize,
        x,
        y,
        marginLeft: -activeHotspot.x,
        marginTop: -activeHotspot.y,
        opacity: visible ? 1 : 0,
      }}
      dangerouslySetInnerHTML={{ __html: activeSvg }}
    />
  );
}
