"use client";

import { useEffect } from "react";
import { installAudioUnlock } from "@/lib/audio-unlock";

/**
 * Installs the global iOS audio unlock once for the whole app. Renders nothing.
 * Mounted in the root layout so it covers every route — including deep-links
 * straight to /speakeasy or /stage — with a single set of gesture listeners.
 */
export function AudioUnlockMount() {
  useEffect(() => installAudioUnlock(), []);
  return null;
}
