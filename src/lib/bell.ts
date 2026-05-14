/**
 * Play a classic two-note doorbell — DING (high) then DONG (lower).
 *
 * Each strike is built with additive synthesis: a strike tone plus a stack
 * of inharmonic partials (the signature of struck metal). The two strikes
 * are tuned a major third apart (E5 → C5), matching the everyday
 * Avon/Westminster house chime.
 */
export function playBell(): void {
  let ctx: AudioContext;
  try {
    ctx = new AudioContext();
  } catch {
    return;
  }

  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  // Gentle low-pass — sands off digital harshness without dulling the chime.
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 6500;
  filter.Q.value = 0.6;
  filter.connect(master);

  const start = ctx.currentTime;

  // Strike the "ding" immediately, the "dong" half a second later.
  strikeChime(ctx, filter, start, 659.25);        // E5 — DING
  strikeChime(ctx, filter, start + 0.55, 523.25); // C5 — DONG

  setTimeout(() => {
    try {
      ctx.close();
    } catch {
      /* noop */
    }
  }, 5000);
}

function strikeChime(
  ctx: AudioContext,
  out: AudioNode,
  when: number,
  fundamental: number,
): void {
  // [ratio relative to fundamental, peak amplitude, decay time in seconds]
  const partials: Array<[number, number, number]> = [
    [0.5, 0.18, 3.0],   // sub-octave hum
    [1.0, 0.45, 2.6],   // strike tone
    [1.21, 0.16, 1.6],  // inharmonic — the brassy character
    [1.5, 0.18, 1.4],   // bell-fifth
    [2.0, 0.2, 1.0],    // nominal octave
    [2.97, 0.1, 0.5],   // upper twang
    [4.05, 0.06, 0.25], // sparkle
  ];

  partials.forEach(([ratio, amp, decay]) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = fundamental * ratio;

    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(g);
    g.connect(out);

    // 4ms strike attack, then exponential decay.
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);

    osc.start(when);
    osc.stop(when + decay + 0.1);
  });
}
