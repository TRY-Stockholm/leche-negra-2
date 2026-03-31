import type { InstrumentConfig } from "./types";

export const STAGE_BPM = 110;
export const STAGE_BARS = 8;
export const LOOP_DURATION = (60 / STAGE_BPM) * 4 * STAGE_BARS; // ~17.45s

export const instruments: InstrumentConfig[] = [
  {
    id: "stem-01",
    name: "Strings",
    audioFile: "https://pub-545dc348d7ee4051b8248b68f02e7685.r2.dev/stage/playful-waltz_stem-01.m4a",
    position: { x: 15, y: 45 },
    color: "#e43122",
  },
  {
    id: "stem-02",
    name: "Drums",
    audioFile: "https://pub-545dc348d7ee4051b8248b68f02e7685.r2.dev/stage/playful-waltz_stem-02.m4a",
    position: { x: 35, y: 50 },
    color: "#d45a4a",
  },
  {
    id: "stem-03",
    name: "Saxophone",
    audioFile: "https://pub-545dc348d7ee4051b8248b68f02e7685.r2.dev/stage/playful-waltz_stem-03.m4a",
    position: { x: 50, y: 48 },
    color: "#b8251c",
  },
  {
    id: "stem-04",
    name: "Violin",
    audioFile: "https://pub-545dc348d7ee4051b8248b68f02e7685.r2.dev/stage/playful-waltz_stem-04.m4a",
    position: { x: 65, y: 50 },
    color: "#e85040",
  },
  {
    id: "stem-05",
    name: "Trumpet",
    audioFile: "https://pub-545dc348d7ee4051b8248b68f02e7685.r2.dev/stage/playful-waltz_stem-05.m4a",
    position: { x: 78, y: 48 },
    color: "#c73828",
  },
  {
    id: "stem-06",
    name: "Bass",
    audioFile: "https://pub-545dc348d7ee4051b8248b68f02e7685.r2.dev/stage/playful-waltz_stem-06.m4a",
    position: { x: 88, y: 50 },
    color: "#e43122",
  },
];

/**
 * Maps SVG group IDs to stem IDs.
 * stem-01 (Strings/Pad) has no musician visual in the SVG.
 */
export const MUSICIAN_LAYERS: Record<string, string[]> = {
  "stem-02": ["Drummer"],
  "stem-03": ["Sax"],
  "stem-04": ["Violinist"],
  "stem-05": ["Trumpet"],
  "stem-06": ["Upright"],
};
