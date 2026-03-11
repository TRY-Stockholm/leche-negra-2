"use client";

import { useState } from "react";
import Link from "next/link";
import { PressCanvas } from "./PressCanvas";
import { PressGallery } from "./PressGallery";
import type { PressImageDoc, PressQuoteDoc } from "./types";

type ViewMode = "canvas" | "gallery";

export function PressPage({
  images,
  quotes,
}: {
  images: PressImageDoc[];
  quotes: PressQuoteDoc[];
}) {
  const [view, setView] = useState<ViewMode>("canvas");

  // Empty state
  if (images.length === 0 && quotes.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-display italic text-foreground/40 text-lg mb-2">nothing here yet.</p>
          <Link
            href="/studio"
            className="font-body text-[0.6875rem] tracking-[0.06em] uppercase text-accent hover:text-foreground transition-colors duration-300"
          >
            Add images in Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 py-3 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto font-display italic text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          Back
        </Link>
        <span className="font-display italic text-foreground/60 text-sm">
          Press
        </span>
      </nav>

      {/* View toggle — bottom right */}
      <div className="fixed bottom-6 right-5 md:right-10 z-50">
        <div className="flex items-center gap-0 font-display italic text-sm">
          <button
            onClick={() => setView("canvas")}
            className={`px-2 py-1 transition-colors duration-300 cursor-pointer ${
              view === "canvas"
                ? "text-foreground"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            canvas
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={() => setView("gallery")}
            className={`px-2 py-1 transition-colors duration-300 cursor-pointer ${
              view === "gallery"
                ? "text-foreground"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            gallery
          </button>
        </div>
      </div>

      {view === "canvas" ? (
        <PressCanvas images={images} quotes={quotes} />
      ) : (
        <PressGallery images={images} />
      )}
    </div>
  );
}
