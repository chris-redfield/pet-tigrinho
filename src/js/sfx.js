import { getSettings } from './settings.js';

/**
 * Sound effects, on the Web Audio API so short sounds start instantly and
 * can overlap. Off with Efeitos sonoros, at the Volume geral level.
 *
 * Kept few on purpose (README, design rules): a soft tick on buttons, a
 * soft scratch when the pet is petted, one short tone when XP lands in the
 * bar, a soft two-note chime when an activity is logged or a trilha day is
 * finished, a short warm tune when the pet evolves - the one big moment,
 * earned over weeks, never on a tap - and the egg pick's little foley
 * (eggs landing, the chosen one cracking, the hatch). No coin sound, no jingle,
 * nothing that plays on a loop or rewards a tap with a payout noise. The
 * XP tone comes from "SoundPack01".
 */

const SOUNDS = {
  gain: 'assets/audio/sfx/gain.wav',   // XP lands in the bar
};

/** How loud each one sits under the master volume. */
const LEVEL = { gain: 0.5, tick: 0.12, pat: 0.35, done: 0.16, evolve: 0.13, egg: 0.3 };

let ctx = null;
const buffers = {};
const lastPlayed = {};

function volume(name) {
  const { sfx, volume: v } = getSettings();
  return sfx ? (v / 100) * (LEVEL[name] ?? 0.5) : 0;
}

/** Creates the audio context on the first touch (browsers require one) and loads the sounds. */
function unlock() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  for (const [name, src] of Object.entries(SOUNDS)) {
    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => { buffers[name] = buffer; })
      .catch(() => { /* missing or undecodable: that sound stays silent */ });
  }
}

/**
 * Plays one of the SOUNDS. `minGap` skips it if it played less than that
 * many ms ago.
 */
export function play(name, { minGap = 0 } = {}) {
  const gain = volume(name);
  if (!ctx || !buffers[name] || gain <= 0 || document.hidden) return;
  const now = performance.now();
  if (now - (lastPlayed[name] ?? -Infinity) < minGap) return;
  lastPlayed[name] = now;
  if (ctx.state === 'suspended') ctx.resume();

  const source = ctx.createBufferSource();
  const out = ctx.createGain();
  source.buffer = buffers[name];
  out.gain.value = gain;
  source.connect(out).connect(ctx.destination);
  source.start();
}

/** A soft, short tick for buttons, made on the fly (no file). */
export function tick() {
  const gain = volume('tick');
  if (!ctx || gain <= 0) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const out = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1100, t);
  osc.frequency.exponentialRampToValueAtTime(700, t + 0.05);
  out.gain.setValueAtTime(gain, t);
  out.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  osc.connect(out).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.08);
}

let noise = null;   // one second of white noise, shared by every pat

/**
 * Petting: a soft scratch, like fingers rubbing fur. Made on the fly from
 * noise kept in the low-mid range (no sharp hiss), with a slow swell in and
 * out (no hit at the start) and a gentle flutter that reads as fingers
 * moving. Each tap starts a fresh one that overlaps the last, so fast taps
 * blend into a continuous scritch. A little random pitch and speed keep
 * repeats from sounding canned.
 */
export function pat() {
  const gain = volume('pat');
  if (!ctx || gain <= 0 || document.hidden) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  const len = 0.32 + Math.random() * 0.08;

  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = noise;

  // Only the soft middle of the noise: no rumble, no hiss.
  const high = ctx.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.value = 500;
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.Q.value = 0.5;
  const f = 1500 + Math.random() * 500;
  low.frequency.setValueAtTime(f, t);
  low.frequency.linearRampToValueAtTime(f * 0.7, t + len);

  // Swell in and out, so it strokes rather than hits.
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + len * 0.35);
  env.gain.linearRampToValueAtTime(0, t + len);

  // The scratch: the level flutters a little, like fingers moving.
  const flutter = ctx.createGain();
  flutter.gain.value = 0.7;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 14 + Math.random() * 8;
  const depth = ctx.createGain();
  depth.gain.value = 0.3;
  lfo.connect(depth).connect(flutter.gain);

  src.connect(high).connect(low).connect(flutter).connect(env).connect(ctx.destination);
  src.start(t, Math.random() * 0.6, len);
  lfo.start(t);
  lfo.stop(t + len);
}

/**
 * Something done (an activity logged, a trilha day finished): two soft bell-like
 * notes a major third apart, the second one rising. Pure sines with a
 * quiet octave overtone and a gentle ring-out - warm, short, never loud.
 */
export function done() {
  const gain = volume('done');
  if (!ctx || gain <= 0 || document.hidden) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  [[784, 0], [988, 0.11]].forEach(([freq, at]) => {   // G5, then B5
    for (const [mult, level] of [[1, 1], [2, 0.18]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t + at);
      env.gain.linearRampToValueAtTime(gain * level, t + at + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.7);
      osc.connect(env).connect(ctx.destination);
      osc.start(t + at);
      osc.stop(t + at + 0.72);
    }
  });
}

