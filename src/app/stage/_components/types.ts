export interface InstrumentConfig {
  id: string;
  name: string;
  audioFile: string;
  /** Position as percentage (0-100) within the SVG scene */
  position: { x: number; y: number };
  /** Hex color for glow/UI elements */
  color: string;
}
