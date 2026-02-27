/** Play a single heartbeat (two low thuds). Uses Web Audio API — no external assets. */
export function playHeartbeat(): void {
  let ctx: AudioContext;
  try {
    ctx = new AudioContext();
  } catch {
    return; // Audio not available — fail silently
  }

  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.value = 0;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 40; // Sub-bass — felt in the chest, barely audible
  osc.connect(gain);
  osc.start();

  const now = ctx.currentTime;

  // First thud — lub
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  // Second thud — dub (0.4s after first)
  gain.gain.setValueAtTime(0.001, now + 0.4);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.46);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

  // Cleanup
  osc.stop(now + 1);
  setTimeout(() => ctx.close(), 1500);
}
