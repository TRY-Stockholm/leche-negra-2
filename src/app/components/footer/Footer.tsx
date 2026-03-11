"use client";

import { useEffect, useState, memo } from "react";
import { FooterContent } from "./FooterContent";
import type { SiteSettings, SocialLink } from "@/lib/types";

const FOOTER_HEIGHT = 500;
const FOOTER_HEIGHT_MOBILE = 420;

interface FooterProps {
  siteSettings?: SiteSettings | null;
  socialLinks?: SocialLink[];
  /** Pointer handlers from the drag hook — spread onto the footer element */
  dragHandlers?: Record<string, (e: React.PointerEvent) => void>;
  /** Whether the user is actively dragging */
  isDragging?: boolean;
  /** Nudge hint callback for the trigger text */
  onDragHint?: () => void;
}

export const Footer = memo(function Footer({
  siteSettings,
  socialLinks,
  dragHandlers,
  isDragging,
  onDragHint,
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

  return (
    <footer
      className="relative theme-night bg-background border-t border-border/30 touch-none"
      style={{
        height,
        cursor: isDragging ? "grabbing" : undefined,
      }}
      {...dragHandlers}
    >
      <FooterContent
        onDragHint={onDragHint ?? (() => { })}
        siteSettings={siteSettings}
        socialLinks={socialLinks}
        isDragging={isDragging}
      />
    </footer>
  );
});
