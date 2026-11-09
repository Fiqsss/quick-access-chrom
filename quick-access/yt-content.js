'use strict';
/*
 * Runs on youtube.com and music.youtube.com.
 * Reports what is playing to the extension, and follows play/pause/next/previous/seek
 * commands sent from the new-tab music widget.
 */
(() => {
  // If an older copy of this script is still running (extension reloaded), stop it.
  if (typeof window.__qaYtStop === 'function') { try { window.__qaYtStop(); } catch {} }

  const isMusic = location.hostname === 'music.youtube.com';
  const $ = (s) => document.querySelector(s);
  const text = (s) => ($(s)?.textContent || '').trim();
  const video = () => $('video.html5-main-video') || $('video');

  function videoId() {
    try { return new URL(location.href).searchParams.get('v'); } catch { return null; }
  }

  function readMeta() {
    const ms = navigator.mediaSession && navigator.mediaSession.metadata;
    let title = ms?.title || '';
    let artist = ms?.artist || '';
    let art = ms?.artwork?.length ? ms.artwork[ms.artwork.length - 1].src : '';
    if (!title) {
      if (isMusic) {
        title = text('ytmusic-player-bar .title');
        artist = text('ytmusic-player-bar .byline').split('•')[0].trim();
        art = art || $('ytmusic-player-bar img.image')?.src || '';
      } else {
        title = text('h1.ytd-watch-metadata yt-formatted-string') || document.title.replace(/\s*-\s*YouTube$/, '').replace(/^\(\d+\)\s*/, '');
        artist = text('ytd-watch-metadata #owner #channel-name a') || text('#owner #channel-name a');
      }
    }
    const id = videoId();
    if (!art && id) art = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    return { title, artist, art };
  }

  function isPlayerPage() {
    if (isMusic) return !!$('ytmusic-player-bar') && !!video()?.src;
    return location.pathname.startsWith('/watch');
  }

  // Repeat state: YouTube = the video's loop flag; YouTube Music = its repeat button.
  function readRepeat(v) {
    if (!isMusic) return v.loop ? 'one' : 'off';
    const b = $('ytmusic-player-bar .repeat');
    const label = `${b?.getAttribute('title') || ''} ${b?.getAttribute('aria-label') || ''}`.toLowerCase();
    if (/one|satu|sekali/.test(label)) return 'one';
    if (/all|semua/.test(label)) return 'all';
    return 'off';
  }
  function shuffleButton() {
    if (isMusic) return $('ytmusic-player-bar .shuffle');
    return [...document.querySelectorAll('ytd-playlist-panel-renderer ytd-toggle-button-renderer button, ytd-playlist-panel-renderer #playlist-action-menu button')]
      .find((b) => /shuffle|acak/i.test(b.getAttribute('aria-label') || '')) || null;
  }
  // The next few songs: YouTube Music queue, a YouTube playlist, or YouTube's suggestions.
  function queueItems() {
    if (isMusic) {
      const items = [...document.querySelectorAll('ytmusic-player-queue-item')];
      const cur = items.findIndex((n) => n.hasAttribute('selected') || n.getAttribute('play-button-state') === 'playing' || n.getAttribute('play-button-state') === 'paused');
      return items.slice(cur + 1).map((n) => ({ n, title: (n.querySelector('.song-title')?.textContent || '').trim(), artist: (n.querySelector('.byline')?.textContent || '').trim() }));
    }
    const pl = [...document.querySelectorAll('ytd-playlist-panel-video-renderer')];
    if (pl.length) {
      const cur = pl.findIndex((n) => n.hasAttribute('selected'));
      return pl.slice(cur + 1).map((n) => ({ n, title: (n.querySelector('#video-title')?.textContent || '').trim(), artist: (n.querySelector('#byline')?.textContent || '').trim() }));
    }
    return [...document.querySelectorAll('ytd-watch-next-secondary-results-renderer ytd-compact-video-renderer, ytd-watch-next-secondary-results-renderer yt-lockup-view-model')]
      .map((n) => ({
        n,
        title: (n.querySelector('#video-title, .yt-lockup-metadata-view-model__title')?.textContent || '').trim(),
        artist: (n.querySelector('#channel-name #text, .yt-content-metadata-view-model__metadata-text')?.textContent || '').trim(),
        suggestion: true,
      }));
  }
  let lastKey = '';
  let alive = true;
  function post(msg) {
    try {
      chrome.runtime.sendMessage(msg).catch(() => {});
    } catch {
      stop(); // extension was reloaded or removed: this copy is orphaned
    }
  }

  function report(force) {
    if (!alive) return;
    const v = video();
    if (!v || !isPlayerPage()) {
      if (lastKey !== 'gone') { lastKey = 'gone'; post({ type: 'yt-gone' }); }
      return;
    }
    const m = readMeta();
    if (!m.title) return;
    const state = {
      ...m,
      paused: v.paused,
      currentTime: v.currentTime || 0,
      duration: Number.isFinite(v.duration) ? v.duration : 0,
      music: isMusic,
      ad: !!$('.ad-showing'),
      at: Date.now(),
      volume: v.volume,
      muted: v.muted,
      repeat: readRepeat(v),
      shuffle: !!shuffleButton(),
      upNext: queueItems().filter((q) => q.title).slice(0, 4).map(({ title, artist, suggestion }) => ({ title, artist, suggestion: !!suggestion })),
    };
    // Only send when something meaningful changed; the widget interpolates the time itself.
    const key = [state.title, state.artist, state.paused, state.ad, Math.round(state.currentTime / 10), state.repeat, Math.round(state.volume * 20), state.muted, state.upNext.map((q) => q.title).join('/')].join('|');
    if (!force && key === lastKey) return;
    lastKey = key;
    post({ type: 'yt-state', state });
  }

  function clickIfVisible(sel) {
    const b = $(sel);
    if (b && b.offsetParent !== null && getComputedStyle(b).display !== 'none' && !b.disabled) { b.click(); return true; }
    return false;
  }

  function onCommand(msg, _sender, reply) {
    // The new-tab page asks "are you there?" to find YouTube tabs that haven't reported yet.
    if (msg && msg.type === 'yt-ping') {
      lastKey = '';
      report(true);
      reply({ ok: true });
      return;
    }
    if (!msg || msg.type !== 'yt-cmd') return;
    const v = video();
    switch (msg.cmd) {
      case 'toggle':
        if (v) { if (v.paused) v.play(); else v.pause(); }
        break;
      case 'next':
        if (isMusic) clickIfVisible('ytmusic-player-bar .next-button');
        else clickIfVisible('.ytp-next-button');
        break;
      case 'prev':
        if (v && v.currentTime > 5) v.currentTime = 0; // like a music player: first restart the song
        else if (isMusic) clickIfVisible('ytmusic-player-bar .previous-button');
        else if (!clickIfVisible('.ytp-prev-button')) history.back();
        break;
      case 'volume':
        if (v) { v.volume = Math.max(0, Math.min(1, +msg.value)); if (v.volume > 0) v.muted = false; }
        break;
      case 'mute':
        if (v) v.muted = !v.muted;
        break;
      case 'repeat':
        if (isMusic) clickIfVisible('ytmusic-player-bar .repeat');
        else if (v) v.loop = !v.loop;
        break;
      case 'shuffle':
        shuffleButton()?.click();
        break;
      case 'queue': {
        const q = queueItems().filter((x) => x.title)[+msg.index];
        if (q) (q.n.querySelector('ytmusic-play-button-renderer, a#wc-endpoint, a#thumbnail, a.yt-lockup-view-model__content-image') || q.n).click();
        break;
      }
      case 'seek':
        if (v && Number.isFinite(v.duration)) v.currentTime = Math.max(0, Math.min(1, +msg.frac || 0)) * v.duration;
        break;
    }
    setTimeout(() => report(true), 300);
    setTimeout(() => report(true), 1500);
    reply({ ok: true });
  }

  // Media events don't bubble, so listen in the capture phase.
  const onMedia = () => report(true);
  const events = ['play', 'pause', 'seeked', 'loadedmetadata', 'ended', 'volumechange'];
  events.forEach((ev) => document.addEventListener(ev, onMedia, true));
  const onNav = () => setTimeout(() => report(true), 800);
  window.addEventListener('yt-navigate-finish', onNav);
  const timer = setInterval(() => report(false), 2000);
  chrome.runtime.onMessage.addListener(onCommand);

  /* ---- Visualizer (opt-in): frequency levels of this tab's audio ---- */
  // Only wired up when the new-tab page asks for it, and only if the audio context is
  // already running — otherwise routing the video through it could mute the sound.
  let viz = null;
  let vizFailed = false;
  let vizUntil = 0;
  let vizTimer = 0;
  async function setupViz() {
    const v = video();
    if (!v || vizFailed) return null;
    if (viz && viz.el === v) return viz;
    try {
      const ctx = new AudioContext();
      await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 300))]);
      if (ctx.state !== 'running') { ctx.close(); return null; } // try again after the next click in this tab
      const src = ctx.createMediaElementSource(v);
      const an = ctx.createAnalyser();
      an.fftSize = 128;
      an.smoothingTimeConstant = 0.78;
      src.connect(an);
      an.connect(ctx.destination);
      viz = { el: v, ctx, an, data: new Uint8Array(an.frequencyBinCount) };
      return viz;
    } catch {
      vizFailed = true;
      return null;
    }
  }
  function sendViz() {
    if (!alive || Date.now() > vizUntil || !viz) { clearInterval(vizTimer); vizTimer = 0; return; }
    if (viz.el.paused) return;
    viz.an.getByteFrequencyData(viz.data);
    const bands = [];
    const n = 24;
    for (let i = 0; i < n; i++) {
      // Roughly logarithmic bands over the lower part of the spectrum (where music lives).
      const a = Math.floor(Math.pow(i / n, 1.6) * 48), b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / n, 1.6) * 48));
      let s = 0;
      for (let j = a; j < b; j++) s += viz.data[j];
      bands.push(Math.round(s / (b - a)));
    }
    post({ type: 'yt-viz', bands });
  }
  function onVizRequest(msg) {
    if (!msg || msg.type !== 'yt-viz-on' || !alive) return;
    vizUntil = Date.now() + 2500;
    setupViz().then((ok) => { if (ok && !vizTimer) vizTimer = setInterval(sendViz, 66); });
  }
  chrome.runtime.onMessage.addListener(onVizRequest);

  function stop() {
    alive = false;
    clearInterval(vizTimer);
    clearInterval(timer);
    events.forEach((ev) => document.removeEventListener(ev, onMedia, true));
    window.removeEventListener('yt-navigate-finish', onNav);
    try { chrome.runtime.onMessage.removeListener(onCommand); chrome.runtime.onMessage.removeListener(onVizRequest); } catch {}
  }
  window.__qaYtStop = stop;

  report(true);
})();
