import type { Theme, MenuKey } from "@/lib/types";

export const themeLabels: Record<Theme, string> = {
  morning: "Morning",
  lunch: "Midday",
  dinner: "Evening",
  night: "Night",
};

export const menuThemeMap: Record<MenuKey, Theme> = {
  breakfast: "morning",
  lunch: "lunch",
  dinner: "dinner",
  drinks: "night",
};

export const BOOKING_WIDGET_HASH = "ddd34bd1ef6c76ba44556cd74fbb9fd3";

export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export function isLightTheme(theme: Theme | null): boolean {
  return theme === "morning" || theme === "lunch";
}

export function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow";
  return "Storm";
}

export function weatherPoem(code: number, temp: number): string {
  if (code === 0 && temp > 20) return "the sun pours gold on stone";
  if (code === 0 && temp > 5) return "clear skies, a quiet flame";
  if (code === 0) return "cold stars over still water";
  if (code <= 3 && temp > 15) return "clouds drift like slow smoke";
  if (code <= 3) return "grey wool wraps the rooftops";
  if (code <= 48) return "the city breathes in mist";
  if (code <= 57) return "soft rain taps the glass";
  if (code <= 67) return "rain draws lines on windows";
  if (code <= 77) return "snow falls without a sound";
  if (code <= 82) return "showers wash the cobblestones";
  if (code <= 86) return "white silence, nothing stirs";
  return "the sky has things to say";
}
