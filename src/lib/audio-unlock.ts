/**
 * Shared Web Audio unlock for iOS.
 *
 * iOS Safari/Chrome impose three constraints that quietly break Web Audio:
 *   1. An AudioContext only starts after a real user gesture, and the unlock is
 *      per-document.
 *   2. The physical mute/ringer switch silences Web Audio unless the page has
 *      entered the "playback" audio session (via a playing media element or the
 *      navigator.audioSession API).
 *   3. The context is suspended when the tab backgrounds or after interruptions
 *      (e.g. a phone call), and nothing resumes it automatically.
 *
 * This module gives the whole app ONE shared AudioContext (cached on `window`,
 * so it survives Next.js soft-navigation between routes), unlocks it on the
 * first user gesture anywhere, keeps it alive across interruptions, and — when
 * enabled — overrides the mute switch so sound always plays.
 *
 * All three of the app's Web Audio paths route through this context:
 * the speakeasy ambience, the bell, and the stage orchestra (Tone.js).
 */

/** Flip to `false` to respect the device's physical silent switch. */
export const AUDIO_OVERRIDE_SILENT_SWITCH = true;

type WindowWithAudio = Window & {
  __lnAudioCtx?: AudioContext | null;
  webkitAudioContext?: typeof AudioContext;
};

const unlockCallbacks = new Set<() => void>();
let installed = false;
let silentEl: HTMLAudioElement | null = null;
let silentUrl: string | null = null;
let overrideStarted = false;

/** Lazily create (and cache on `window`) the single shared AudioContext. */
export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithAudio;
  if (w.__lnAudioCtx) return w.__lnAudioCtx;
  const Ctor = window.AudioContext || w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    w.__lnAudioCtx = new Ctor();
  } catch {
    w.__lnAudioCtx = null;
  }
  return w.__lnAudioCtx ?? null;
}

/** True once the shared context is actually producing sound. */
export function isAudioRunning(): boolean {
  return getSharedAudioContext()?.state === "running";
}

/**
 * Register a callback to run when audio unlocks (transitions to `running`).
 * Returns an unregister function. Callbacks fire from `resumeShared()` only —
 * i.e. from within a real gesture — so they never run while still suspended.
 */
export function onUnlock(cb: () => void): () => void {
  unlockCallbacks.add(cb);
  return () => unlockCallbacks.delete(cb);
}

function fireUnlockCallbacks(): void {
  // Snapshot first: a callback may unregister itself mid-iteration.
  [...unlockCallbacks].forEach((cb) => {
    try {
      cb();
    } catch {
      /* a misbehaving listener must not block the rest */
    }
  });
}

/**
 * Resume the shared context and (if enabled) defeat the mute switch.
 * MUST be called synchronously inside a user gesture for the resume to take on
 * iOS — `resume()` is initiated before any `await`. Safe to call repeatedly.
 */
export function resumeShared(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  if (AUDIO_OVERRIDE_SILENT_SWITCH) enableMuteSwitchOverride();

  const kick = () => {
    // Classic iOS unlock: play a one-sample silent buffer through the context.
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      /* noop */
    }
    fireUnlockCallbacks();
  };

  if (ctx.state === "running") {
    kick();
    return;
  }

  // resume() must be *initiated* in the gesture; it resolves asynchronously.
  ctx
    .resume()
    .then(() => {
      if (ctx.state === "running") kick();
    })
    .catch(() => {
      /* not unlocked yet — a later gesture will retry */
    });
}

const GESTURE_EVENTS = [
  "pointerdown",
  "touchend",
  "mousedown",
  "keydown",
  "click",
] as const;

/**
 * Install the global unlock. Idempotent — safe to call on every mount.
 * Resumes the shared context on the first user gesture (any route, since
 * soft-navigation keeps the same window) and again whenever the tab returns
 * to the foreground. Returns a cleanup function.
 */
export function installAudioUnlock(): () => void {
  if (typeof window === "undefined") return () => {};
  if (installed) return () => {};
  installed = true;

  const removeGestureListeners = () => {
    GESTURE_EVENTS.forEach((evt) =>
      window.removeEventListener(evt, onGesture, true),
    );
  };

  const onGesture = () => {
    resumeShared();
    // resume() is async; detach only once we've confirmed sound is flowing,
    // otherwise keep listening so a later gesture can retry.
    if (isAudioRunning()) {
      removeGestureListeners();
    } else {
      setTimeout(() => {
        if (isAudioRunning()) removeGestureListeners();
      }, 0);
    }
  };

  GESTURE_EVENTS.forEach((evt) =>
    window.addEventListener(evt, onGesture, { capture: true, passive: true }),
  );

  const onVisibility = () => {
    if (document.visibilityState !== "visible") return;
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
    // The silent media element gets paused on background — restart it.
    silentEl?.play?.().catch(() => {});
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    removeGestureListeners();
    document.removeEventListener("visibilitychange", onVisibility);
    installed = false;
  };
}

/**
 * Make Web Audio ignore the iOS physical mute switch.
 * Primary: the iOS 16.4+ `navigator.audioSession` API. Fallback (older iOS): a
 * silent, looping media element, which puts the page on the media channel (not
 * governed by the silent switch) so Web Audio rides along. Idempotent.
 */
export function enableMuteSwitchOverride(): void {
  if (typeof window === "undefined") return;

  // Primary — iOS 16.4+ audio session API.
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* noop */
  }

  // Fallback — keep a silent looping element on the media channel.
  if (overrideStarted) {
    silentEl?.play?.().catch(() => {});
    return;
  }
  overrideStarted = true;
  try {
    if (!silentUrl) silentUrl = buildSilentWavUrl();
    silentEl = new Audio(silentUrl);
    silentEl.loop = true;
    silentEl.setAttribute("playsinline", "");
    silentEl.play().catch(() => {
      // Couldn't start (not in a gesture / unsupported) — allow a retry.
      overrideStarted = false;
    });
  } catch {
    overrideStarted = false;
  }
}

/** Build a half-second of 8-bit mono PCM silence as a WAV object URL. */
function buildSilentWavUrl(): string {
  const sampleRate = 8000;
  const dataSize = sampleRate / 2; // 0.5s, 1 byte/sample
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byteRate (blockAlign = 1)
  view.setUint16(32, 1, true); // blockAlign
  view.setUint16(34, 8, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < dataSize; i++) view.setUint8(44 + i, 128); // 8-bit silence
  return URL.createObjectURL(new Blob([view], { type: "audio/wav" }));
}
