// Optional deck sounds, synthesized with Web Audio: no audio files are loaded.
// Off by default; the faceplate's SOUND switch turns them on and the choice is
// kept per browser. Sounds only ever follow a click or key press, never autoplay.

const KEY = "sfx";
let context: AudioContext | undefined;

export function sfxEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setSfxEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the switch lasts for this page only.
  }
}

function audio(): AudioContext | undefined {
  if (typeof window === "undefined" || typeof window.AudioContext !== "function") return undefined;
  context ??= new window.AudioContext();
  return context;
}

function noise(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

/** A short decaying envelope on a gain node. */
function envelope(ctx: AudioContext, peak: number, seconds: number) {
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  gain.connect(ctx.destination);
  return gain;
}

function thump(ctx: AudioContext, hz: number, peak: number, seconds: number) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(hz, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(hz / 2, ctx.currentTime + seconds);
  osc.connect(envelope(ctx, peak, seconds));
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}

function burst(
  ctx: AudioContext,
  type: BiquadFilterType,
  hz: number,
  peak: number,
  seconds: number,
) {
  const source = noise(ctx, seconds);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = hz;
  source.connect(filter);
  filter.connect(envelope(ctx, peak, seconds));
  source.start();
}

export type Sound = "key" | "door" | "hiss";

export function play(sound: Sound) {
  if (!sfxEnabled()) return;
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  if (sound === "key") {
    burst(ctx, "bandpass", 2400, 0.25, 0.03);
    thump(ctx, 140, 0.35, 0.07);
  } else if (sound === "door") {
    burst(ctx, "lowpass", 900, 0.4, 0.12);
    thump(ctx, 90, 0.5, 0.16);
  } else {
    burst(ctx, "highpass", 4000, 0.05, 0.7);
  }
}
