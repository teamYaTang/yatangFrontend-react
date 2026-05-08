/**
 * Lightweight sound effects without assets.
 * Uses WebAudio (oscillator) so it works in dev/prod without bundling mp3.
 */

let _ctx = null;

function getCtx() {
  if (_ctx) return _ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  _ctx = new Ctx();
  return _ctx;
}

function now(ctx) {
  return ctx.currentTime;
}

function tone({ type = "sine", freq = 440, durationMs = 120, gain = 0.04 }) {
  const ctx = getCtx();
  if (!ctx) return;
  // Some browsers start suspended until user gesture; resume best-effort.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g);
  g.connect(ctx.destination);

  const t0 = now(ctx);
  const dur = Math.max(20, durationMs) / 1000;
  // Attack/decay envelope to avoid clicks.
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playFlipSfx() {
  // two-step "whoosh-pop"
  tone({ type: "triangle", freq: 320, durationMs: 70, gain: 0.03 });
  setTimeout(() => tone({ type: "sine", freq: 520, durationMs: 90, gain: 0.035 }), 60);
}

export function playRecipeDoneSfx() {
  // cute upward arpeggio
  tone({ type: "sine", freq: 523.25, durationMs: 90, gain: 0.04 }); // C5
  setTimeout(() => tone({ type: "sine", freq: 659.25, durationMs: 90, gain: 0.04 }), 90); // E5
  setTimeout(() => tone({ type: "sine", freq: 783.99, durationMs: 120, gain: 0.045 }), 180); // G5
}

