import type { AsteroidSize } from "./types";

export const AUDIO_MUTE_STORAGE_KEY = "openastroids-muted";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Parses stored mute preference; defaults to unmuted when missing or invalid. */
export function parseMutedPreference(raw: string | null): boolean {
  if (raw === null) return false;
  return raw === "1" || raw === "true";
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

/** Reads persisted mute preference (false = sound enabled). */
export function readMutedPreference(storage?: StorageLike): boolean {
  const store = getStorage(storage);
  if (!store) return false;
  try {
    return parseMutedPreference(store.getItem(AUDIO_MUTE_STORAGE_KEY));
  } catch {
    return false;
  }
}

/** Persists mute preference to local storage. */
export function writeMutedPreference(muted: boolean, storage?: StorageLike): void {
  const store = getStorage(storage);
  if (!store) return;
  try {
    store.setItem(AUDIO_MUTE_STORAGE_KEY, muted ? "1" : "0");
  } catch {
    // Private mode, quota exceeded, or storage disabled
  }
}

export type GameAudio = {
  resume: () => Promise<void>;
  dispose: () => void;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
  playFire: () => void;
  playExplosion: (size: AsteroidSize) => void;
  playShipDeath: () => void;
  playGameOver: () => void;
  playExtraLife: () => void;
  setThrustActive: (active: boolean) => void;
};

type ToneOpts = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  decay?: number;
};

/** Synthesized retro arcade sounds via Web Audio API (no asset files). */
export function createGameAudio(initialMuted = false): GameAudio | null {
  if (typeof window === "undefined") return null;

  let ctx: AudioContext | null = null;
  let muted = initialMuted;
  let thrustOsc: OscillatorNode | null = null;
  let thrustNoise: AudioBufferSourceNode | null = null;
  let thrustGain: GainNode | null = null;
  let thrustActive = false;

  const ensureContext = (): AudioContext | null => {
    if (muted) return null;
    if (!ctx) {
      const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    }
    return ctx;
  };

  const playTone = (audioCtx: AudioContext, opts: ToneOpts) => {
    const { freq, duration, type = "square", gain = 0.06, attack = 0.005, decay = 0.04 } = opts;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration);
  };

  const playNoiseBurst = (audioCtx: AudioContext, duration: number, gain: number, filterFreq: number) => {
    const sampleRate = audioCtx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const g = audioCtx.createGain();
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.connect(filter);
    filter.connect(g);
    g.connect(audioCtx.destination);
    source.start(t);
    source.stop(t + duration + 0.02);
  };

  const stopThrust = () => {
    thrustActive = false;
    const t = ctx?.currentTime ?? 0;
    if (thrustGain) {
      thrustGain.gain.cancelScheduledValues(t);
      thrustGain.gain.setValueAtTime(thrustGain.gain.value, t);
      thrustGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    }
    const osc = thrustOsc;
    const noise = thrustNoise;
    thrustOsc = null;
    thrustNoise = null;
    thrustGain = null;
    window.setTimeout(() => {
      try {
        osc?.stop();
      } catch {
        /* already stopped */
      }
      try {
        noise?.stop();
      } catch {
        /* already stopped */
      }
      osc?.disconnect();
      noise?.disconnect();
    }, 50);
  };

  const startThrust = (audioCtx: AudioContext) => {
    if (thrustOsc || thrustNoise) return;
    thrustActive = true;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 72;
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.04);
    osc.connect(g);
    noise.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t);
    noise.start(t);
    thrustOsc = osc;
    thrustNoise = noise;
    thrustGain = g;
  };

  return {
    resume: async () => {
      const audioCtx = ensureContext();
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
    },

    dispose: () => {
      stopThrust();
      void ctx?.close();
      ctx = null;
    },

    setMuted: (nextMuted: boolean) => {
      muted = nextMuted;
      if (muted) stopThrust();
    },

    isMuted: () => muted,

    playFire: () => {
      const audioCtx = ensureContext();
      if (!audioCtx || audioCtx.state !== "running") return;
      playTone(audioCtx, { freq: 920, duration: 0.06, gain: 0.05, decay: 0.03 });
    },

    playExplosion: (size: AsteroidSize) => {
      const audioCtx = ensureContext();
      if (!audioCtx || audioCtx.state !== "running") return;
      const bySize: Record<AsteroidSize, { duration: number; gain: number; filter: number }> = {
        3: { duration: 0.22, gain: 0.09, filter: 180 },
        2: { duration: 0.16, gain: 0.07, filter: 260 },
        1: { duration: 0.1, gain: 0.055, filter: 420 },
      };
      const { duration, gain, filter } = bySize[size];
      playNoiseBurst(audioCtx, duration, gain, filter);
    },

    playShipDeath: () => {
      const audioCtx = ensureContext();
      if (!audioCtx || audioCtx.state !== "running") return;
      playNoiseBurst(audioCtx, 0.35, 0.08, 320);
      playTone(audioCtx, { freq: 180, duration: 0.25, type: "sawtooth", gain: 0.05, decay: 0.18 });
    },

    playGameOver: () => {
      const audioCtx = ensureContext();
      if (!audioCtx || audioCtx.state !== "running") return;
      playTone(audioCtx, { freq: 220, duration: 0.35, type: "triangle", gain: 0.07, decay: 0.28 });
      window.setTimeout(() => {
        if (muted || !ctx || ctx.state !== "running") return;
        playTone(ctx, { freq: 110, duration: 0.45, type: "triangle", gain: 0.06, decay: 0.35 });
      }, 180);
    },

    playExtraLife: () => {
      const audioCtx = ensureContext();
      if (!audioCtx || audioCtx.state !== "running") return;
      playTone(audioCtx, { freq: 523, duration: 0.08, gain: 0.05, decay: 0.05 });
      window.setTimeout(() => {
        if (muted || !ctx || ctx.state !== "running") return;
        playTone(ctx, { freq: 659, duration: 0.08, gain: 0.05, decay: 0.05 });
      }, 70);
      window.setTimeout(() => {
        if (muted || !ctx || ctx.state !== "running") return;
        playTone(ctx, { freq: 784, duration: 0.12, gain: 0.055, decay: 0.08 });
      }, 140);
    },

    setThrustActive: (active: boolean) => {
      if (muted) {
        stopThrust();
        return;
      }
      const audioCtx = ensureContext();
      if (!audioCtx || audioCtx.state !== "running") {
        stopThrust();
        return;
      }
      if (active && !thrustActive) {
        startThrust(audioCtx);
      } else if (!active && thrustActive) {
        stopThrust();
      }
    },
  };
}
