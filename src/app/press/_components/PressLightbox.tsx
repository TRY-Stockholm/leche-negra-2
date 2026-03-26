"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { PressImageDoc } from "./types";

interface PressLightboxProps {
  images: PressImageDoc[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PressLightbox({
  images,
  activeIndex,
  onClose,
  onNavigate,
}: PressLightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const active = images[activeIndex];

  useEffect(() => {
    if (!overlayRef.current) return;

    import("gsap").then(({ default: gsap }) => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
      );

      const sourceEl = document.querySelector(
        `[data-item-id="${active._id}"]`,
      ) as HTMLElement | null;

      if (sourceEl && imgRef.current) {
        const rect = sourceEl.getBoundingClientRect();
        const img = imgRef.current;

        gsap.fromTo(
          img,
          {
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            opacity: 0.8,
          },
          {
            left: "50%",
            top: "50%",
            xPercent: -50,
            yPercent: -50,
            width: "auto",
            height: "auto",
            maxWidth: "90vw",
            maxHeight: "85vh",
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
            clearProps: "position,left,top,width,height,xPercent,yPercent",
          },
        );
      }
    });
  }, [active._id]);

  const handleClose = useCallback(() => {
    if (!overlayRef.current) {
      onClose();
      return;
    }
    import("gsap").then(({ default: gsap }) => {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: onClose,
      });
    });
  }, [onClose]);

  const dims = active.image.asset.metadata?.dimensions;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "color-mix(in srgb, var(--background) 92%, transparent)", backdropFilter: "blur(8px)" }}
      onClick={handleClose}
    >
      <button
        className="absolute top-4 right-6 text-muted-foreground hover:text-foreground transition-colors duration-200 text-2xl z-10 normal-case tracking-normal"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        aria-label="Close"
      >
        &times;
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 text-3xl z-10 normal-case tracking-normal"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((activeIndex - 1 + images.length) % images.length);
            }}
            aria-label="Previous image"
          >
            &#8249;
          </button>
          <button
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 text-3xl z-10 normal-case tracking-normal"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((activeIndex + 1) % images.length);
            }}
            aria-label="Next image"
          >
            &#8250;
          </button>
        </>
      )}

      <Image
        ref={imgRef}
        src={urlFor(active.image).width(1800).url()}
        alt={active.image.alt || active.title}
        width={dims?.width || 1800}
        height={dims?.height || 1200}
        className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain"
        sizes="90vw"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase text-muted-foreground/60">
          {active.title}
        </span>
      </div>
    </div>
  );
}
