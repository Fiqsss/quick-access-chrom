'use strict';
// Plays sounds for the background worker (service workers cannot play audio).
let current = null;

function stop() {
  if (current) { current.pause(); current = null; }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.target !== 'offscreen') return;
  if (msg.type === 'stop') return stop();
  if (msg.type !== 'play') return;
  stop();
  const volume = typeof msg.volume === 'number' ? msg.volume : 0.8;
  if (msg.src) {
    const a = new Audio(msg.src);
    a.volume = volume;
    a.onended = () => { if (current === a) current = null; };
    a.play().catch(() => playChime(msg.kind, volume));
    current = a;
  } else {
    playChime(msg.kind, volume);
  }
});
