import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { PressGallery } from "./PressGallery";

const PRESS_QUERY = `*[_type == "pressImage"] | order(order asc, _createdAt asc) {
  _id,
  title,
  image {
    asset->{ _id, url, metadata { lqip, dimensions { width, height } } },
    alt,
    hotspot,
    crop
  }
}`;

export default async function PressPage() {
  const images = await client.fetch(PRESS_QUERY);

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
            No press images yet. Add them in the{" "}
            <Link href="/studio" className="text-accent underline">
              Studio
            </Link>
            .
          </p>
        ) : (
          <PressGallery images={images} />
        )}
      </div>
    </div>
  );
}
