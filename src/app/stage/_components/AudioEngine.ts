import type { InstrumentConfig } from "./types";

type ToneModule = typeof import("tone");

export class StageAudioEngine {
  private Tone: ToneModule | null = null;
  private players: Map<string, InstanceType<ToneModule["Player"]>> = new Map();
  private gains: Map<string, InstanceType<ToneModule["Gain"]>> = new Map();
  private masterGain: InstanceType<ToneModule["Gain"]> | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array<ArrayBuffer> | null = null;
  private isInitialized = false;
  private _isUnlocked = false;
  get isUnlocked(): boolean {
    return this._isUnlocked;
  }

  async init(instruments: InstrumentConfig[]): Promise<void> {
    if (this.isInitialized) return;

    const Tone = await import("tone");
    this.Tone = Tone;

    this.masterGain = new Tone.Gain(0.8).toDestination();

    const ctx = Tone.getContext().rawContext;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    this.masterGain.connect(this.analyser as unknown as AudioNode);

    instruments.forEach((inst) => {
      const gain = new Tone.Gain(0).connect(this.masterGain!);
      const player = new Tone.Player({
        url: inst.audioFile,
        loop: true,
        fadeIn: 0.2,
        fadeOut: 0.2,
      }).connect(gain);

      this.players.set(inst.id, player);
      this.gains.set(inst.id, gain);
    });

    // Wait for audio buffers, but don't block forever — players
    // continue loading in the background and play when ready
    await Promise.race([
      Tone.loaded(),
      new Promise<void>((resolve) => setTimeout(resolve, 15000)),
    ]);

    this.isInitialized = true;
  }

  async unlock(): Promise<void> {
    if (!this.Tone) return;
    await this.Tone.start();
    this._isUnlocked = true;

    this.players.forEach((player) => {
      if (player.loaded) player.start();
    });
  }

  toggle(instrumentId: string): boolean {
    if (!this.Tone || !this._isUnlocked) return false;

    const gain = this.gains.get(instrumentId);
    if (!gain) return false;

    const isActive = gain.gain.value > 0.5;
    const now = this.Tone.now();

    if (isActive) {
      gain.gain.rampTo(0, 0.2, now);
      return false;
    } else {
      gain.gain.rampTo(1, 0.2, now);
      return true;
    }
  }

  isActive(instrumentId: string): boolean {
    const gain = this.gains.get(instrumentId);
    if (!gain) return false;
    return gain.gain.value > 0.5;
  }

  getLevel(): number {
    if (!this.analyser || !this.analyserData) return 0;
    this.analyser.getByteTimeDomainData(this.analyserData);
    let sum = 0;
    for (let i = 0; i < this.analyserData.length; i++) {
      const v = (this.analyserData[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.analyserData.length) * 3.5);
  }

  setVolume(value: number): void {
    if (!this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.masterGain.gain.rampTo(clamped, 0.1);
  }

  muteAll(): void {
    if (!this.Tone) return;
    const now = this.Tone.now();
    this.gains.forEach((gain) => {
      gain.gain.rampTo(0, 0.2, now);
    });
  }

  dispose(): void {
    this.players.forEach((player) => {
      player.stop();
      player.dispose();
    });
    this.gains.forEach((gain) => gain.dispose());
    this.masterGain?.dispose();
    this.analyser?.disconnect();
    this.players.clear();
    this.gains.clear();
    this.masterGain = null;
    this.analyser = null;
    this.analyserData = null;
    this.Tone = null;
    this.isInitialized = false;
    this._isUnlocked = false;
  }
}
