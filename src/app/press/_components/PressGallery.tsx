"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PressLightbox } from "./PressLightbox";
import type { PressImageDoc } from "./types";

export function PressGallery({ images }: { images: PressImageDoc[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight")
        setLightboxIdx((i) => (i !== null ? (i + 1) % images.length : null));
      if (e.key === "ArrowLeft")
        setLightboxIdx((i) =>
          i !== null ? (i - 1 + images.length) % images.length : null,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, images.length]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIdx(index);
  }, []);

  if (images.length === 0) return null;

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 px-5 md:px-10 pt-16 pb-10">
        {images.map((doc, i) => {
          const dims = doc.image.asset.metadata?.dimensions;
          const aspect = dims ? dims.height / dims.width : 0.75;

          return (
            <button
              key={doc._id}
              data-item-id={doc._id}
              className="mb-3 md:mb-4 w-full break-inside-avoid cursor-pointer group block"
              onClick={() => openLightbox(i)}
            >
              <div className="overflow-hidden">
                <Image
                  src={urlFor(doc.image).width(800).url()}
                  alt={doc.image.alt || doc.title}
                  width={400}
                  height={Math.round(400 * aspect)}
                  className="w-full h-auto block transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  placeholder={doc.image.asset.metadata?.lqip ? "blur" : "empty"}
                  blurDataURL={doc.image.asset.metadata?.lqip}
                  draggable={false}
                />
              </div>
              {doc.title && (
                <span className="block mt-1.5 font-body text-[0.6875rem] tracking-[0.06em] uppercase text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300">
                  {doc.title}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {lightboxIdx !== null && (
        <PressLightbox
          images={images}
          activeIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}
    </>
  );
}
