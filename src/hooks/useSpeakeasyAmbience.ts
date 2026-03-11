"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const HUM_FREQ_ACTIVE = 55;
const HUM_FREQ_IDLE = 42;
const FADE_IN_SECONDS = 3;
const PITCH_DRIFT_SECONDS = 4;
const MUTE_RAMP_SECONDS = 0.5;

interface AmbienceNodes {
  ctx: AudioContext;
  hum: OscillatorNode;
  humGain: GainNode;
  noiseSource: AudioBufferSourceNode;
  noiseGain: GainNode;
  master: GainNode;
}

function createBrownNoise(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

export function useSpeakeasyAmbience(enabled: boolean, isIdle: boolean) {
  const nodesRef = useRef<AmbienceNodes | null>(null);
  const startedRef = useRef(false);
  const breatheRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [isMuted, setIsMuted] = useState(false);

  const startAmbience = useCallback(() => {
    if (startedRef.current || !enabled) return;
    startedRef.current = true;

    let ctx: AudioContext;
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_IN_SECONDS);
    master.connect(ctx.destination);

    // Room hum — low sine
    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.setValueAtTime(HUM_FREQ_ACTIVE, ctx.currentTime);
    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.04, ctx.currentTime);
    hum.connect(humGain);
    humGain.connect(master);
    hum.start();

    // Air / presence — brown noise through low-pass
    const noiseBuffer = createBrownNoise(ctx, 10);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, ctx.currentTime);
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noiseSource.start();

    nodesRef.current = { ctx, hum, humGain, noiseSource, noiseGain, master };

    // Hum gain breathing — slow modulation between 0.03 and 0.06
    breatheRef.current = setInterval(() => {
      if (!nodesRef.current) return;
      const t = Date.now() / 1000;
      const mod = 0.045 + 0.015 * Math.sin(t * 0.18 * Math.PI * 2);
      nodesRef.current.humGain.gain.setTargetAtTime(
        mod,
        nodesRef.current.ctx.currentTime,
        0.5
      );
    }, 100);
  }, [enabled]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      const nodes = nodesRef.current;
      if (nodes) {
        nodes.master.gain.cancelScheduledValues(nodes.ctx.currentTime);
        nodes.master.gain.setTargetAtTime(
          next ? 0 : 1,
          nodes.ctx.currentTime,
          MUTE_RAMP_SECONDS / 3
        );
      }
      return next;
    });
  }, []);

  // Idle pitch shift
  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    const targetFreq = isIdle ? HUM_FREQ_IDLE : HUM_FREQ_ACTIVE;
    nodes.hum.frequency.setTargetAtTime(
      targetFreq,
      nodes.ctx.currentTime,
      PITCH_DRIFT_SECONDS / 3
    );
  }, [isIdle]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(breatheRef.current);
      if (nodesRef.current) {
        nodesRef.current.hum.stop();
        nodesRef.current.noiseSource.stop();
        nodesRef.current.ctx.close();
        nodesRef.current = null;
      }
      startedRef.current = false;
    };
  }, []);

  return { startAmbience, toggleMute, isMuted };
}
