"use client";

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { instruments, MUSICIAN_LAYERS } from "./stage-config";

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
        const inst = instruments.find((i) => i.id === stemId);
        if (!inst) return;

        const svg = svgRef.current;
        const vb = svg.viewBox.baseVal;
        const svgAR = vb.width / vb.height;
        const vh = window.innerHeight;
        const fullWidth = vh * svgAR;
        const vw = window.innerWidth;

        const musicianPixelX = (inst.position.x / 100) * fullWidth;
        const targetPan = -(musicianPixelX - vw / 2);
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
        .then((r) => r.text())
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

          const bg = svg.querySelector<SVGGElement>("#Background");
          if (bg) {
            bg.style.opacity = "0.3";
            bg.style.transition = "opacity 1s ease";
            bg.setAttribute("mask", "url(#bg-cutout)");
            bgGroupRef.current = bg;
          }

          const groups = new Map<string, SVGGElement[]>();
          const maskClones = new Map<string, SVGGElement[]>();

          for (const [stemId, layerIds] of Object.entries(MUSICIAN_LAYERS)) {
            const layers: SVGGElement[] = [];
            const clones: SVGGElement[] = [];

            for (const id of layerIds) {
              const el = svg.querySelector<SVGGElement>(`#${CSS.escape(id)}`);
              if (!el) continue;

              el.style.opacity = "0";
              el.style.transition = "opacity 0.6s ease, filter 0.6s ease";
              layers.push(el);

              const clone = el.cloneNode(true) as SVGGElement;
              clone.removeAttribute("id");
              blackenForMask(clone);
              clone.setAttribute("filter", "url(#mask-blur)");
              clone.style.opacity = "0";
              clone.style.transition = "opacity 0.4s ease";
              mask.appendChild(clone);
              clones.push(clone);
            }

            if (layers.length > 0) {
              groups.set(stemId, layers);
              maskClones.set(stemId, clones);
            }
          }

          musicianGroupsRef.current = groups;
          maskClonesRef.current = maskClones;
          setSvgLoaded(true);
        });
    }, []);

    useEffect(() => {
      if (!svgLoaded) return;
      const svg = svgRef.current;
      if (!svg) return;
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
    }, [isMobile, svgLoaded]);

    useEffect(() => {
      musicianGroupsRef.current.forEach((layers, stemId) => {
        const isActive = activeInstruments.has(stemId);
        layers.forEach((el) => {
          el.style.opacity = isActive ? "1" : "0";
          el.style.filter = isActive
            ? "drop-shadow(0 0 18px rgba(201,169,110,0.5)) drop-shadow(0 0 40px rgba(201,169,110,0.25))"
            : "none";
        });
        maskClonesRef.current.get(stemId)?.forEach((clone) => {
          clone.style.opacity = isActive ? "1" : "0";
        });
      });
    }, [activeInstruments]);

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
        style={{ backgroundColor: "var(--color-charcoal, #1a1210)" }}
        aria-hidden="true"
      >
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
