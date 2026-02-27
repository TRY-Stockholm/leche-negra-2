"use client";

import { useEffect, useState, memo } from "react";
import { Tentacle } from "./Tentacle";
import { FooterContent } from "./FooterContent";
import type { SiteSettings, SocialLink } from "@/lib/types";

const FOOTER_HEIGHT = 500;
const FOOTER_HEIGHT_MOBILE = 420;

interface FooterProps {
  siteSettings?: SiteSettings | null;
  socialLinks?: SocialLink[];
}

export const Footer = memo(function Footer({ siteSettings, socialLinks }: FooterProps) {
  const [height, setHeight] = useState(FOOTER_HEIGHT);
  const [showTentacle, setShowTentacle] = useState(false);

  useEffect(() => {
    const update = () => {
      setHeight(window.innerWidth < 640 ? FOOTER_HEIGHT_MOBILE : FOOTER_HEIGHT);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <div style={{ height }} />

      <footer
        className="theme-night fixed bottom-0 left-0 right-0 bg-background border-t border-border/30"
        style={{ height, zIndex: 0 }}
      >
        <Tentacle show={showTentacle} />
        <FooterContent onTentacleHover={setShowTentacle} siteSettings={siteSettings} socialLinks={socialLinks} />
      </footer>
    </>
  );
});
