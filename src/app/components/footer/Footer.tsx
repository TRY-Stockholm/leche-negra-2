"use client";

import { useEffect, useState } from "react";
import { Tentacle } from "./Tentacle";
import { FooterContent } from "./FooterContent";

const FOOTER_HEIGHT = 500;
const FOOTER_HEIGHT_MOBILE = 420;

export function Footer() {
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
        <FooterContent onTentacleHover={setShowTentacle} />
      </footer>
    </>
  );
}
