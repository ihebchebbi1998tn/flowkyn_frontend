/**
 * Shared Web Audio API utilities for game sound effects.
 * No external audio files needed — generates tones programmatically.
 * Includes haptic feedback for mobile devices.
 */

// ─── Haptic Feedback ─────────────────────────────────────────────────────────

/** Trigger haptic feedback if available (mobile devices) */
export function triggerHaptic(pattern: 'light' | 'medium' | 'heavy' | 'success' | 'winner') {
  try {
    if (!navigator.vibrate) return;
    switch (pattern) {
      case 'light': navigator.vibrate(15); break;
      case 'medium': navigator.vibrate(40); break;
      case 'heavy': navigator.vibrate(80); break;
      case 'success': navigator.vibrate([30, 50, 60]); break;
      case 'winner': navigator.vibrate([50, 40, 80, 40, 120, 60, 200]); break;
    }
  } catch { /* no vibration support */ }
}

// ─── Screen Shake ────────────────────────────────────────────────────────────

/** Apply a CSS-based screen shake to a target element */
export function triggerScreenShake(el: HTMLElement | null, intensity: 'light' | 'heavy' = 'heavy') {
  if (!el) return;
  const cls = intensity === 'heavy' ? 'screen-shake-heavy' : 'screen-shake-light';
  el.classList.add(cls);
  const dur = intensity === 'heavy' ? 600 : 300;
  setTimeout(() => el.classList.remove(cls), dur);
}

// ─── Core Audio ──────────────────────────────────────────────────────────────

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

export function playSound(freq: number, dur: number, vol = 0.2, type: OscillatorType = 'sine') {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch { /* graceful fallback */ }
}

export function playCountBeep() {
  playSound(600, 0.15, 0.25);
  triggerHaptic('light');
}

export function playGoBeep() {
  try {
    const ctx = getCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    osc2.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch { /* graceful fallback */ }
  triggerHaptic('medium');
}

// ─── Join Chime (light, friendly) ─────────────────────────────────────────────

export function playJoinChime() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const notes = [
      { freq: 740, time: 0.00, dur: 0.10, vol: 0.16 },
      { freq: 988, time: 0.08, dur: 0.12, vol: 0.14 },
      { freq: 1319, time: 0.16, dur: 0.16, vol: 0.12 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, t + n.time);
      gain.gain.setValueAtTime(n.vol, t + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + n.dur);
      osc.start(t + n.time);
      osc.stop(t + n.time + n.dur);
    }
  } catch { /* graceful fallback */ }
  triggerHaptic('success');
}

// ─── Reveal Sounds (Enhanced) ────────────────────────────────────────────────

export function playRevealSound(rank: number) {
  if (rank === 1) {
    playWinnerFanfare();
    triggerHaptic('winner');
  } else if (rank <= 3) {
    playSound(440 + (3 - rank) * 80, 0.3, 0.2, 'sine');
    setTimeout(() => playSound(520 + (3 - rank) * 80, 0.25, 0.15, 'triangle'), 100);
    triggerHaptic('success');
  } else {
    playSound(350, 0.15, 0.12, 'sine');
    triggerHaptic('light');
  }
}

/** Rich, multi-layered champion fanfare */
function playWinnerFanfare() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;

    // Main melody: C5 → E5 → G5 → C6 (rising triumph)
    const notes = [
      { freq: 523, time: 0, dur: 0.25 },
      { freq: 659, time: 0.12, dur: 0.25 },
      { freq: 784, time: 0.24, dur: 0.3 },
      { freq: 1047, time: 0.45, dur: 0.6 },
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, t + n.time);
      gain.gain.setValueAtTime(0.2, t + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + n.dur);
      osc.start(t + n.time);
      osc.stop(t + n.time + n.dur);
    }

    // Harmonic layer (triangle, lower volume)
    const harmonics = [
      { freq: 392, time: 0.24, dur: 0.4 },
      { freq: 523, time: 0.45, dur: 0.5 },
    ];

    for (const h of harmonics) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(h.freq, t + h.time);
      gain.gain.setValueAtTime(0.1, t + h.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + h.time + h.dur);
      osc.start(t + h.time);
      osc.stop(t + h.time + h.dur);
    }

    // Shimmer sparkle (high-pitched sine sweep)
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(2000, t + 0.5);
    shimmer.frequency.exponentialRampToValueAtTime(4000, t + 0.8);
    shimmerGain.gain.setValueAtTime(0.04, t + 0.5);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    shimmer.start(t + 0.5);
    shimmer.stop(t + 1.0);
  } catch { /* graceful fallback */ }
}

// ─── Drumroll (Enhanced) ─────────────────────────────────────────────────────

export function playDrumroll() {
  let i = 0;
  const interval = setInterval(() => {
    const vol = 0.04 + i * 0.006;
    const freq = 180 + Math.random() * 120;
    playSound(freq, 0.07, Math.min(vol, 0.18), 'triangle');
    // Occasional snare-like accent
    if (i % 5 === 4) playSound(freq * 3, 0.04, 0.03, 'square');
    if (i > 2 && i % 8 === 0) triggerHaptic('light');
    i++;
    if (i > 25) clearInterval(interval);
  }, 55);
  return interval;
}

// ─── Victory Celebration (Final confetti moment) ─────────────────────────────

export function playVictoryCelebration() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;

    // Sparkle cascade
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + i * 200, t + i * 0.08);
      gain.gain.setValueAtTime(0.06, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.15);
    }
  } catch { /* graceful fallback */ }
  triggerHaptic('success');
}

export function playScoreTick() {
  playSound(800 + Math.random() * 400, 0.05, 0.08, 'sine');
}
