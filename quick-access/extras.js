'use strict';
/*
 * Optional extras for Quick Access. Everything here is off until turned on in Settings.
 *  - Settings: tabs + search
 *  - Look: card style, font, cursor effects, moving wallpaper, daily photo, seasonal decorations
 *  - Ctrl+K command palette, calculator & unit/currency conversion in the search box
 *  - Sticky notes anywhere on the page
 *  - Widgets: habits, focus stats, mood, exchange rates & gold, ambient sounds, detailed weather
 *  - Sync between computers (chrome.storage.sync)
 * Loaded before app.js; it only touches app.js globals (D, save, toast, …) inside functions.
 */
(() => {
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const mk = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const ui = () => D.settings.ui;
  const pad2 = (n) => String(n).padStart(2, '0');
  const ymd2 = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isExt = typeof chrome !== 'undefined' && !!(chrome.storage && chrome.storage.local);

  /* =====================================================================
     Settings: tabs + search
     ===================================================================== */
  let curTab = 'look';
  try { curTab = localStorage.getItem('qa-set-tab') || 'look'; } catch {}
  function showTab(tab) {
    curTab = tab;
    try { localStorage.setItem('qa-set-tab', tab); } catch {}
    const search = q('#set-search');
    if (search) search.value = '';
    qa('#set-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    qa('#drawer .set-sec').forEach((s) => { s.hidden = s.dataset.tab !== tab; s.classList.remove('hit'); });
    q('#set-noresult').hidden = true;
    q('#drawer').scrollTop = 0;
  }
  function filterSettings(text) {
    const needle = text.trim().toLowerCase();
    if (!needle) { showTab(curTab); return; }
    qa('#set-tabs button').forEach((b) => b.classList.remove('on'));
    let any = false;
    qa('#drawer .set-sec').forEach((s) => {
      const hit = s.textContent.toLowerCase().includes(needle) ||
        qa('option', s).some((o) => o.textContent.toLowerCase().includes(needle));
      s.hidden = !hit;
      s.classList.toggle('hit', hit);
      any = any || hit;
    });
    q('#set-noresult').hidden = any;
  }
  function setupSettingsUi() {
    qa('#set-tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
    q('#set-search').addEventListener('input', (e) => filterSettings(e.target.value));
    showTab(curTab);
  }

  /* =====================================================================
     Look: card style, transparency, corners, font
     ===================================================================== */
  const FONTS = {
    outfit: { css: "'Outfit'", url: null },
    poppins: { css: "'Poppins'", url: 'Poppins:wght@300;400;500;600' },
    nunito: { css: "'Nunito'", url: 'Nunito:wght@300;400;600;700' },
    fredoka: { css: "'Fredoka'", url: 'Fredoka:wght@300;400;500;600' },
    playfair: { css: "'Playfair Display'", url: 'Playfair+Display:wght@400;500;600' },
    mono: { css: "'JetBrains Mono'", url: 'JetBrains+Mono:wght@300;400;500;600' },
  };
  function loadFont(key) {
    const f = FONTS[key];
    if (!f || !f.url || q(`link[data-font="${key}"]`)) return;
    const l = mk('link');
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${f.url}&display=swap`;
    l.dataset.font = key;
    document.head.append(l);
  }
  function applyLook() {
    if (!D) return;
    const u = ui();
    const root = document.documentElement;
    document.body.classList.remove('card-glass', 'card-solid', 'card-outline', 'card-neon');
    document.body.classList.add(`card-${u.cardStyle || 'glass'}`);
    root.style.setProperty('--glass', `rgba(255, 255, 255, ${(u.glass ?? 7) / 100})`);
    root.style.setProperty('--glass-hi', `rgba(255, 255, 255, ${Math.min(0.5, (u.glass ?? 7) / 100 + 0.06)})`);
    root.style.setProperty('--radius', `${u.radius ?? 22}px`);
    loadFont(u.font);
    const f = FONTS[u.font] || FONTS.outfit;
    root.style.setProperty('--font', `${f.css}, 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif`);
    applyMotion();
    applyDailyPhoto();
    applySeason();
    q('#stickies').hidden = !u.stickies;
    q('#btn-sticky').hidden = !u.stickies;
  }

  /* =====================================================================
     Cursor effects
     ===================================================================== */
  let trailLast = 0;
  function spark(x, y, char, cls) {
    const s = mk('span', cls, char);
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    document.body.append(s);
    setTimeout(() => s.remove(), 900);
    return s;
  }
  window.addEventListener('pointerdown', (e) => {
    if (!D || ui().cursor !== 'sparkle' || reduce) return;
    if (e.target.closest?.('input, textarea, select')) return;
    for (let i = 0; i < 7; i++) {
      const s = spark(e.clientX, e.clientY, ['✦', '✧', '•', '★'][i % 4], 'fx-spark');
      const a = (i / 7) * Math.PI * 2 + rnd(-0.3, 0.3);
      s.style.setProperty('--tx', `${Math.cos(a) * rnd(24, 46)}px`);
      s.style.setProperty('--ty', `${Math.sin(a) * rnd(24, 46)}px`);
    }
  }, { passive: true });
  window.addEventListener('pointermove', (e) => {
    if (!D || ui().cursor !== 'trail' || reduce) return;
    const now = performance.now();
    if (now - trailLast < 35) return;
    trailLast = now;
    spark(e.clientX, e.clientY, Math.random() < 0.5 ? '✦' : '•', 'fx-trail');
  }, { passive: true });

  /* =====================================================================
     Moving wallpaper: gradient pan, floating particles, or your own video
     ===================================================================== */
  const bgfx = { raf: 0, parts: [], videoUrl: null };
  async function applyMotion() {
    const m = reduce ? 'none' : ui().motion || 'none';
    document.body.classList.toggle('motion-gradient', m === 'gradient');
    // particles
    let c = q('#bg-fx');
    if (m === 'particles') {
      if (!c) { c = mk('canvas'); c.id = 'bg-fx'; q('#bg-dim').before(c); }
      c.hidden = false;
      if (!bgfx.raf) startParticles(c);
    } else {
      if (c) c.hidden = true;
      cancelAnimationFrame(bgfx.raf);
      bgfx.raf = 0;
    }
    // video
    let v = q('#bg-video');
    if (m === 'video') {
      if (!v) { v = mk('video'); v.id = 'bg-video'; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; q('#bg-img').after(v); }
      if (!bgfx.videoUrl) {
        const data = await Store.get('qa-video');
        if (data) { try { bgfx.videoUrl = URL.createObjectURL(await (await fetch(data)).blob()); } catch {} }
      }
      if (bgfx.videoUrl && v.src !== bgfx.videoUrl) v.src = bgfx.videoUrl;
      v.hidden = !bgfx.videoUrl;
      if (bgfx.videoUrl) v.play().catch(() => {});
    } else if (v) {
      v.pause();
      v.hidden = true;
    }
    const row = q('#set-video-row');
    if (row) row.hidden = m !== 'video';
  }
  function startParticles(c) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
    resize();
    window.addEventListener('resize', resize);
    bgfx.parts = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(20, 90), vx: rnd(-0.01, 0.01), vy: rnd(-0.012, -0.003), a: rnd(0.05, 0.16), hue: Math.random() }));
    let last = performance.now();
    const draw = (t) => {
      bgfx.raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const g = c.getContext('2d');
      g.clearRect(0, 0, c.width, c.height);
      const w = (WALLS[D.settings.wallpaper] || WALLS.aurora).blobs;
      for (const p of bgfx.parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < -0.15) { p.y = 1.15; p.x = Math.random(); }
        if (p.x < -0.15) p.x = 1.15;
        if (p.x > 1.15) p.x = -0.15;
        const col = w[Math.floor(p.hue * w.length)] || '#ffffff';
        const r = p.r * dpr;
        const grad = g.createRadialGradient(p.x * c.width, p.y * c.height, 0, p.x * c.width, p.y * c.height, r);
        grad.addColorStop(0, col + Math.round(p.a * 255).toString(16).padStart(2, '0'));
        grad.addColorStop(1, col + '00');
        g.fillStyle = grad;
        g.fillRect(p.x * c.width - r, p.y * c.height - r, r * 2, r * 2);
      }
    };
    bgfx.raf = requestAnimationFrame(draw);
  }

  /* =====================================================================
     Daily photo wallpaper (Bing), with favourites
     ===================================================================== */
  let photo = null; // { url, title, copyright, day, idx }
  async function loadDailyPhoto(idx = 0) {
    const day = ymd2(new Date());
    const cache = await Store.get('qa-daily');
    if (cache && cache.day === day && cache.idx === idx && cache.url) return cache;
    const j = await fetchJSON(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=${idx}&n=1&mkt=id-ID`);
    const im = j.images && j.images[0];
    if (!im) throw new Error('no image');
    const data = { day, idx, url: `https://www.bing.com${im.urlbase}_1920x1080.jpg`, title: im.title || '', copyright: im.copyright || '' };
    await Store.set('qa-daily', data);
    return data;
  }
  async function applyDailyPhoto() {
    const bar = q('#photo-bar');
    if (!ui().dailyPhoto) { if (bar) bar.hidden = true; photo = null; return; }
    try {
      const favs = D.photoFavs || [];
      if (ui().photoFavRandom && favs.length) {
        const day = new Date().getDate();
        photo = { ...favs[day % favs.length], fav: true };
      } else if (!photo || photo.fav) {
        photo = await loadDailyPhoto(0);
      }
    } catch {
      if (bar) bar.hidden = true;
      return;
    }
    const img = q('#bg-img');
    img.style.backgroundImage = `url("${photo.url}")`;
    img.style.filter = D.settings.blur ? `blur(${D.settings.blur}px)` : '';
    img.classList.add('on');
    q('#bg').style.background = '#0b0f1e';
    qa('.blob').forEach((b) => { b.style.display = 'none'; });
    renderPhotoBar();
  }
  function renderPhotoBar() {
    let bar = q('#photo-bar');
    if (!bar) {
      bar = mk('div', 'photo-bar');
      bar.id = 'photo-bar';
      document.body.append(bar);
    }
    bar.hidden = false;
    bar.innerHTML = '';
    const isFav = (D.photoFavs || []).some((f) => f.url === photo.url);
    const heart = mk('button', 'pb-btn' + (isFav ? ' on' : ''), isFav ? '❤️' : '🤍');
    heart.title = isFav ? 'Hapus dari favorit' : 'Simpan ke favorit';
    heart.onclick = () => {
      D.photoFavs = D.photoFavs || [];
      if (isFav) D.photoFavs = D.photoFavs.filter((f) => f.url !== photo.url);
      else D.photoFavs.push({ url: photo.url, title: photo.title, copyright: photo.copyright });
      save();
      renderPhotoBar();
      fillSettings();
      toast(isFav ? 'Dihapus dari favorit' : '❤️ Disimpan ke foto favorit');
    };
    const next = mk('button', 'pb-btn', '⟳');
    next.title = 'Foto lain (hari-hari sebelumnya)';
    next.onclick = async () => {
      try { photo = await loadDailyPhoto(((photo.idx || 0) + 1) % 8); applyDailyPhoto(); } catch { toast('Tidak bisa memuat foto'); }
    };
    const cap = mk('span', 'pb-cap', photo.title || photo.copyright || 'Foto hari ini');
    cap.title = photo.copyright || '';
    bar.append(mk('span', null, '📷'), cap, heart, next);
  }

  /* =====================================================================
     Seasonal decorations (+ pet costume)
     ===================================================================== */
  const SEASONS = {
    ramadan: { text: '🌙 Marhaban ya Ramadan — semoga puasanya lancar', costume: 'peci' },
    lebaran: { text: '🕌 Selamat Hari Raya Idul Fitri · Mohon maaf lahir & batin', costume: 'peci' },
    iduladha: { text: '🐐 Selamat Hari Raya Idul Adha', costume: 'peci' },
    merdeka: { text: '🇮🇩 Dirgahayu Republik Indonesia!', costume: 'bandana' },
    natal: { text: '🎄 Selamat Natal', costume: 'santa' },
    tahunbaru: { text: '🎆 Selamat Tahun Baru!', costume: 'partyhat' },
  };
  function currentSeason() {
    if (!D) return null;
    const pick = ui().season || 'auto';
    if (pick === 'off') return null;
    if (pick !== 'auto') return SEASONS[pick] ? pick : null;
    const d = new Date();
    const m = d.getMonth() + 1, day = d.getDate();
    try {
      const h = typeof hijri === 'function' && hijri(d);
      if (h) {
        if (h.m === 9) return 'ramadan';
        if (h.m === 10 && h.d <= 7) return 'lebaran';
        if (h.m === 12 && h.d >= 9 && h.d <= 13) return 'iduladha';
      }
    } catch {}
    if (m === 8 && day <= 20) return 'merdeka';
    if (m === 12 && day >= 20 && day <= 26) return 'natal';
    if ((m === 12 && day >= 30) || (m === 1 && day <= 2)) return 'tahunbaru';
    return null;
  }
  const lantern = (x, len, delay, color) => `<g class="sd-swing" style="transform-origin:${x}px 0;animation-delay:${delay}s">
    <line x1="${x}" y1="0" x2="${x}" y2="${len}" stroke="#d4a017" stroke-width="1.2"/>
    <path d="M${x - 10},${len + 6} q10,-10 20,0 l-3,26 q-7,6 -14,0 z" fill="${color}" stroke="#7c2d12" stroke-width="1"/>
    <rect x="${x - 7}" y="${len}" width="14" height="6" rx="2" fill="#d4a017"/><rect x="${x - 5}" y="${len + 32}" width="10" height="4" rx="2" fill="#d4a017"/>
    <ellipse cx="${x}" cy="${len + 19}" rx="5" ry="9" fill="#fde68a" opacity="0.65"/></g>`;
  const ketupat = (x, len, delay) => `<g class="sd-swing" style="transform-origin:${x}px 0;animation-delay:${delay}s">
    <line x1="${x}" y1="0" x2="${x}" y2="${len}" stroke="#65a30d" stroke-width="1.5"/>
    <path d="M${x},${len} l16,16 l-16,16 l-16,-16 z" fill="#a3e635" stroke="#3f6212" stroke-width="1.5"/>
    <path d="M${x - 8},${len + 8} l16,16 M${x + 8},${len + 8} l-16,16" stroke="#3f6212" stroke-width="1.2"/>
    <path d="M${x - 3},${len + 32} q-4,10 -8,14 M${x + 3},${len + 32} q4,10 8,14" stroke="#65a30d" stroke-width="2" fill="none"/></g>`;
  function decorSVG(key, W) {
    if (key === 'ramadan') {
      const n = Math.max(4, Math.floor(W / 220));
      const lanterns = Array.from({ length: n }, (_, i) => lantern((i + 0.5) * (W / n), 30 + (i % 3) * 22, i * 0.4, ['#dc2626', '#f59e0b', '#16a34a', '#2563eb'][i % 4])).join('');
      return `<svg width="${W}" height="140" viewBox="0 0 ${W} 140"><path d="M${W - 120},40 a26,26 0 1,0 18,44 a20,20 0 1,1 -18,-44z" fill="#fde68a" opacity="0.9"/>${lanterns}</svg>`;
    }
    if (key === 'lebaran' || key === 'iduladha') {
      const n = Math.max(4, Math.floor(W / 200));
      return `<svg width="${W}" height="120" viewBox="0 0 ${W} 120">${Array.from({ length: n }, (_, i) => ketupat((i + 0.5) * (W / n), 24 + (i % 2) * 22, i * 0.35)).join('')}</svg>`;
    }
    if (key === 'merdeka') {
      // Red-white bunting across the top.
      const n = Math.ceil(W / 34);
      let flags = '';
      for (let i = 0; i < n; i++) {
        const x = i * 34;
        const y = 8 + Math.sin((i / n) * Math.PI) * 14;
        flags += `<path d="M${x},${y} l34,${(Math.sin(((i + 1) / n) * Math.PI) - Math.sin((i / n) * Math.PI)) * 14} l-17,30 z" fill="${i % 2 ? '#ffffff' : '#dc2626'}" opacity="0.92"/>`;
      }
      return `<svg width="${W}" height="70" viewBox="0 0 ${W} 70"><path d="M0,8 Q${W / 2},36 ${W},8" stroke="#94a3b8" stroke-width="1.5" fill="none"/>${flags}</svg>`;
    }
    return '';
  }
  let seasonDrawn = '';
  function applySeason() {
    const key = currentSeason();
    let layer = q('#season-decor');
    if (!layer) { layer = mk('div', 'season-decor'); layer.id = 'season-decor'; layer.setAttribute('aria-hidden', 'true'); document.body.append(layer); }
    const W = innerWidth;
    const sig = `${key}|${Math.round(W / 100)}`;
    if (sig !== seasonDrawn) {
      seasonDrawn = sig;
      layer.innerHTML = key ? decorSVG(key, W) : '';
      layer.className = `season-decor ${key || ''}`;
      if (key === 'natal' || key === 'tahunbaru') {
        for (let i = 0; i < 26; i++) {
          const f = mk('span', 'sd-flake', key === 'natal' ? '❄' : ['🎉', '✨', '🎊'][i % 3]);
          f.style.left = `${Math.random() * 100}%`;
          f.style.animationDelay = `${-Math.random() * 12}s`;
          f.style.animationDuration = `${rnd(9, 16)}s`;
          f.style.fontSize = `${rnd(10, 18)}px`;
          layer.append(f);
        }
      }
    }
    layer.hidden = !key;
    let banner = q('#season-banner');
    if (!banner) { banner = mk('div', 'season-banner'); banner.id = 'season-banner'; q('#greeting').after(banner); }
    banner.textContent = key ? SEASONS[key].text : '';
    banner.hidden = !key;
  }
  window.addEventListener('resize', () => { if (D) applySeason(); });
  function seasonCostume() {
    if (!D || ui().seasonPet === false) return null;
    const key = currentSeason();
    return key ? SEASONS[key].costume : null;
  }

  /* =====================================================================
     Calculator & conversions (used by the search box and the palette)
     ===================================================================== */
  // Safe arithmetic: numbers, + - * / ^ %, parentheses, sqrt(), pi. No eval().
  function evalMath(src) {
    const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\s+/g, '').toLowerCase();
    if (!/^[\d.+\-*/^%()a-z]+$/.test(s) || !/[\d)]/.test(s) || !/[+\-*/^%(]|sqrt|pi/.test(s)) return null;
    let i = 0;
    const peek = () => s[i];
    const num = () => {
      if (s.startsWith('pi', i)) { i += 2; return Math.PI; }
      if (s.startsWith('sqrt', i)) { i += 4; return Math.sqrt(factor()); }
      const m = s.slice(i).match(/^\d*\.?\d+(e[+-]?\d+)?/);
      if (!m) throw new Error('num');
      i += m[0].length;
      return parseFloat(m[0]);
    };
    const factor = () => {
      if (peek() === '-') { i++; return -factor(); }
      if (peek() === '+') { i++; return factor(); }
      let v;
      if (peek() === '(') { i++; v = expr(); if (peek() !== ')') throw new Error(')'); i++; } else v = num();
      if (peek() === '%') { i++; v /= 100; }
      if (peek() === '^') { i++; v = Math.pow(v, factor()); }
      return v;
    };
    const term = () => { let v = factor(); while (peek() === '*' || peek() === '/') { const op = s[i++]; const r = factor(); v = op === '*' ? v * r : v / r; } return v; };
    const expr = () => { let v = term(); while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; };
    try {
      const v = expr();
      if (i !== s.length || !Number.isFinite(v)) return null;
      return v;
    } catch { return null; }
  }
  const UNITS = {
    // length → metres
    mm: ['len', 0.001], cm: ['len', 0.01], m: ['len', 1], km: ['len', 1000], in: ['len', 0.0254], inch: ['len', 0.0254], ft: ['len', 0.3048], kaki: ['len', 0.3048], yd: ['len', 0.9144], mi: ['len', 1609.344], mil: ['len', 1609.344],
    // mass → grams
    mg: ['mass', 0.001], g: ['mass', 1], gr: ['mass', 1], gram: ['mass', 1], ons: ['mass', 100], kg: ['mass', 1000], ton: ['mass', 1e6], lb: ['mass', 453.592], lbs: ['mass', 453.592], oz: ['mass', 28.3495],
    // volume → litres
    ml: ['vol', 0.001], l: ['vol', 1], liter: ['vol', 1], gal: ['vol', 3.78541], galon: ['vol', 19], cup: ['vol', 0.24], gelas: ['vol', 0.25],
    // time → seconds
    detik: ['time', 1], s: ['time', 1], menit: ['time', 60], min: ['time', 60], jam: ['time', 3600], h: ['time', 3600], hari: ['time', 86400], minggu: ['time', 604800], bulan: ['time', 2629800], tahun: ['time', 31557600],
    // data → bytes
    kb: ['data', 1024], mb: ['data', 1024 ** 2], gb: ['data', 1024 ** 3], tb: ['data', 1024 ** 4],
    // speed → m/s
    kmh: ['speed', 1 / 3.6], 'km/h': ['speed', 1 / 3.6], 'km/jam': ['speed', 1 / 3.6], mph: ['speed', 0.44704], 'm/s': ['speed', 1], knot: ['speed', 0.514444],
    // area → m²
    m2: ['area', 1], km2: ['area', 1e6], ha: ['area', 10000], hektar: ['area', 10000], are: ['area', 100], acre: ['area', 4046.86],
  };
  const TEMP = { c: 'c', '°c': 'c', celsius: 'c', f: 'f', '°f': 'f', fahrenheit: 'f', k: 'k', kelvin: 'k', r: 'r', reamur: 'r' };
  const CURR = ['idr', 'usd', 'eur', 'sgd', 'myr', 'jpy', 'sar', 'gbp', 'aud', 'cny', 'krw', 'thb', 'hkd', 'aed', 'inr', 'chf', 'cad', 'twd', 'php', 'nzd'];
  let rates = null; // { USD-based }
  let ratesLoading = null;
  async function loadRates() {
    if (rates) return rates;
    if (ratesLoading) return ratesLoading;
    ratesLoading = (async () => {
      const c = await Store.get('qa-rates');
      if (c && Date.now() - c.at < 6 * 3600 * 1000) { rates = c.rates; return rates; }
      const j = await fetchJSON('https://open.er-api.com/v6/latest/USD');
      rates = j.rates;
      await Store.set('qa-rates', { at: Date.now(), rates });
      return rates;
    })().catch(() => null).finally(() => { ratesLoading = null; });
    return ratesLoading;
  }
  const fmtNum = (v, max = 6) => {
    const abs = Math.abs(v);
    const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : max;
    return v.toLocaleString('id-ID', { maximumFractionDigits: digits });
  };
  // Returns { text, copy } | { pending: true } | null
  function calc(raw) {
    const s = String(raw || '').trim().toLowerCase();
    if (!s || s.length > 120) return null;
    const conv = s.match(/^(-?[\d.,]+)\s*([a-z°/²0-9]+)\s+(ke|to|in|jadi|=)\s+([a-z°/²0-9]+)$/i);
    if (conv) {
      const n = parseFloat(conv[1].replace(/\./g, (m, off, str) => (str.indexOf(',') >= 0 ? '' : m)).replace(',', '.'));
      const a = conv[2].replace('²', '2'), b = conv[4].replace('²', '2');
      if (Number.isFinite(n)) {
        if (TEMP[a] && TEMP[b]) {
          const toC = { c: (x) => x, f: (x) => (x - 32) * 5 / 9, k: (x) => x - 273.15, r: (x) => x * 5 / 4 }[TEMP[a]](n);
          const out = { c: toC, f: toC * 9 / 5 + 32, k: toC + 273.15, r: toC * 4 / 5 }[TEMP[b]];
          return { text: `${fmtNum(n)} °${TEMP[a].toUpperCase()} = ${fmtNum(out)} °${TEMP[b].toUpperCase()}`, copy: fmtNum(out) };
        }
        if (UNITS[a] && UNITS[b] && UNITS[a][0] === UNITS[b][0]) {
          const out = n * UNITS[a][1] / UNITS[b][1];
          return { text: `${fmtNum(n)} ${a} = ${fmtNum(out)} ${b}`, copy: fmtNum(out) };
        }
        if (CURR.includes(a) && CURR.includes(b)) {
          if (!rates) { loadRates().then(() => { if (typeof updateHint === 'function') updateHint(); }); return { pending: true }; }
          const ra = rates[a.toUpperCase()], rb = rates[b.toUpperCase()];
          if (!ra || !rb) return null;
          const out = n / ra * rb;
          return { text: `${fmtNum(n)} ${a.toUpperCase()} = ${out.toLocaleString('id-ID', { maximumFractionDigits: b === 'idr' ? 0 : 2 })} ${b.toUpperCase()}`, copy: String(Math.round(out * 100) / 100) };
        }
      }
    }
    const v = evalMath(s);
    if (v == null) return null;
    return { text: `${raw.trim()} = ${fmtNum(v, 10)}`, copy: String(Math.round(v * 1e10) / 1e10) };
  }

  /* =====================================================================
     Ctrl+K command palette
     ===================================================================== */
  let palItems = [];
  let palSel = 0;
  function paletteCommands(query) {
    const cmds = [];
    const add = (icon, label, run, keys = '') => cmds.push({ icon, label, run, keys: `${label} ${keys}`.toLowerCase() });
    // Dynamic entries from what was typed.
    if (query) {
      const r = calc(query);
      if (r && r.text) add('🧮', r.text, () => { navigator.clipboard?.writeText(r.copy); toast(`Disalin: ${r.copy}`); }, 'hitung');
      add('🔍', `Cari di ${ENGINE_NAMES[D.settings.engine] || 'Google'}: "${query}"`, () => go((ENGINES[D.settings.engine] || ENGINES.google) + encodeURIComponent(query), false), 'cari');
      add('🌐', `Terjemahkan: "${query}"`, () => { setSearchMode('translate'); searchInput.value = query; runTranslate(query); }, 'terjemah');
      add('✅', `Tambah tugas: "${query}"`, () => { D.todos.unshift({ id: uid(), text: query, done: false }); save(); renderTodos(); toast('Tugas ditambahkan'); }, 'tugas todo');
      if (ui().stickies) add('📝', `Sticky note: "${query}"`, () => addSticky(query), 'catatan tempel');
      cmds.forEach((c) => { c.typed = true; }); // these act on the typed text
    }
    D.shortcuts.filter((s) => s.type !== 'folder').forEach((s) => add('🔗', s.name, () => openItem(s), s.url));
    D.groups.forEach((g) => add('🗂️', `Grup: ${g.name}`, () => selectGroup(g.id), 'shortcut'));
    add(pomo && pomo.running ? '⏸️' : '▶️', pomo && pomo.running ? 'Jeda Pomodoro' : 'Mulai Pomodoro', () => (pomo.running ? pomoPause() : pomoStart()), 'fokus timer');
    add('🎯', focusMode ? 'Keluar dari mode fokus' : 'Mode fokus', () => setFocusMode(!focusMode), 'focus');
    add('✏️', 'Atur tata letak', () => setEditLayout(true), 'layout widget');
    Object.values(LAYOUT_TEMPLATES).forEach((t) => add(t.icon, `Tata letak: ${t.name}`, () => applyArrangement(t.make(), t.name), 'template layout'));
    (D.settings.layoutProfiles || []).forEach((p) => add('💾', `Susunan: ${p.name}`, () => loadProfile(p.id), 'layout tersimpan'));
    Object.entries(THEMES).forEach(([k, t]) => add(t.icon, `Tema: ${t.name}`, () => applyThemePreset(k), 'theme wallpaper warna'));
    add('🕰️', 'Tema otomatis sesuai waktu', () => { D.settings.autoTheme = true; save(); applyAutoTheme(true); }, 'theme');
    [['look', '🎨 Tampilan'], ['widgets', '🧩 Widget'], ['search', '🔎 Pencarian'], ['ibadah', '🕌 Ibadah & azan'], ['focus', '⏱ Fokus & Pomodoro'], ['pet', '🐱 Peliharaan'], ['general', '⚙️ Umum & data']]
      .forEach(([tab, name]) => add('⚙️', `Pengaturan: ${name}`, () => { openDrawer(); showTab(tab); }, 'settings'));
    if (window.QAPet && D.settings.pet.enabled) {
      add('🐾', 'Panggil peliharaan', () => q('#set-pet-call').click(), 'pet');
      add('🍪', 'Beri camilan peliharaan', () => q('#set-pet-feed').click(), 'pet makan');
      add('🎾', 'Main bola dengan peliharaan', () => QAPet.throwBall(), 'pet');
    }
    add('📝', 'Tambah sticky note', () => addSticky(''), 'catatan tempel');
    add('🌐', 'Mode terjemah', () => setSearchMode('translate'), 'translate');
    if (ui().dailyPhoto && photo) add('❤️', 'Simpan foto wallpaper ke favorit', () => q('#photo-bar .pb-btn')?.click(), 'foto');
    return cmds;
  }
  function openPalette() {
    let pal = q('#palette');
    if (!pal) {
      pal = mk('div', 'palette-wrap');
      pal.id = 'palette';
      pal.innerHTML = '<div class="palette" role="dialog" aria-label="Palet perintah"><div class="pal-input"><span>⌘</span><input id="pal-input" placeholder="Ketik perintah, shortcut, hitungan, atau apa saja…" autocomplete="off"><kbd>Esc</kbd></div><ul class="pal-list" id="pal-list"></ul><div class="pal-foot">↑↓ pilih · Enter jalankan · Esc tutup</div></div>';
      document.body.append(pal);
      pal.addEventListener('mousedown', (e) => { if (e.target === pal) closePalette(); });
      const input = q('#pal-input', pal);
      input.addEventListener('input', () => renderPalette(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          palSel = (palSel + (e.key === 'ArrowDown' ? 1 : -1) + palItems.length) % Math.max(1, palItems.length);
          drawPalSel();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          runPal(palItems[palSel]);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closePalette();
        }
      });
    }
    pal.hidden = false;
    const input = q('#pal-input');
    input.value = '';
    renderPalette('');
    setTimeout(() => input.focus(), 10);
  }
  function closePalette() { const p = q('#palette'); if (p) p.hidden = true; }
  function runPal(item) { if (!item) return; closePalette(); try { item.run(); } catch (e) { console.warn(e); } }
  function renderPalette(text) {
    const query = text.trim();
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const all = paletteCommands(query);
    // Order: a calculator result first, then real matches (shortcuts, themes, commands…),
    // and the generic "do something with this text" actions (search, translate, add task) last.
    const scored = all.map((c, idx) => {
      if (!words.length) return { c, score: 1000 - idx };
      if (c.typed) return c.icon === '🧮' ? { c, score: 900 } : { c, score: 10 - idx };
      if (!words.every((w) => c.keys.includes(w))) return null;
      return { c, score: (c.label.toLowerCase().startsWith(words[0]) ? 300 : 100) - idx * 0.01 };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 14);
    palItems = scored.map((x) => x.c);
    palSel = 0;
    const list = q('#pal-list');
    list.innerHTML = '';
    palItems.forEach((c, i) => {
      const li = mk('li', i === 0 ? 'sel' : '');
      li.append(mk('span', 'pi', c.icon), mk('span', 'pl', c.label));
      li.onmouseenter = () => { palSel = i; drawPalSel(); };
      li.onclick = () => runPal(c);
      list.append(li);
    });
    if (!palItems.length) list.append(mk('li', 'pal-empty', 'Tidak ada yang cocok'));
  }
  function drawPalSel() {
    qa('#pal-list li').forEach((li, i) => li.classList.toggle('sel', i === palSel));
    qa('#pal-list li')[palSel]?.scrollIntoView({ block: 'nearest' });
  }
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const p = q('#palette');
      if (p && !p.hidden) closePalette(); else openPalette();
    }
  }, true);

  /* =====================================================================
     Sticky notes
     ===================================================================== */
  const STICKY_COLORS = ['#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#ddd6fe', '#fed7aa'];
  let stickyTimer;
  const saveStickies = () => { clearTimeout(stickyTimer); stickyTimer = setTimeout(save, 400); };
  function addSticky(text = '') {
    if (!ui().stickies) { ui().stickies = true; save(); applyLook(); fillSettings(); }
    D.stickies = D.stickies || [];
    const n = {
      id: uid(), text, color: STICKY_COLORS[D.stickies.length % STICKY_COLORS.length],
      x: Math.round(innerWidth / 2 - 110 + rnd(-60, 60)), y: Math.round(scrollY + 140 + rnd(-30, 30)), w: 220, h: 180,
    };
    D.stickies.push(n);
    save();
    renderStickies();
    setTimeout(() => q(`.sticky[data-id="${n.id}"] textarea`)?.focus(), 30);
  }
  function renderStickies() {
    const box = q('#stickies');
    if (!box) return;
    const list = D.stickies || [];
    qa('.sticky', box).forEach((n) => { if (!list.some((s) => s.id === n.dataset.id)) n.remove(); });
    list.forEach((s) => {
      let n = q(`.sticky[data-id="${s.id}"]`, box);
      if (!n) {
        n = mk('div', 'sticky');
        n.dataset.id = s.id;
        const head = mk('div', 'st-head');
        const dots = mk('div', 'st-colors');
        STICKY_COLORS.forEach((c) => {
          const d = mk('button', 'st-dot');
          d.type = 'button';
          d.style.background = c;
          d.title = 'Ganti warna';
          d.onclick = (e) => { e.stopPropagation(); s.color = c; n.style.background = c; saveStickies(); };
          dots.append(d);
        });
        const del = mk('button', 'st-del', '✕');
        del.type = 'button';
        del.title = 'Hapus sticky note';
        del.onclick = (e) => {
          e.stopPropagation();
          if (s.text.trim() && !confirm('Hapus sticky note ini?')) return;
          D.stickies = D.stickies.filter((x) => x !== s);
          save();
          renderStickies();
        };
        head.append(dots, del);
        const ta = mk('textarea');
        ta.placeholder = 'Tulis sesuatu…';
        ta.value = s.text;
        ta.oninput = () => { s.text = ta.value; saveStickies(); };
        n.append(head, ta);
        // drag by the header
        head.addEventListener('pointerdown', (e) => {
          if (e.target.closest('button')) return;
          e.preventDefault();
          head.setPointerCapture(e.pointerId);
          const sx = e.pageX - s.x, sy = e.pageY - s.y;
          n.classList.add('drag');
          const move = (ev) => { s.x = Math.max(0, ev.pageX - sx); s.y = Math.max(0, ev.pageY - sy); n.style.left = `${s.x}px`; n.style.top = `${s.y}px`; };
          const up = () => { n.classList.remove('drag'); head.removeEventListener('pointermove', move); saveStickies(); };
          head.addEventListener('pointermove', move);
          head.addEventListener('pointerup', up, { once: true });
        });
        new ResizeObserver(() => {
          const w = n.offsetWidth, h = n.offsetHeight;
          if (w && h && (Math.abs(w - s.w) > 2 || Math.abs(h - s.h) > 2)) { s.w = w; s.h = h; saveStickies(); }
        }).observe(n);
        box.append(n);
      }
      Object.assign(n.style, { left: `${s.x}px`, top: `${s.y}px`, width: `${s.w}px`, height: `${s.h}px`, background: s.color });
      const ta = q('textarea', n);
      if (document.activeElement !== ta && ta.value !== s.text) ta.value = s.text;
    });
  }

  /* =====================================================================
     Widgets: habits · focus stats · mood · exchange rates & gold · ambient sounds
     ===================================================================== */
  const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const head = (title, sub) => { const h = mk('div', 'card-head'); h.append(mk('span', null, title), mk('span', 'muted', sub || '')); return h; };

  // --- Habits ---
  const HABIT_IDEAS = [['🕌', 'Sholat 5 waktu'], ['📖', "Baca Qur'an"], ['🏃', 'Olahraga'], ['💧', 'Minum 8 gelas'], ['📚', 'Belajar 30 menit'], ['😴', 'Tidur sebelum 23.00']];
  function streak(h) {
    let n = 0;
    const d = new Date();
    if (!h.days[ymd2(d)]) d.setDate(d.getDate() - 1); // today not done yet: count up to yesterday
    while (h.days[ymd2(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function renderHabits() {
    const card = q('#w-habits');
    if (!card || !D.settings.widgets.habits) return;
    D.habits = D.habits || [];
    card.innerHTML = '';
    const doneToday = D.habits.filter((h) => h.days[ymd2(new Date())]).length;
    card.append(head('Kebiasaan', D.habits.length ? `${doneToday}/${D.habits.length} hari ini` : ''));
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    if (D.habits.length) {
      const hdr = mk('div', 'hb-row hb-hdr');
      hdr.append(mk('span'), ...days.map((d) => mk('span', 'hb-day', DAY_SHORT[d.getDay()][0])), mk('span'));
      card.append(hdr);
    }
    D.habits.forEach((h) => {
      const row = mk('div', 'hb-row');
      const name = mk('span', 'hb-name', h.name);
      name.title = 'Klik kanan untuk menghapus';
      name.oncontextmenu = (e) => { e.preventDefault(); if (confirm(`Hapus kebiasaan "${h.name}"?`)) { D.habits = D.habits.filter((x) => x !== h); save(); renderHabits(); } };
      row.append(name);
      days.forEach((d, i) => {
        const k = ymd2(d);
        const b = mk('button', 'hb-dot' + (h.days[k] ? ' on' : '') + (i === 6 ? ' today' : ''));
        b.type = 'button';
        b.title = `${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}`;
        b.onclick = () => {
          if (h.days[k]) delete h.days[k]; else h.days[k] = true;
          save();
          renderHabits();
          if (i === 6 && h.days[k] && D.habits.every((x) => x.days[k])) {
            window.QAPet?.event('todos-done');
            toast('🔥 Semua kebiasaan hari ini selesai!');
          }
        };
        row.append(b);
      });
      const st = streak(h);
      row.append(mk('span', 'hb-streak', st ? `🔥${st}` : ''));
      card.append(row);
    });
    const form = mk('form', 'hb-form');
    const inp = mk('input');
    inp.placeholder = '＋ Kebiasaan baru (mis. 🧘 Meditasi)';
    inp.maxLength = 40;
    form.append(inp);
    form.onsubmit = (e) => { e.preventDefault(); const v = inp.value.trim(); if (!v) return; D.habits.push({ id: uid(), name: v, days: {} }); save(); renderHabits(); };
    card.append(form);
    if (!D.habits.length) {
      const ideas = mk('div', 'chips');
      HABIT_IDEAS.forEach(([i, n]) => {
        const b = mk('button', 'chip-btn', `${i} ${n}`);
        b.type = 'button';
        b.onclick = () => { D.habits.push({ id: uid(), name: `${i} ${n}`, days: {} }); save(); renderHabits(); };
        ideas.append(b);
      });
      card.append(ideas);
    }
  }

  // --- Focus stats (from the pomodoro history) ---
  function renderStats() {
    const card = q('#w-stats');
    if (!card || !D.settings.widgets.stats) return;
    const hist = (pomo && pomo.hist) || {};
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    const vals = days.map((d) => hist[ymd2(d)] || 0);
    const total = vals.reduce((a, b) => a + b, 0);
    const mins = total * (D.settings.pomo.work || 25);
    const best = Math.max(...Object.values(hist), 0);
    let streakDays = 0;
    for (let i = 6; i >= 0 && vals[i] > 0; i--) streakDays++;
    card.innerHTML = '';
    card.append(head('Statistik fokus', '7 hari'));
    const max = Math.max(4, ...vals);
    const chart = mk('div', 'stat-chart');
    days.forEach((d, i) => {
      const col = mk('div', 'sc-col' + (i === 6 ? ' today' : ''));
      const bar = mk('div', 'sc-bar');
      bar.style.height = `${(vals[i] / max) * 100}%`;
      bar.title = `${vals[i]} sesi`;
      col.append(mk('span', 'sc-val', vals[i] ? String(vals[i]) : ''), bar, mk('span', 'sc-day', DAY_SHORT[d.getDay()]));
      chart.append(col);
    });
    card.append(chart);
    const sum = mk('div', 'stat-sum');
    const h = Math.floor(mins / 60), m = mins % 60;
    sum.append(
      mk('div', null, `⏱ ${total} sesi · ${h ? `${h} jam ` : ''}${m} menit`),
      mk('div', null, `🔥 ${streakDays} hari beruntun · 🏆 rekor ${best} sesi/hari`),
    );
    card.append(sum);
    if (!total) card.append(mk('p', 'muted small', 'Mulai Pomodoro, nanti grafiknya terisi otomatis.'));
  }

  // --- Mood ---
  const MOODS = [['😄', 'Senang'], ['🙂', 'Baik'], ['😐', 'Biasa'], ['😴', 'Capek'], ['😔', 'Sedih'], ['😡', 'Kesal']];
  function renderMood() {
    const card = q('#w-mood');
    if (!card || !D.settings.widgets.mood) return;
    D.moods = D.moods || {};
    const today = ymd2(new Date());
    card.innerHTML = '';
    card.append(head('Mood', new Date().toLocaleDateString('id-ID', { month: 'long' })));
    card.append(mk('div', 'mood-q', D.moods[today] ? 'Mood hari ini:' : 'Gimana perasaanmu hari ini?'));
    const row = mk('div', 'mood-row');
    MOODS.forEach(([e, name]) => {
      const b = mk('button', 'mood-btn' + (D.moods[today] === e ? ' on' : ''), e);
      b.type = 'button';
      b.title = name;
      b.onclick = () => {
        D.moods[today] = e;
        save();
        renderMood();
        window.QAPet?.event('mood', { mood: e });
      };
      row.append(b);
    });
    card.append(row);
    // This month at a glance
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const grid = mk('div', 'mood-grid');
    for (let i = 0; i < (first.getDay() + 6) % 7; i++) grid.append(mk('span'));
    const count = {};
    for (let d = 1; d <= daysIn; d++) {
      const k = ymd2(new Date(now.getFullYear(), now.getMonth(), d));
      const e = D.moods[k];
      if (e) count[e] = (count[e] || 0) + 1;
      const c = mk('span', 'mg-day' + (d === now.getDate() ? ' today' : ''), e || String(d));
      if (!e) c.classList.add('empty');
      c.title = `${d} ${now.toLocaleDateString('id-ID', { month: 'long' })}${e ? ' · ' + (MOODS.find((m) => m[0] === e) || [])[1] : ''}`;
      grid.append(c);
    }
    card.append(grid);
    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    if (top) card.append(mk('div', 'muted small', `Paling sering bulan ini: ${top[0]} (${top[1]} hari)`));
  }

  // --- Exchange rates & gold ---
  const FIN = [['USD', '🇺🇸'], ['SGD', '🇸🇬'], ['MYR', '🇲🇾'], ['SAR', '🇸🇦'], ['EUR', '🇪🇺'], ['JPY', '🇯🇵', 100]];
  async function renderFinance() {
    const card = q('#w-finance');
    if (!card || !D.settings.widgets.finance) return;
    card.innerHTML = '';
    card.append(head('Kurs & emas', 'ke Rupiah'));
    const body = mk('div', 'fin-list', 'Memuat…');
    card.append(body);
    const r = await loadRates();
    body.innerHTML = '';
    if (!r || !r.IDR) { body.append(mk('div', 'muted small', 'Tidak bisa memuat kurs. Cek koneksi internet.')); return; }
    FIN.forEach(([code, flag, per = 1]) => {
      const idr = (r.IDR / r[code]) * per;
      const row = mk('div', 'fin-row');
      row.append(mk('span', null, `${flag} ${per > 1 ? per + ' ' : ''}${code}`), mk('b', null, `Rp ${idr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`));
      body.append(row);
    });
    const goldRow = mk('div', 'fin-row gold');
    goldRow.append(mk('span', null, '🥇 Emas /gram'), mk('b', null, '…'));
    body.append(goldRow);
    try {
      let g = await Store.get('qa-gold');
      if (!g || Date.now() - g.at > 3 * 3600 * 1000) {
        const j = await fetchJSON('https://api.gold-api.com/price/XAU');
        g = { at: Date.now(), usdPerOz: j.price };
        await Store.set('qa-gold', g);
      }
      const perGram = (g.usdPerOz / 31.1035) * r.IDR;
      q('b', goldRow).textContent = `Rp ${perGram.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
      goldRow.title = 'Harga emas dunia (spot), bukan harga jual toko/Antam';
    } catch {
      q('b', goldRow).textContent = 'tidak tersedia';
    }
    card.append(mk('div', 'muted small', 'Kurs tengah pasar, diperbarui berkala. Emas = harga dunia (spot), bukan harga toko.'));
  }

  // --- Ambient sounds (generated with Web Audio; no audio files) ---
  const AMB = [['rain', '🌧️', 'Hujan'], ['waves', '🌊', 'Ombak'], ['wind', '🍃', 'Angin'], ['fire', '🔥', 'Api unggun'], ['birds', '🐦', 'Burung'], ['brown', '🟤', 'Brown noise'], ['lofi', '🎹', 'Lo-fi']];
  const amb = { ctx: null, master: null, nodes: {}, playing: false, timers: [] };
  function noiseBuffer(ctx, kind) {
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }
  function noiseSrc(ctx, kind) { const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx, kind); s.loop = true; s.start(); return s; }
  function buildSound(key) {
    const ctx = amb.ctx;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(amb.master);
    const lfo = (freq, depth, target, base) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = freq; g.gain.value = depth; o.connect(g).connect(target); o.start(); if (base != null) target.value = base; };
    if (key === 'rain') {
      const n = noiseSrc(ctx, 'white');
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.5;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
      n.connect(bp).connect(hp).connect(out);
    } else if (key === 'waves') {
      const n = noiseSrc(ctx, 'brown');
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const g = ctx.createGain(); g.gain.value = 0.55;
      lfo(0.09, 0.45, g.gain);
      n.connect(lp).connect(g).connect(out);
    } else if (key === 'wind') {
      const n = noiseSrc(ctx, 'white');
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
      lfo(0.05, 300, bp.frequency, 600);
      const g = ctx.createGain(); g.gain.value = 0.5;
      n.connect(bp).connect(g).connect(out);
    } else if (key === 'fire') {
      const n = noiseSrc(ctx, 'brown');
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 450;
      n.connect(lp).connect(out);
      // crackles
      amb.timers.push(setInterval(() => {
        if (!amb.playing || out.gain.value < 0.01) return;
        for (let i = 0; i < Math.floor(rnd(0, 3)); i++) {
          const t = ctx.currentTime + rnd(0, 0.3);
          const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx, 'white');
          const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
          const g = ctx.createGain(); g.gain.setValueAtTime(rnd(0.2, 0.6), t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
          s.connect(hp).connect(g).connect(out); s.start(t); s.stop(t + 0.05);
        }
      }, 300));
    } else if (key === 'birds') {
      amb.timers.push(setInterval(() => {
        if (!amb.playing || out.gain.value < 0.01 || Math.random() < 0.55) return;
        const base = rnd(2200, 3600);
        const n = Math.floor(rnd(2, 5));
        for (let i = 0; i < n; i++) {
          const t = ctx.currentTime + i * rnd(0.09, 0.16);
          const o = ctx.createOscillator(); o.type = 'sine';
          o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * rnd(1.2, 1.6), t + 0.07);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
          o.connect(g).connect(out); o.start(t); o.stop(t + 0.1);
        }
      }, 900));
    } else if (key === 'brown') {
      const n = noiseSrc(ctx, 'brown');
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      n.connect(lp).connect(out);
    } else if (key === 'lofi') {
      // Mellow jazzy chords + vinyl crackle.
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
      lp.connect(out);
      const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
      let step = 0;
      const play = () => {
        if (!amb.playing) return;
        const t = ctx.currentTime + 0.05;
        chords[step % 4].forEach((note, i) => {
          const o = ctx.createOscillator(); o.type = 'triangle';
          o.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
          o.detune.value = rnd(-6, 6);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t + i * 0.03);
          g.gain.exponentialRampToValueAtTime(0.09, t + 0.25 + i * 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 2.35);
          o.connect(g).connect(lp); o.start(t); o.stop(t + 2.4);
        });
        step++;
      };
      amb.timers.push(setInterval(play, 2400));
      play();
      const crackle = noiseSrc(ctx, 'white');
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const cg = ctx.createGain(); cg.gain.value = 0.015;
      crackle.connect(hp).connect(cg).connect(out);
    }
    return out;
  }
  function ensureAmbient() {
    if (amb.ctx) return;
    amb.ctx = new AudioContext();
    amb.master = amb.ctx.createGain();
    amb.master.gain.value = 0.6;
    amb.master.connect(amb.ctx.destination);
  }
  function setAmbVolume(key, v) {
    D.settings.ambient = D.settings.ambient || {};
    D.settings.ambient[key] = v;
    save();
    if (!amb.playing) return;
    if (!amb.nodes[key] && v > 0) amb.nodes[key] = buildSound(key);
    if (amb.nodes[key]) amb.nodes[key].gain.setTargetAtTime(v / 100 * 0.8, amb.ctx.currentTime, 0.15);
  }
  async function toggleAmbient() {
    ensureAmbient();
    amb.playing = !amb.playing;
    if (amb.playing) {
      await amb.ctx.resume();
      const vols = D.settings.ambient || {};
      if (!Object.values(vols).some((v) => v > 0)) { D.settings.ambient = { ...vols, rain: 60 }; save(); }
      Object.entries(D.settings.ambient).forEach(([k, v]) => { if (v > 0) setAmbVolume(k, v); });
    } else {
      Object.values(amb.nodes).forEach((n) => n.gain.setTargetAtTime(0, amb.ctx.currentTime, 0.2));
      setTimeout(() => { if (!amb.playing) amb.ctx.suspend(); }, 600);
    }
    renderAmbient();
  }
  function renderAmbient() {
    const card = q('#w-ambient');
    if (!card || !D.settings.widgets.ambient) return;
    const vols = D.settings.ambient || {};
    card.innerHTML = '';
    const h = head('Suara latar', amb.playing ? '▶ diputar' : '');
    card.append(h);
    const play = mk('button', 'btn primary amb-play', amb.playing ? '⏸ Jeda' : '▶ Putar');
    play.type = 'button';
    play.onclick = toggleAmbient;
    card.append(play);
    AMB.forEach(([key, icon, name]) => {
      const row = mk('label', 'amb-row');
      const s = mk('input');
      s.type = 'range';
      s.min = '0';
      s.max = '100';
      s.value = String(vols[key] || 0);
      s.style.setProperty('--v', `${s.value}%`);
      s.oninput = () => { s.style.setProperty('--v', `${s.value}%`); setAmbVolume(key, +s.value); };
      row.append(mk('span', 'amb-name', `${icon} ${name}`), s);
      card.append(row);
    });
    card.append(mk('p', 'muted small', 'Campur beberapa suara sekaligus. Suara berhenti kalau tab ini ditutup.'));
  }

  /* =====================================================================
     Detailed weather (hourly, 7 days, air quality)
     ===================================================================== */
  const aqiLabel = (v) => (v <= 50 ? ['Baik', '#4ade80'] : v <= 100 ? ['Sedang', '#facc15'] : v <= 150 ? ['Tidak sehat (sensitif)', '#fb923c'] : v <= 200 ? ['Tidak sehat', '#f87171'] : ['Sangat tidak sehat', '#c084fc']);
  async function weatherDetail(card, data, geo) {
    if (!ui().weatherDetail || !data.hourly) return;
    const wrap = mk('div', 'wx-detail');
    // Next 12 hours: temperature line + icons.
    const now = Date.now();
    const start = data.hourly.time.findIndex((t) => new Date(t).getTime() >= now - 3600000);
    const hrs = Array.from({ length: 12 }, (_, i) => start + i).filter((i) => i >= 0 && i < data.hourly.time.length);
    if (hrs.length > 2) {
      const temps = hrs.map((i) => data.hourly.temperature_2m[i]);
      const min = Math.min(...temps), max = Math.max(...temps);
      const W = 300, H = 46;
      const pts = temps.map((t, i) => [(i / (temps.length - 1)) * W, H - 6 - ((t - min) / Math.max(1, max - min)) * (H - 14)]);
      const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      const svg = `<svg viewBox="-6 -4 ${W + 12} ${H + 8}" class="wx-spark" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.2" fill="var(--accent)"/>`).join('')}</svg>`;
      const box = mk('div', 'wx-hours');
      box.innerHTML = svg;
      const lbl = mk('div', 'wx-hour-lbl');
      hrs.forEach((i, k) => {
        if (k % 2) return;
        const d = new Date(data.hourly.time[i]);
        const c = mk('span');
        c.append(mk('b', null, `${Math.round(data.hourly.temperature_2m[i])}°`), mk('i', null, wmo(data.hourly.weather_code[i], 1)[0]), mk('small', null, `${pad2(d.getHours())}`));
        lbl.append(c);
      });
      box.append(lbl);
      wrap.append(mk('div', 'wx-sub', '12 jam ke depan'), box);
    }
    // 7 days
    const week = mk('div', 'wx-week');
    data.daily.time.forEach((t, i) => {
      if (i === 0) return;
      const d = new Date(t + 'T00:00');
      const row = mk('div', 'wx-wrow');
      const rain = data.daily.precipitation_probability_max?.[i];
      row.append(mk('span', 'wd', d.toLocaleDateString('id-ID', { weekday: 'short' })), mk('span', 'we', wmo(data.daily.weather_code[i])[0]),
        mk('span', 'wr', rain != null ? `☔${rain}%` : ''), mk('span', 'wt', `${Math.round(data.daily.temperature_2m_min[i])}° / ${Math.round(data.daily.temperature_2m_max[i])}°`));
      week.append(row);
    });
    wrap.append(mk('div', 'wx-sub', '7 hari'), week);
    // Air quality
    const aq = mk('div', 'wx-aqi', 'Kualitas udara: memuat…');
    wrap.append(aq);
    card.querySelector('.wx-days')?.remove();
    card.append(wrap);
    try {
      let c = await Store.get('qa-aqi');
      if (!c || c.lat !== geo.lat || Date.now() - c.at > 3600000) {
        const j = await fetchJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${geo.lat}&longitude=${geo.lon}&current=us_aqi,pm2_5`);
        c = { at: Date.now(), lat: geo.lat, aqi: j.current.us_aqi, pm: j.current.pm2_5 };
        await Store.set('qa-aqi', c);
      }
      const [label, color] = aqiLabel(c.aqi);
      aq.innerHTML = '';
      const dot = mk('i');
      dot.style.background = color;
      aq.append(dot, document.createTextNode(` Kualitas udara: ${label} (AQI ${Math.round(c.aqi)} · PM2.5 ${Math.round(c.pm)} µg/m³)`));
    } catch {
      aq.textContent = 'Kualitas udara: tidak tersedia';
    }
  }

  /* =====================================================================
     Sync between computers (chrome.storage.sync, ~100 KB limit)
     ===================================================================== */
  const SYNC_CHUNK = 7000;
  let syncTimer = 0;
  let lastPushed = '';
  let deviceId = '';
  function syncPayload() {
    const s = { ...D.settings };
    const payload = {
      groups: D.groups, shortcuts: D.shortcuts.map(({ hits, lastUsed, ...rest }) => rest), activeGroup: D.activeGroup,
      todos: D.todos, reminders: D.reminders, countdowns: D.countdowns, habits: D.habits, moods: D.moods,
      stickies: D.stickies, photoFavs: D.photoFavs, notes: D.notes, notesEnc: D.notesEnc, notesLock: D.notesLock,
      settings: s,
    };
    let json = JSON.stringify(payload);
    // Too big for Chrome's sync storage? Drop the least important parts.
    if (json.length > 90000) { delete payload.photoFavs; delete payload.moods; json = JSON.stringify(payload); }
    if (json.length > 90000) { payload.settings = { ...s, layoutProfiles: [] }; json = JSON.stringify(payload); }
    return json.length > 95000 ? null : json;
  }
  async function getDeviceId() {
    if (deviceId) return deviceId;
    deviceId = (await Store.get('qa-device')) || uid() + uid();
    await Store.set('qa-device', deviceId);
    return deviceId;
  }
  function syncSoon() {
    if (!isExt || !chrome.storage.sync || !D || !ui().sync) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncPush, 15000);
  }
  async function syncPush(manual) {
    if (!isExt || !chrome.storage.sync || !ui().sync) return;
    const json = syncPayload();
    const info = q('#set-sync-info');
    if (!json) { if (info) info.textContent = '⚠️ Data terlalu besar untuk sinkron (batas Chrome ±100 KB). Kurangi shortcut/catatan.'; return; }
    if (json === lastPushed && !manual) return;
    const n = Math.ceil(json.length / SYNC_CHUNK);
    const items = { 'qs-meta': { n, at: Date.now(), device: await getDeviceId() } };
    for (let i = 0; i < n; i++) items[`qs-${i}`] = json.slice(i * SYNC_CHUNK, (i + 1) * SYNC_CHUNK);
    try {
      await chrome.storage.sync.set(items);
      const old = await chrome.storage.sync.get(null);
      const stale = Object.keys(old).filter((k) => /^qs-\d+$/.test(k) && +k.slice(3) >= n);
      if (stale.length) await chrome.storage.sync.remove(stale);
      lastPushed = json;
      D.syncAt = items['qs-meta'].at;
      if (info) info.textContent = `✓ Tersinkron ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · ${(json.length / 1024).toFixed(1)} KB`;
      if (manual) toast('Data dikirim ke akun Google');
    } catch (e) {
      if (info) info.textContent = `⚠️ Gagal sinkron: ${e.message}`;
    }
  }
  async function syncPull(manual) {
    if (!isExt || !chrome.storage.sync || !ui().sync) return false;
    try {
      const all = await chrome.storage.sync.get(null);
      const meta = all['qs-meta'];
      if (!meta || !meta.n) { if (manual) syncPush(true); return false; }
      const mine = await getDeviceId();
      if (!manual && (meta.device === mine || meta.at <= (D.syncAt || 0))) return false;
      let json = '';
      for (let i = 0; i < meta.n; i++) json += all[`qs-${i}`] || '';
      const remote = JSON.parse(json);
      const keepLocal = { layout: D.settings.layout, wallpaper: D.settings.wallpaper, ui: { ...D.settings.ui } };
      const merged = merge({ ...D, ...remote, settings: { ...remote.settings } });
      // Keep this computer's own screen layout and media; everything else comes from the other device.
      merged.settings.layout = keepLocal.layout;
      merged.syncAt = meta.at;
      D = merged;
      lastPushed = json;
      persistNow();
      renderAll();
      toast('⟳ Data disinkron dari perangkat lain');
      return true;
    } catch (e) {
      console.warn('sync pull', e);
      return false;
    }
  }
  if (isExt && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((ch, area) => {
      if (area === 'sync' && ch['qs-meta'] && D && ui().sync) syncPull();
    });
  }

  /* =====================================================================
     Settings bindings for the extras
     ===================================================================== */
  function fillSettings() {
    if (!D || !q('#set-cardstyle')) return;
    const u = ui();
    const seg = (id, v) => qa(`${id} button`).forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
    seg('#set-cardstyle', u.cardStyle);
    seg('#set-motion', u.motion);
    seg('#set-cursor', u.cursor);
    q('#set-glass').value = u.glass;
    q('#set-glass-val').textContent = `${u.glass}%`;
    q('#set-radius').value = u.radius;
    q('#set-radius-val').textContent = `${u.radius}px`;
    q('#set-font').value = u.font;
    q('#set-season').value = u.season;
    q('#set-season-pet').checked = u.seasonPet !== false;
    q('#set-dailyphoto').checked = !!u.dailyPhoto;
    q('#set-photofav-random').checked = !!u.photoFavRandom;
    q('#set-photo-box').hidden = !u.dailyPhoto;
    q('#set-calc').checked = u.calc !== false;
    q('#set-stickies').checked = !!u.stickies;
    q('#set-weatherdetail').checked = !!u.weatherDetail;
    q('#set-sync').checked = !!u.sync;
    q('#set-sync-now').hidden = !u.sync || !isExt;
    if (!isExt) q('#set-sync-info').textContent = 'Sinkron hanya bisa dipakai setelah dipasang sebagai ekstensi Chrome.';
    const favs = q('#set-photo-favs');
    favs.innerHTML = '';
    (D.photoFavs || []).forEach((f) => {
      const t = mk('div', 'pf-thumb');
      t.style.backgroundImage = `url("${f.url}")`;
      t.title = f.title || f.copyright || '';
      const x = mk('button', null, '✕');
      x.type = 'button';
      x.title = 'Hapus dari favorit';
      x.onclick = () => { D.photoFavs = D.photoFavs.filter((p) => p !== f); save(); fillSettings(); };
      t.onclick = (e) => { if (e.target === x) return; photo = { ...f, fav: true }; applyDailyPhoto(); };
      t.append(x);
      favs.append(t);
    });
    if (!(D.photoFavs || []).length) favs.append(mk('span', 'muted small', 'Belum ada. Klik 🤍 di pojok kiri bawah layar untuk menyimpan foto.'));
    Store.get('qa-video').then((v) => { const i = q('#set-video-info'); if (i) i.textContent = v ? '✓ Video terpasang' : 'Belum ada video'; });
  }
  function bindSettings() {
    const seg = (id, key, after) => qa(`${id} button`).forEach((b) => b.addEventListener('click', () => { ui()[key] = b.dataset.v; save(); applyLook(); fillSettings(); after && after(b.dataset.v); }));
    seg('#set-cardstyle', 'cardStyle');
    seg('#set-motion', 'motion', (v) => { if (v === 'video') Store.get('qa-video').then((x) => { if (!x) toast('Unggah video dulu (MP4)'); }); });
    seg('#set-cursor', 'cursor');
    q('#set-glass').addEventListener('input', (e) => { ui().glass = +e.target.value; q('#set-glass-val').textContent = `${e.target.value}%`; save(); applyLook(); });
    q('#set-radius').addEventListener('input', (e) => { ui().radius = +e.target.value; q('#set-radius-val').textContent = `${e.target.value}px`; save(); applyLook(); if (typeof applyLayout === 'function') applyLayout(); });
    q('#set-font').addEventListener('change', (e) => { ui().font = e.target.value; save(); applyLook(); });
    q('#set-season').addEventListener('change', (e) => { ui().season = e.target.value; save(); seasonDrawn = ''; applySeason(); window.QAPet?.apply(); });
    q('#set-season-pet').addEventListener('change', (e) => { ui().seasonPet = e.target.checked; save(); window.QAPet?.apply(); });
    q('#set-dailyphoto').addEventListener('change', async (e) => {
      ui().dailyPhoto = e.target.checked;
      save();
      if (!e.target.checked) { applyTheme(); }
      await applyDailyPhoto();
      if (e.target.checked && !photo) toast('Tidak bisa memuat foto harian. Cek koneksi internet.');
      fillSettings();
    });
    q('#set-photofav-random').addEventListener('change', (e) => { ui().photoFavRandom = e.target.checked; save(); photo = null; applyDailyPhoto(); });
    q('#set-video-file').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 60 * 1024 * 1024) { toast('Video terlalu besar (maks 60 MB)'); return; }
      const r = new FileReader();
      r.onload = async () => {
        await Store.set('qa-video', r.result);
        if (bgfx.videoUrl) URL.revokeObjectURL(bgfx.videoUrl);
        bgfx.videoUrl = null;
        ui().motion = 'video';
        save();
        applyLook();
        fillSettings();
        toast('Video wallpaper dipasang');
      };
      r.readAsDataURL(f);
      e.target.value = '';
    });
    q('#set-calc').addEventListener('change', (e) => { ui().calc = e.target.checked; save(); });
    q('#set-stickies').addEventListener('change', (e) => { ui().stickies = e.target.checked; save(); applyLook(); renderStickies(); });
    q('#set-sticky-add').addEventListener('click', () => { closeDrawer(); addSticky(''); });
    q('#btn-sticky').addEventListener('click', () => addSticky(''));
    q('#btn-palette').addEventListener('click', openPalette);
    q('#set-weatherdetail').addEventListener('change', (e) => { ui().weatherDetail = e.target.checked; save(); loadWidgets(); });
    q('#set-sync').addEventListener('change', async (e) => {
      ui().sync = e.target.checked;
      save();
      fillSettings();
      if (e.target.checked) { const pulled = await syncPull(true); if (!pulled) syncPush(true); }
    });
    q('#set-sync-now').addEventListener('click', async () => { const pulled = await syncPull(true); if (!pulled) syncPush(true); });
  }

  /* =====================================================================
     Public API used by app.js
     ===================================================================== */
  function renderWidget(k) {
    if (k === 'habits') renderHabits();
    else if (k === 'stats') renderStats();
    else if (k === 'mood') renderMood();
    else if (k === 'finance') renderFinance();
    else if (k === 'ambient') renderAmbient();
  }
  let inited = false;
  window.QAX = {
    init() {
      if (inited) return;
      inited = true;
      setupSettingsUi();
      bindSettings();
      applyLook();
      renderStickies();
      ['habits', 'stats', 'mood', 'finance', 'ambient'].forEach(renderWidget);
      if (ui().sync) setTimeout(() => syncPull(), 800);
    },
    renderAll() {
      if (!inited) return;
      applyLook();
      renderStickies();
      ['habits', 'stats', 'mood', 'ambient'].forEach(renderWidget);
    },
    applyLook,
    fillSettings,
    renderWidget,
    showTab,
    calc,
    weatherDetail,
    seasonCostume,
    currentSeason,
    syncSoon,
    openPalette,
    addSticky,
    renderStats,
  };
})();