/** One soft bell-like note: a sine with a quiet octave, swelling in and ringing out. */
function bell(freq, at, length, level) {
  const t = ctx.currentTime + at;
  for (const [mult, share, type] of [[1, 1, 'sine'], [2, 0.12, 'sine'], [1, 0.25, 'triangle']]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq * mult;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level * share, t + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(env).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }
}

/**
 * The pet evolved: a short, warm tune of about two seconds. Five notes
 * climb a major chord (C E G C E), then the chord rings out together,
 * softly. Gentle on purpose - a milestone, not a jackpot: no coins, no
 * bright brass, nothing that repeats.
 */
export function evolveTune() {
  const level = volume('evolve');
  if (!ctx || level <= 0 || document.hidden) return;
  if (ctx.state === 'suspended') ctx.resume();
  const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5;
  [C5, E5, G5, C6, E6].forEach((f, i) => bell(f, i * 0.13, 0.9, level));
  // The chord, held under the last note and fading out.
  for (const f of [C5, G5, C6, E6]) bell(f, 0.7, 1.8, level * 0.7);
}

// ---------- the egg pick ----------

/** Shared white noise (made on first use). */
function noiseBuffer() {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/**
 * The egg sounds only play on a running context (or one being started by
 * this very tap), never queued up to burst out later. On the very first
 * visit the eggs drop before any touch, so that first drop is silent:
 * browsers allow no sound before the player has touched the page.
 */
function eggLevel() {
  const level = volume('egg');
  if (!ctx || level <= 0 || document.hidden) return 0;
  if (ctx.state === 'running') return level;
  if (navigator.userActivation?.isActive) { ctx.resume(); return level; }
  return 0;
}

/** A short burst of filtered noise: a crack, a click, a crunch. */
function crack(at, level, { freq = 2500, q = 1.2, length = 0.05 } = {}) {
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = freq;
  band.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(level, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(band).connect(env).connect(ctx.destination);
  src.start(t, Math.random() * 0.8, length + 0.02);
}

/** A hollow wooden "tok", like a marimba bar: a sine and a quiet upper partial. */
function tok(freq, at, level, length = 0.22) {
  const t = ctx.currentTime + at;
  for (const [mult, share] of [[1, 1], [3.9, 0.18]]) {
    const osc = ctx.createOscillator();
    osc.frequency.value = freq * mult;
    const env = ctx.createGain();
    env.gain.setValueAtTime(level * share, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + length / mult ** 0.3);
    osc.connect(env).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }
}

/**
 * Egg sounds. The four eggs land like four marimba bars - one note each
 * (C, E, G, high C), so the drop plays a little rising chord, and every
 * bounce rings its egg's note again, softer. The chosen egg rattles and
 * cracks faster and faster, then hatches: a crunch of shell, a soft "pop"
 * that rises, and a few sparkles.
 */
export const eggSfx = {
  /** Egg `i` touches down; `strength` is the bounce (1 the fall, smaller after). */
  land(i, strength) {
    const level = eggLevel();
    if (!level) return;
    const note = [523.25, 659.25, 783.99, 1046.5][i % 4];
    tok(note, 0, level * strength * 0.9);
    crack(0, level * strength * 0.35, { freq: 1200, q: 0.8, length: 0.03 });
  },

  /** The egg is chosen: it wobbles and its shell starts cracking. */
  shake() {
    const level = eggLevel();
    if (!level) return;
    // Wobble: two quick wooden knocks, like the egg rocking on the table.
    tok(330, 0, level * 0.5, 0.12);
    tok(294, 0.09, level * 0.4, 0.12);
    // Cracks, closer and louder as the hatch nears (it pops at 0.85 s).
    [0.25, 0.42, 0.55, 0.65, 0.72, 0.78, 0.82].forEach((at, k) =>
      crack(at, level * (0.25 + k * 0.08), { freq: 2600 + Math.random() * 1600, q: 2, length: 0.035 }));
  },

  /** The shell bursts and the pet pops out. */
  hatch() {
    const level = eggLevel();
    if (!level) return;
    const t = ctx.currentTime;
    // The crunch: a wide burst of shell.
    crack(0, level * 1.1, { freq: 1800, q: 0.6, length: 0.18 });
    crack(0.02, level * 0.7, { freq: 4200, q: 1, length: 0.12 });
    // The pop: a round, rising "bloop".
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.16);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level * 0.9, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(env).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
    // Sparkles: a quick run of high bells up a pentatonic scale.
    [1318.5, 1568, 1760, 2093, 2637].forEach((f, k) => tok(f, 0.18 + k * 0.07, level * 0.22, 0.5));
  },
};

/** Unlocks audio on the first touch and ticks on every button press (not the pet). */
export function initSfx() {
  document.addEventListener('pointerdown', (e) => {
    unlock();
    const target = e.target.closest('button, a.btn, [role="button"], [role="tab"], [role="switch"]');
    if (!target || target.closest('.pet-stage') || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
    tick();
  }, { capture: true });
  document.addEventListener('keydown', unlock, { once: true });
}
