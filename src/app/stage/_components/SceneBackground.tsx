"use client";

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { instruments, MUSICIAN_LAYERS } from "./stage-config";

const MOBILE_MASK_BLUR = 0;

const SVG_NS = "http://www.w3.org/2000/svg";
const MASK_STROKE_WIDTH = 40;

export interface SceneBackgroundHandle {
  panToMusician: (stemId: string) => void;
}

interface SceneBackgroundProps {
  activeCount: number;
  activeInstruments: Set<string>;
}

function blackenForMask(el: SVGElement) {
  el.setAttribute("fill", "black");
  el.setAttribute("stroke", "black");
  el.setAttribute("stroke-width", String(MASK_STROKE_WIDTH));
  el.setAttribute("stroke-linejoin", "round");
  el.removeAttribute("opacity");
  el.style.cssText = "";
  for (const child of Array.from(el.children)) {
    if (child instanceof SVGElement) blackenForMask(child);
  }
}

export const SceneBackground = forwardRef<SceneBackgroundHandle, SceneBackgroundProps>(
  function SceneBackground({ activeCount, activeInstruments }, ref) {
    const isMobile = useIsMobile();
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const musicianGroupsRef = useRef<Map<string, SVGGElement[]>>(new Map());
    const maskClonesRef = useRef<Map<string, SVGGElement[]>>(new Map());
    const bgGroupRef = useRef<SVGGElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [panMax, setPanMax] = useState(0);
    const [svgLoaded, setSvgLoaded] = useState(false);
    const [svgError, setSvgError] = useState(false);

    const panX = useMotionValue(0);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const parallaxX = useSpring(mouseX, { stiffness: 120, damping: 20 });
    const parallaxY = useSpring(mouseY, { stiffness: 120, damping: 20 });
    const desktopX = useTransform(parallaxX, (v: number) => v * -8);
    const desktopY = useTransform(parallaxY, (v: number) => v * -5);

    const panToMusician = useCallback(
      (stemId: string) => {
        if (!isMobile || !svgRef.current) return;

        // Use the actual SVG bounding box of the musician group
        const layers = musicianGroupsRef.current.get(stemId);
        if (!layers || layers.length === 0) return;

        const svg = svgRef.current;
        const vb = svg.viewBox.baseVal;
        const svgAR = vb.width / vb.height;
        const vh = window.innerHeight;
        const fullWidth = vh * svgAR;
        const vw = window.innerWidth;

        const bbox = layers[0].getBBox();
        const centerXInViewBox = bbox.x + bbox.width / 2;
        const musicianPixelX = (centerXInViewBox / vb.width) * fullWidth;
        // SVG is initially offset by -overflow/2, so panX=0 shows the SVG center.
        // Calculate how far the musician is from the SVG center, then negate to pan there.
        const svgCenterPixelX = fullWidth / 2;
        const targetPan = -(musicianPixelX - svgCenterPixelX);
        const clamped = Math.max(-panMax, Math.min(panMax, targetPan));
        animate(panX, clamped, { type: "spring", stiffness: 100, damping: 20 });
      },
      [isMobile, panMax, panX],
    );

    useImperativeHandle(ref, () => ({ panToMusician }), [panToMusician]);

    useEffect(() => {
      const container = svgContainerRef.current;
      if (!container) return;

      fetch("/images/lecheFINAL.svg")
        .then((r) => {
          if (!r.ok) throw new Error(`SVG fetch failed: ${r.status}`);
          return r.text();
        })
        .then((text) => {
          container.innerHTML = text;
          const svg = container.querySelector("svg");
          if (!svg) return;

          svgRef.current = svg;
          svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.position = "absolute";
          svg.style.inset = "0";

          const vb = svg.viewBox.baseVal;

          const isMob = window.matchMedia("(max-width: 768px)").matches;

          const bg = svg.querySelector<SVGGElement>("#Background");
          if (bg) {
            bg.style.opacity = "0.3";
            bg.style.transition = "opacity 1s ease";
            bgGroupRef.current = bg;
          }

          // On desktop: create mask with cloned musician layers for bg-cutout reveal effect
          // On mobile: skip mask cloning entirely to halve SVG DOM node count
          if (!isMob) {
            let defs = svg.querySelector("defs");
            if (!defs) {
              defs = document.createElementNS(SVG_NS, "defs");
              svg.insertBefore(defs, svg.firstChild);
            }

            const mask = document.createElementNS(SVG_NS, "mask");
            mask.id = "bg-cutout";
            mask.setAttribute("maskUnits", "userSpaceOnUse");
            mask.setAttribute("x", String(vb.x));
            mask.setAttribute("y", String(vb.y));
            mask.setAttribute("width", String(vb.width));
            mask.setAttribute("height", String(vb.height));

            const whiteRect = document.createElementNS(SVG_NS, "rect");
            whiteRect.setAttribute("x", String(vb.x));
            whiteRect.setAttribute("y", String(vb.y));
            whiteRect.setAttribute("width", String(vb.width));
            whiteRect.setAttribute("height", String(vb.height));
            whiteRect.setAttribute("fill", "white");
            mask.appendChild(whiteRect);

            const blurFilter = document.createElementNS(SVG_NS, "filter");
            blurFilter.id = "mask-blur";
            blurFilter.setAttribute("x", "-50%");
            blurFilter.setAttribute("y", "-50%");
            blurFilter.setAttribute("width", "200%");
            blurFilter.setAttribute("height", "200%");
            const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
            blur.setAttribute("stdDeviation", "8");
            blurFilter.appendChild(blur);
            defs.appendChild(blurFilter);
            defs.appendChild(mask);

            if (bg) bg.setAttribute("mask", "url(#bg-cutout)");

            for (const [stemId, layerIds] of Object.entries(MUSICIAN_LAYERS)) {
              const clones: SVGGElement[] = [];
              for (const id of layerIds) {
                const el = svg.querySelector<SVGGElement>(`#${CSS.escape(id)}`);
                if (!el) continue;
                const clone = el.cloneNode(true) as SVGGElement;
                clone.removeAttribute("id");
                blackenForMask(clone);
                clone.setAttribute("filter", "url(#mask-blur)");
                clone.style.opacity = "0";
                clone.style.transition = "opacity 0.4s ease";
                mask.appendChild(clone);
                clones.push(clone);
              }
              if (clones.length > 0) maskClonesRef.current.set(stemId, clones);
            }
          }

          const groups = new Map<string, SVGGElement[]>();

          for (const [stemId, layerIds] of Object.entries(MUSICIAN_LAYERS)) {
            const layers: SVGGElement[] = [];
            for (const id of layerIds) {
              const el = svg.querySelector<SVGGElement>(`#${CSS.escape(id)}`);
              if (!el) continue;
              el.style.opacity = "0";
              el.style.transition = "opacity 0.6s ease, filter 0.6s ease";
              layers.push(el);
            }
            if (layers.length > 0) groups.set(stemId, layers);
          }

          musicianGroupsRef.current = groups;
          setSvgLoaded(true);
        })
        .catch(() => {
          setSvgError(true);
        });
    }, []);

    useEffect(() => {
      if (!svgLoaded) return;
      const svg = svgRef.current;
      if (!svg) return;

      const updateSize = () => {
        const vb = svg.viewBox.baseVal;
        if (!vb.width || !vb.height) return;

        if (isMobile) {
          const svgAR = vb.width / vb.height;
          const vh = window.innerHeight;
          const vw = window.innerWidth;
          const fullWidth = vh * svgAR;
          const overflow = Math.max(0, fullWidth - vw);

          svg.setAttribute("preserveAspectRatio", "xMinYMid meet");
          svg.style.width = `${fullWidth}px`;
          svg.style.height = "100%";
          svg.style.inset = "auto";
          svg.style.top = "0";
          svg.style.left = `${-overflow / 2}px`;
          setPanMax(overflow / 2);
        } else {
          svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.inset = "0";
          svg.style.top = "";
          svg.style.left = "";
          setPanMax(0);
        }
      };

      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, [isMobile, svgLoaded]);

    useEffect(() => {
      musicianGroupsRef.current.forEach((layers, stemId) => {
        const isActive = activeInstruments.has(stemId);
        layers.forEach((el) => {
          el.style.opacity = isActive ? "1" : "0";
          el.style.filter = isActive && !isMobile
            ? "drop-shadow(0 0 18px rgba(228,49,34,0.5)) drop-shadow(0 0 40px rgba(228,49,34,0.25))"
            : "none";
        });
        maskClonesRef.current.get(stemId)?.forEach((clone) => {
          clone.style.opacity = isActive ? "1" : "0";
        });
      });
    }, [activeInstruments, isMobile]);

    useEffect(() => {
      if (bgGroupRef.current) {
        bgGroupRef.current.style.opacity = String(0.25 + (activeCount / 6) * 0.35);
      }
    }, [activeCount]);

    useEffect(() => {
      if (isMobile) return;
      const onMove = (e: MouseEvent) => {
        mouseX.set(e.clientX / window.innerWidth - 0.5);
        mouseY.set(e.clientY / window.innerHeight - 0.5);
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      return () => window.removeEventListener("mousemove", onMove);
    }, [isMobile, mouseX, mouseY]);

    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ backgroundColor: "var(--background, #460b08)" }}
        aria-hidden="true"
      >
        {svgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground/40 text-sm">Scene unavailable</p>
          </div>
        )}
        {isMobile ? (
          <motion.div
            className="absolute inset-0"
            style={{ x: panX, willChange: "transform", touchAction: "pan-y" }}
            drag="x"
            dragConstraints={{ left: -panMax, right: panMax }}
            dragElastic={0.12}
            dragMomentum
            dragTransition={{ power: 0.3, timeConstant: 200 }}
          >
            <div ref={svgContainerRef} className="absolute inset-0" />
          </motion.div>
        ) : (
          <motion.div
            className="absolute inset-[-12px]"
            style={{ x: desktopX, y: desktopY, scale: 1.03, willChange: "transform" }}
          >
            <div ref={svgContainerRef} className="absolute inset-0" />
          </motion.div>
        )}
      </div>
    );
  },
);
