'use strict';
// Short synthesized chimes (no audio files needed). Shared by offscreen.html and newtab.html.
const CHIMES = {
  azan: [[523.25, 0, 1.4], [659.25, 0.4, 1.4], [783.99, 0.8, 1.8], [1046.5, 1.25, 2.6]],
  pomo: [[880, 0, 0.6], [1318.5, 0.2, 1.0]],
  reminder: [[740, 0, 0.45], [988, 0.16, 0.7], [740, 0.5, 0.45], [988, 0.66, 0.9]],
  pet: [[1046.5, 0, 0.12], [1396.9, 0.07, 0.2]], // short cute "boop"
};

function playChime(kind, volume = 0.8) {
  try {
    const ctx = new AudioContext();
    const seq = CHIMES[kind] || CHIMES.reminder;
    for (const [freq, at, dur] of seq) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const t = ctx.currentTime + at;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.35 * volume), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    setTimeout(() => ctx.close(), 5000);
  } catch (e) {
    console.warn('chime failed', e);
  }
}
