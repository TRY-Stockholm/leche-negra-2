import fs from "fs";
import path from "path";
import Link from "next/link";
import { PressGallery } from "./PressGallery";

const PRESS_DIR = path.join(process.cwd(), "public", "press");
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function getPressImages() {
  if (!fs.existsSync(PRESS_DIR)) return [];
  return fs
    .readdirSync(PRESS_DIR)
    .filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => ({
      src: `/press/${f}`,
      alt: f.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
    }));
}

export default function PressPage() {
  const images = getPressImages();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-5 md:px-10 py-3 border-b border-border text-xs tracking-[0.08em] uppercase font-medium">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[0.6875rem] tracking-[0.04em]"
        >
          &larr; Back
        </Link>
        <span className="text-foreground font-display italic">Press</span>
      </nav>

      <div className="px-5 md:px-10 py-10">
        {images.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">
            Drop images into <code className="text-accent">public/press/</code>{" "}
            and they will appear here.
          </p>
        ) : (
          <PressGallery images={images} />
        )}
      </div>
    </div>
  );
}
