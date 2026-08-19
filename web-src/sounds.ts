let audioCtx: AudioContext | null = null;

function context(): AudioContext | null {
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

export function unlockAudio(): void {
  context();
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  gainValue: number,
  filterFreq?: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    osc.connect(filter);
    filter.connect(gain);
  } else {
    osc.connect(gain);
  }
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playVaderAlert(): void {
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (let i = 0; i < 6; i += 1) {
    const t = now + i * 0.42;
    tone(ctx, 70, t, 0.34, 'sawtooth', 0.22, 180);
    tone(ctx, 46, t, 0.34, 'sine', 0.18);
    tone(ctx, 110, t + 0.08, 0.18, 'square', 0.06, 320);
  }
  tone(ctx, 185, now + 2.5, 0.7, 'sawtooth', 0.12, 400);
}

export function playCountdownDing(): void {
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 880, now, 0.12, 'sine', 0.16);
  tone(ctx, 1320, now, 0.1, 'triangle', 0.08);
}
