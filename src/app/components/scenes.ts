export type Presentation = "framed" | "vignette" | "dissolve";

export interface SceneConfig {
  id: string;
  cursorSvg: string;
  cursorWidth: number;
  cursorHeight: number;
  cursorDisplayHeight: number;
  cursorOffsetX: number;
  cursorOffsetY: number;
  cursorClassName: string;
  still: string;
  video: string;
  preloaderText: string;
  background: string;
  presentation: Presentation;
}

export const SCENES: SceneConfig[] = [
  {
    id: "floral-combustion",
    cursorSvg: "/zippolighter.svg",
    cursorWidth: 480.35,
    cursorHeight: 615.47,
    cursorDisplayHeight: 160,
    cursorOffsetX: 0.5,
    cursorOffsetY: 0.04,
    cursorClassName: "zippo-lighter",
    still: "/video/floral-combustion-frame1.jpg",
    video: "/video/floral-combustion.mp4",
    preloaderText: "Be mischievous",
    background: "#460b08",
    presentation: "framed",
  },
  // {
  //   id: "moth-and-flame",
  //   cursorSvg: "/cursors/candle.svg",
  //   cursorWidth: 200,
  //   cursorHeight: 400,
  //   cursorDisplayHeight: 160,
  //   cursorOffsetX: 0.5,
  //   cursorOffsetY: 0.04,
  //   cursorClassName: "candle-cursor",
  //   still: "/video/moth-and-flame-frame1.jpg",
  //   video: "/video/moth-and-flame.mp4",
  //   preloaderText: "Be still",
  //   background: "#0a0806",
  //   presentation: "vignette",
  // },
  // {
  //   id: "smoke-portrait",
  //   cursorSvg: "/cursors/incense.svg",
  //   cursorWidth: 100,
  //   cursorHeight: 500,
  //   cursorDisplayHeight: 160,
  //   cursorOffsetX: 0.5,
  //   cursorOffsetY: 0.04,
  //   cursorClassName: "incense-cursor",
  //   still: "/video/smoke-portrait-frame1.jpg",
  //   video: "/video/smoke-portrait.mp4",
  //   preloaderText: "Be patient",
  //   background: "#121518",
  //   presentation: "dissolve",
  // },
];

export function pickScene(lastId?: string): SceneConfig {
  const candidates =
    SCENES.length > 1 ? SCENES.filter((s) => s.id !== lastId) : SCENES;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
