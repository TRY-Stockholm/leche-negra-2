import { client } from "@/sanity/lib/client";
import { PressCanvas } from "./_components/PressCanvas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Press — Leche Negra",
  description: "Press images and editorial quotes.",
};

const PRESS_IMAGES_QUERY = `*[_type == "pressImage"] | order(order asc, _createdAt asc) {
  _id,
  title,
  image {
    asset->{ _id, url, metadata { lqip, dimensions { width, height } } },
    alt,
    hotspot,
    crop
  }
}`;

const PRESS_QUOTES_QUERY = `*[_type == "pressQuote"] | order(order asc, _createdAt asc) {
  _id,
  text
}`;

export default async function PressPage() {
  const [images, quotes] = await Promise.all([
    client.fetch(PRESS_IMAGES_QUERY),
    client.fetch(PRESS_QUOTES_QUERY),
  ]);

  return <PressCanvas images={images} quotes={quotes} />;
}
