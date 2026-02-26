"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface PressImage {
  src: string;
  alt: string;
}

export function PressGallery({ images }: { images: PressImage[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selected === null) return;
      if (e.key === "Escape") setSelected(null);
      if (e.key === "ArrowRight")
        setSelected((s) => (s !== null ? (s + 1) % images.length : null));
      if (e.key === "ArrowLeft")
        setSelected((s) =>
          s !== null ? (s - 1 + images.length) % images.length : null
        );
    },
    [selected, images.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {images.map((img, i) => (
          <button
            key={img.src}
            onClick={() => setSelected(i)}
            className="block w-full break-inside-avoid overflow-hidden border border-border hover:border-accent transition-colors duration-300 cursor-pointer normal-case tracking-normal text-left"
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={800}
              height={600}
              className="w-full h-auto block"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {selected !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm cursor-pointer"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-6 text-muted-foreground hover:text-foreground text-2xl normal-case tracking-normal"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(null);
            }}
          >
            &times;
          </button>
          <Image
            src={images[selected].src}
            alt={images[selected].alt}
            width={1600}
            height={1200}
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain"
            sizes="90vw"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
