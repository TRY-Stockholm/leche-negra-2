"use client";

import { useEffect, useState, memo } from "react";
import { motion } from "motion/react";
import { FooterContent } from "./FooterContent";
import { SpeakeasyGlow } from "./SpeakeasyGlow";
import { BlackoutOverlay } from "./BlackoutOverlay";
import { useSpeakeasyDrag } from "@/hooks/useSpeakeasyDrag";
import type { SiteSettings, SocialLink } from "@/lib/types";

const FOOTER_HEIGHT = 500;
const FOOTER_HEIGHT_MOBILE = 420;

interface FooterProps {
  siteSettings?: SiteSettings | null;
  socialLinks?: SocialLink[];
}

export const Footer = memo(function Footer({
  siteSettings,
  socialLinks,
}: FooterProps) {
  const [height, setHeight] = useState(FOOTER_HEIGHT);

  useEffect(() => {
    const update = () => {
      setHeight(window.innerWidth < 640 ? FOOTER_HEIGHT_MOBILE : FOOTER_HEIGHT);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { state, containerRef, handlers, nudge } = useSpeakeasyDrag({
    maxDrag: height * 0.6,
    threshold: 0.4,
    resistance: 0.55,
  });

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>}>
      <div style={{ height }} />

      {/* Glow layer — behind footer */}
      <SpeakeasyGlow />

      <motion.footer
        className="theme-night fixed bottom-0 left-0 right-0 bg-background border-t border-border/30 touch-none"
        style={{
          height,
          zIndex: 0,
          y: state.isTransitioning ? undefined : -state.offsetY,
          cursor: state.isDragging ? "grabbing" : undefined,
        }}
        animate={
          state.isTransitioning
            ? { y: -height - 100 }
            : !state.isDragging
              ? { y: 0 }
              : undefined
        }
        transition={
          state.isTransitioning
            ? { type: "spring", stiffness: 300, damping: 30 }
            : !state.isDragging
              ? { type: "spring", stiffness: 200, damping: 25 }
              : undefined
        }
        {...handlers}
      >
        <FooterContent
          onDragHint={nudge}
          siteSettings={siteSettings}
          socialLinks={socialLinks}
          isDragging={state.isDragging}
        />
      </motion.footer>

      {/* Blackout during transition */}
      <BlackoutOverlay active={state.isTransitioning} />
    </div>
  );
});
