export interface SanityImage {
  asset: {
    _id: string;
    url: string;
    metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
  };
  alt?: string;
  hotspot?: { x: number; y: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

export interface PressImageDoc {
  _id: string;
  title: string;
  image: SanityImage;
}

export interface PressQuoteDoc {
  _id: string;
  text: string;
}
