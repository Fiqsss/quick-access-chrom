'use strict';

/* ================= Helpers ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, '0');
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayKey = (d = new Date()) => ymd(d);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

// chrome.storage when running as an extension, localStorage otherwise (preview).
const hasChrome = typeof chrome !== 'undefined' && !!(chrome.storage && chrome.storage.local);
const Store = {
  async get(k) {
    if (hasChrome) return (await chrome.storage.local.get(k))[k];
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : undefined; } catch { return undefined; }
  },
  async set(k, v) {
    if (hasChrome) return chrome.storage.local.set({ [k]: v });
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { toast('Penyimpanan penuh'); }
  },
  async remove(k) {
    if (hasChrome) return chrome.storage.local.remove(k);
    try { localStorage.removeItem(k); } catch {}
  },
};

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

/* ================= Constants ================= */
const WALLS = {
  aurora:   { bg: 'linear-gradient(135deg,#0b1026 0%,#151b3f 50%,#0b1a2a 100%)', blobs: ['#6d5dfc', '#18c8b0', '#c850c0'] },
  sunset:   { bg: 'linear-gradient(160deg,#1a0b2e 0%,#3b0f3a 55%,#4a1a1a 100%)', blobs: ['#ff6a5c', '#ffb347', '#d6336c'] },
  ocean:    { bg: 'linear-gradient(160deg,#021526 0%,#03346e 60%,#052e45 100%)', blobs: ['#2ea7ff', '#00d4c8', '#5b5bff'] },
  forest:   { bg: 'linear-gradient(160deg,#07140f 0%,#0f2b1f 60%,#132a13 100%)', blobs: ['#3ddc84', '#a3e635', '#14b8a6'] },
  rose:     { bg: 'linear-gradient(160deg,#1f0a17 0%,#3d1030 60%,#2a0c22 100%)', blobs: ['#ff7eb3', '#ff758c', '#a855f7'] },
  midnight: { bg: 'linear-gradient(160deg,#050507 0%,#111118 60%,#0a0a10 100%)', blobs: ['#4b5563', '#6366f1', '#1f2937'] },
  sakura:   { bg: 'linear-gradient(160deg,#2a1020 0%,#4a1f3a 55%,#2b1430 100%)', blobs: ['#ffb7d5', '#f472b6', '#fda4af'] },
  coffee:   { bg: 'linear-gradient(160deg,#1c120c 0%,#3a2416 55%,#24170f 100%)', blobs: ['#d4a373', '#fbbf24', '#b45309'] },
  ramadan:  { bg: 'linear-gradient(160deg,#03201f 0%,#0b3b3a 55%,#062625 100%)', blobs: ['#14b8a6', '#fbbf24', '#0e7490'] },
  sunrise:  { bg: 'linear-gradient(160deg,#2b1638 0%,#6e3348 55%,#a75a34 100%)', blobs: ['#fdba74', '#fca5a5', '#fde68a'] },
  lavender: { bg: 'linear-gradient(160deg,#1a1430 0%,#2f2552 55%,#1e1838 100%)', blobs: ['#c4b5fd', '#a78bfa', '#f0abfc'] },
  daylight: { bg: 'linear-gradient(160deg,#0c3563 0%,#1b5f9e 55%,#164e84 100%)', blobs: ['#7dd3fc', '#fde68a', '#60a5fa'] },
};
const ACCENTS = ['#8b9dff', '#5eead4', '#fbbf24', '#f472b6', '#a78bfa', '#4ade80', '#fb923c', '#38bdf8'];
const ENGINES = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  youtube: 'https://www.youtube.com/results?search_query=',
};
const ENGINE_NAMES = { google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo', youtube: 'YouTube' };
const BANGS = {
  '!y': ENGINES.youtube,
  '!g': ENGINES.google,
  '!gh': 'https://github.com/search?q=',
  '!w': 'https://id.wikipedia.org/w/index.php?search=',
  '!m': 'https://www.google.com/maps/search/',
  '!tr': 'https://translate.google.com/?sl=auto&tl=id&text=',
};
const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jumadilawal', 'Jumadilakhir', 'Rajab', 'Syakban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah'];
// Short, uplifting verses: [surah, ayah, Indonesian surah name]
const AYAHS = [
  [94, 5, 'Al-Insyirah'], [94, 6, 'Al-Insyirah'], [2, 286, 'Al-Baqarah'], [2, 153, 'Al-Baqarah'], [13, 28, "Ar-Ra'd"],
  [65, 3, 'At-Talaq'], [3, 139, 'Ali Imran'], [2, 152, 'Al-Baqarah'], [39, 53, 'Az-Zumar'], [40, 60, 'Gafir'],
  [2, 186, 'Al-Baqarah'], [29, 69, 'Al-Ankabut'], [8, 46, 'Al-Anfal'], [3, 159, 'Ali Imran'], [49, 13, 'Al-Hujurat'],
  [20, 114, 'Taha'], [3, 200, 'Ali Imran'], [64, 16, 'At-Tagabun'], [2, 45, 'Al-Baqarah'], [12, 87, 'Yusuf'],
  [47, 7, 'Muhammad'], [2, 216, 'Al-Baqarah'], [9, 51, 'At-Taubah'], [65, 2, 'At-Talaq'], [33, 41, 'Al-Ahzab'],
  [62, 10, "Al-Jumu'ah"], [99, 7, 'Az-Zalzalah'], [2, 261, 'Al-Baqarah'], [14, 7, 'Ibrahim'], [16, 97, 'An-Nahl'],
  [28, 77, 'Al-Qasas'], [93, 4, 'Ad-Duha'], [93, 5, 'Ad-Duha'], [55, 60, 'Ar-Rahman'], [4, 28, "An-Nisa'"],
];
const FREQ = '__freq';
const WIDGETS = {
  weather: 'Cuaca', music: 'Musik', prayer: 'Jadwal sholat', pomo: 'Pomodoro', calendar: 'Kalender',
  countdown: 'Hitung mundur', reminders: 'Pengingat', todo: 'Tugas', notes: 'Catatan',
  habits: 'Kebiasaan', stats: 'Statistik fokus', mood: 'Mood', finance: 'Kurs & emas', ambient: 'Suara latar',
};
// Everything on the page is a block on a free grid: COLS columns wide, rows of ROW px.
const BLOCKS = { clock: 'Jam & sapaan', ayah: 'Ayat harian', search: 'Pencarian', shortcuts: 'Shortcut', ...WIDGETS };
const COLS = 24;
const ROW = 22;
const GAP = 14;
function defaultLayout() {
  const it = (x, y, w, h, auto = true) => ({ x, y, w, h, auto });
  return {
    v: 3, tile: 'm', grid: true,
    items: {
      clock: it(3, 0, 12, 9, false),
      ayah: it(3, 9, 12, 4),
      search: it(3, 13, 12, 5),
      shortcuts: it(1, 18, 16, 16),
      weather: it(18, 0, 6, 12),
      music: it(18, 12, 6, 11),
      prayer: it(18, 23, 6, 20),
      reminders: it(18, 43, 6, 9),
      pomo: it(0, 35, 6, 17),
      calendar: it(6, 35, 6, 18),
      countdown: it(12, 35, 6, 8),
      todo: it(12, 43, 6, 8),
      notes: it(0, 53, 6, 10),
      habits: it(12, 52, 6, 12),
      stats: it(18, 53, 6, 12),
      mood: it(0, 64, 6, 14),
      finance: it(6, 64, 6, 11),
      ambient: it(12, 65, 6, 15),
    },
  };
}

function defaults() {
  const g1 = uid(), g2 = uid(), g3 = uid();
  const sc = (group, name, url) => ({ id: uid(), group, name, url, icon: '' });
  return {
    v: 2,
    settings: {
      name: 'Nur', city: 'Jakarta',
      clockStyle: 'digital', h24: true, seconds: true,
      wallpaper: 'aurora', dim: 20, blur: 0, accent: ACCENTS[0],
      engine: 'google', openNewTab: false, searchHistory: true, showFrequent: true,
      sound: true, volume: 80,
      azan: { enabled: true, Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true, before: 0 },
      azanSound: 'chime', azanFileName: '',
      pomo: { work: 25, short: 5, long: 15, every: 4, auto: false },
      layout: defaultLayout(),
      layoutProfiles: [], activeProfile: null,
      theme: 'aurora', autoTheme: false, weatherFx: true,
      musicLyrics: false, musicQueue: false, musicViz: false,
      ui: {
        cardStyle: 'glass', glass: 7, radius: 22, font: 'outfit', motion: 'none', cursor: 'off',
        season: 'auto', seasonPet: true, dailyPhoto: false, photoFavRandom: false, calc: true,
        stickies: false, weatherDetail: false, sync: false,
      },
      ambient: {},
      pet: {
        enabled: true, type: 'cat', name: 'Mochi', size: 'm', activity: 'normal', bubbles: true, sound: true, accessory: 'none',
        second: { enabled: false, type: 'dog', name: 'Kopi', accessory: 'none' },
      },
      searchMode: 'web',
      translate: { target: 'id' },
      widgets: {
        clock: true, search: true, shortcuts: true,
        ayah: true, weather: true, music: true, prayer: true, pomo: true, calendar: true,
        countdown: true, reminders: true, todo: true, notes: true,
        habits: false, stats: false, mood: false, finance: false, ambient: false,
      },
    },
    groups: [{ id: g1, name: 'Favorit' }, { id: g2, name: 'Kerja' }, { id: g3, name: 'Hiburan' }],
    activeGroup: g1,
    shortcuts: [
      sc(g1, 'Google', 'https://www.google.com'),
      sc(g1, 'Gmail', 'https://mail.google.com'),
      sc(g1, 'YouTube', 'https://www.youtube.com'),
      sc(g1, 'WhatsApp', 'https://web.whatsapp.com'),
      sc(g1, 'Claude', 'https://claude.ai'),
      sc(g1, 'Drive', 'https://drive.google.com'),
      sc(g2, 'Hostinger Mail', 'https://mail.hostinger.com'),
      sc(g2, 'GitHub', 'https://github.com'),
      sc(g2, 'Docs', 'https://docs.google.com'),
      sc(g2, 'Calendar', 'https://calendar.google.com'),
      sc(g3, 'Steam', 'steam://open/main'),
      sc(g3, 'Spotify', 'https://open.spotify.com'),
      sc(g3, 'Instagram', 'https://www.instagram.com'),
      sc(g3, 'Netflix', 'https://www.netflix.com'),
    ],
    todos: [],
    reminders: [
      { id: uid(), text: 'Minum air dulu 💧', type: 'interval', every: 60, from: '08:00', to: '21:00', enabled: false },
    ],
    countdowns: [],
    habits: [],
    moods: {},
    stickies: [],
    photoFavs: [],
    notes: '',
  };
}

function merge(saved) {
  const d = defaults();
  if (!saved || !Array.isArray(saved.groups) || !Array.isArray(saved.shortcuts)) return d;
  const out = { ...d, ...saved };
  const ss = saved.settings || {};
  out.settings = { ...d.settings, ...ss };
  out.settings.widgets = { ...d.settings.widgets, ...(ss.widgets || {}) };
  out.settings.azan = { ...d.settings.azan, ...(ss.azan || {}) };
  out.settings.pomo = { ...d.settings.pomo, ...(ss.pomo || {}) };
  // Free-grid layout (v3). Older panel/zone layouts can't be mapped onto it, so they start from the default.
  out.settings.layout = ss.layout && ss.layout.items
    ? { ...d.settings.layout, ...ss.layout, items: { ...d.settings.layout.items, ...ss.layout.items } }
    : d.settings.layout;
  out.settings.ui = { ...d.settings.ui, ...(ss.ui || {}) };
  if (!Array.isArray(saved.habits)) out.habits = [];
  if (!Array.isArray(saved.stickies)) out.stickies = [];
  if (!Array.isArray(saved.photoFavs)) out.photoFavs = [];
  if (!saved.moods || typeof saved.moods !== 'object') out.moods = {};
  out.settings.pet = { ...d.settings.pet, ...(ss.pet || {}) };
  out.settings.pet.second = { ...d.settings.pet.second, ...((ss.pet || {}).second || {}) };
  out.settings.translate = { ...d.settings.translate, ...(ss.translate || {}) };
  if (out.settings.searchMode !== 'translate') out.settings.searchMode = 'web'; // the old AI mode is gone
  delete out.settings.ai;
  if (!Array.isArray(saved.reminders)) out.reminders = d.reminders;
  if (!Array.isArray(saved.countdowns)) out.countdowns = [];
  if (!Array.isArray(saved.todos)) out.todos = [];
  if (!out.groups.length) out.groups = d.groups.slice(0, 1);
  if (out.activeGroup !== FREQ && !out.groups.some((g) => g.id === out.activeGroup)) out.activeGroup = out.groups[0].id;
  return out;
}

/* ================= State + saving ================= */
let D;
let customWall = null;
let query = '';
let saveTimer;
const ownWrites = []; // JSON of our recent writes, to tell them apart from other tabs' writes

function rememberWrite(js) {
  ownWrites.push(js);
  if (ownWrites.length > 12) ownWrites.shift();
}
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, 150);
}
function persistNow() {
  clearTimeout(saveTimer);
  window.QAX?.syncSoon();
  const js = JSON.stringify(D);
  rememberWrite(js);
  return Store.set('qa-data', JSON.parse(js));
}

/* ================= Theme ================= */
function applyTheme() {
  const s = D.settings;
  document.documentElement.style.setProperty('--accent', s.accent);
  const w = WALLS[s.wallpaper] || WALLS.aurora;
  const useImg = s.wallpaper === 'custom' && customWall;
  $('#bg').style.background = useImg ? '#0b0f1e' : w.bg;
  $$('.blob').forEach((b, i) => {
    b.style.background = w.blobs[i];
    b.style.display = useImg ? 'none' : '';
  });
  const img = $('#bg-img');
  img.classList.toggle('on', !!useImg);
  img.style.backgroundImage = useImg ? `url("${customWall}")` : '';
  img.style.filter = s.blur ? `blur(${s.blur}px)` : '';
  $('#bg-dim').style.background = `rgba(0,0,0,${s.dim / 100})`;

  applyLayout();
  window.QAX?.applyLook();
}

/* ================= Layout: free drag & resize grid ================= */
let editingLayout = false;
let boardMode = 'grid'; // 'stack' on narrow screens (blocks simply stacked)
let drag = null;
const blockEl = (k) => $(`.blk[data-b="${k}"]`);
// Focus mode shows a temporary arrangement of just the clock, search and pomodoro (nothing is saved).
let focusMode = false;
let focusItems = null;
const FOCUS_KEYS = ['clock', 'search', 'pomo'];
const curItems = () => (focusMode ? focusItems : D.settings.layout.items);
const isShown = (k) => (focusMode ? FOCUS_KEYS.includes(k) : D.settings.widgets[k] !== false);
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function boardMetrics() {
  const W = $('#board').clientWidth;
  return { W, colW: (W + GAP) / COLS };
}
function toPx(it, m) {
  return { left: it.x * m.colW, top: it.y * ROW, width: it.w * m.colW - GAP, height: it.h * ROW - GAP };
}

// Keep every block's position valid; blocks without a saved position go below everything else.
function ensureItems() {
  const L = D.settings.layout;
  const def = defaultLayout().items;
  let bottom = Math.max(0, ...Object.values(L.items).map((i) => (+i.y || 0) + (+i.h || 0)));
  for (const k of Object.keys(BLOCKS)) {
    let it = L.items[k];
    if (!it || !Number.isFinite(+it.x) || !Number.isFinite(+it.y)) {
      it = L.items[k] = { ...def[k], y: bottom };
      bottom += it.h;
    }
    it.k = k;
    it.w = Math.max(2, Math.min(COLS, Math.round(+it.w) || 6));
    it.h = Math.max(2, Math.round(+it.h) || 6);
    it.x = Math.max(0, Math.min(COLS - it.w, Math.round(+it.x) || 0));
    it.y = Math.max(0, Math.round(+it.y) || 0);
    if (k === 'clock') it.auto = false; // the clock scales to its box, so its height is always manual
  }
  for (const k of Object.keys(L.items)) if (!BLOCKS[k]) delete L.items[k];
}

function shownItems(items = curItems()) {
  return Object.keys(BLOCKS).filter(isShown).map((k) => items[k]);
}

// Push blocks down until nothing overlaps. `fixedKey` (the block being moved) keeps its spot.
function resolve(list, fixedKey) {
  const fixed = list.find((i) => i.k === fixedKey);
  const placed = fixed ? [fixed] : [];
  const rest = list.filter((i) => i !== fixed).sort((a, b) => a.y - b.y || a.x - b.x);
  for (const it of rest) {
    for (let guard = 0; guard < 500; guard++) {
      const hits = placed.filter((p) => overlaps(it, p));
      if (!hits.length) break;
      it.y = Math.max(...hits.map((p) => p.y + p.h));
    }
    placed.push(it);
  }
}

// Move everything up as far as possible (closes empty gaps).
function compact() {
  const list = shownItems().sort((a, b) => a.y - b.y || a.x - b.x);
  const placed = [];
  for (const it of list) {
    while (it.y > 0 && !placed.some((p) => overlaps({ ...it, y: it.y - 1 }, p))) it.y--;
    placed.push(it);
  }
}

function initBlocks() {
  $$('#board .blk').forEach((node) => {
    const k = node.dataset.b;
    const edit = el('div', 'blk-edit');
    const bar = el('div', 'blk-bar');
    bar.append(el('span', 'grip', '⠿'), el('span', 'nm', BLOCKS[k] || k));
    if (k !== 'clock') {
      const auto = el('button', 'blk-auto', '↕');
      auto.type = 'button';
      auto.title = 'Tinggi otomatis (ikuti isi)';
      auto.onclick = (e) => {
        e.stopPropagation();
        const it = D.settings.layout.items[k];
        it.auto = !it.auto;
        if (it.auto) measureBlock(k, true);
        save();
        applyLayout();
      };
      bar.append(auto);
    }
    const eye = el('button', 'blk-hide', '👁');
    eye.type = 'button';
    eye.title = 'Sembunyikan';
    eye.onclick = (e) => { e.stopPropagation(); setWidget(k, false); };
    bar.append(eye);
    const handle = el('div', 'blk-resize');
    handle.title = 'Tarik untuk mengubah ukuran';
    edit.append(bar, handle);
    node.append(edit);
    edit.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      startDrag(e, k, e.target === handle ? 'resize' : 'move');
    });
  });
}
// Start following content height only once blocks have their real size (called after the first layout).
let settleUntil = 0;
function startMeasuring() {
  settleUntil = Date.now() + 4000;
  $$('#board .blk').forEach((node) => new ResizeObserver(() => measureBlock(node.dataset.b)).observe($('.blk-inner', node)));
  // After the settle period, apply any shrinking that was held back.
  setTimeout(() => Object.keys(BLOCKS).forEach((k) => measureBlock(k)), 4100);
}

// Auto-height blocks follow their content; blocks below them shift by the same amount.
let measureTimer;
function measureBlock(k, force) {
  if (!D || boardMode !== 'grid' || drag || !settleUntil) return;
  const it = curItems()[k];
  if (!it || !it.auto || !isShown(k)) return;
  const inner = $('.blk-inner', blockEl(k));
  const need = Math.max(2, Math.ceil((inner.offsetHeight + GAP) / ROW));
  if (need === it.h && !force) return;
  // Right after opening, widgets show "Memuat…" for a moment: only let them grow then, never shrink.
  if (!force && need < it.h && Date.now() < settleUntil) return;
  const delta = need - it.h;
  const oldBottom = it.y + it.h;
  for (const o of shownItems()) {
    if (o === it || o.y < oldBottom) continue;
    if (o.x < it.x + it.w && it.x < o.x + o.w) o.y = Math.max(it.y + need, o.y + delta);
  }
  it.h = need;
  resolve(shownItems(), k);
  clearTimeout(measureTimer);
  if (!focusMode) measureTimer = setTimeout(() => { save(); }, 400);
  applyLayout();
}

function applyLayout() {
  if (!D || !$('#board .blk-edit')) return;
  ensureItems();
  const L = D.settings.layout;
  const root = document.documentElement.style;
  const tile = { s: [88, 40], m: [108, 50], l: [132, 62] }[L.tile] || [108, 50];
  root.setProperty('--tile-min', `${tile[0]}px`);
  root.setProperty('--ico', `${tile[1]}px`);

  const board = $('#board');
  const m = boardMetrics();
  boardMode = m.W < 760 ? 'stack' : 'grid';
  board.classList.toggle('stack', boardMode === 'stack');
  board.classList.toggle('editing', editingLayout && boardMode === 'grid');
  board.classList.toggle('gridlines', editingLayout && boardMode === 'grid' && L.grid !== false);
  board.style.setProperty('--col-w', `${m.colW}px`);
  board.style.setProperty('--row-h', `${ROW}px`);

  let bottom = 0;
  for (const k of Object.keys(BLOCKS)) {
    const node = blockEl(k);
    if (!node) continue;
    const it = curItems()[k];
    const shown = !!it && isShown(k);
    node.hidden = !shown;
    if (!shown) continue;
    node.classList.toggle('auto', !!it.auto);
    node.classList.toggle('fixed', !it.auto);
    $('.blk-auto', node)?.classList.toggle('on', !!it.auto);
    if (!shown) continue;
    if (boardMode === 'grid') {
      if (!(drag && drag.k === k)) {
        const p = toPx(it, m);
        Object.assign(node.style, { left: `${p.left}px`, top: `${p.top}px`, width: `${p.width}px`, height: `${p.height}px`, order: '' });
      }
      bottom = Math.max(bottom, it.y + it.h);
    } else {
      Object.assign(node.style, { left: '', top: '', width: '', height: '', order: String(it.y * 100 + it.x) });
    }
  }
  board.style.height = boardMode === 'grid' ? `${bottom * ROW + (editingLayout ? 10 * ROW : 0)}px` : '';
  renderHiddenChips();
}

/* ---- Drag to move / resize ---- */
function startDrag(e, k, mode) {
  if (boardMode !== 'grid') return;
  e.preventDefault();
  const m = boardMetrics();
  const L = D.settings.layout;
  const node = blockEl(k);
  const it = L.items[k];
  drag = {
    k, mode, m, node,
    snap: JSON.parse(JSON.stringify(L.items)),
    sx: e.pageX, sy: e.pageY,
    start: toPx(it, m),
    target: { x: it.x, y: it.y, w: it.w, h: it.h },
    result: null,
    pointerId: e.pointerId,
  };
  node.classList.add('dragging');
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} // keeps events coming if the pointer leaves the window
  showGhost(drag.target);
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd, { once: true });
  window.addEventListener('pointercancel', onDragEnd, { once: true });
}
function showGhost(t) {
  const g = $('#drop-ghost');
  const p = toPx(t, drag.m);
  Object.assign(g.style, { left: `${p.left}px`, top: `${p.top}px`, width: `${p.width}px`, height: `${p.height}px` });
  g.hidden = false;
}
function onDragMove(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const { m, start, node } = drag;
  const dx = e.pageX - drag.sx, dy = e.pageY - drag.sy;
  const cur = drag.snap[drag.k];
  let t;
  if (drag.mode === 'move') {
    const left = start.left + dx, top = Math.max(0, start.top + dy);
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
    t = { x: Math.max(0, Math.min(COLS - cur.w, Math.round(left / m.colW))), y: Math.max(0, Math.round(top / ROW)), w: cur.w, h: cur.h };
  } else {
    const width = Math.max(2 * m.colW - GAP, start.width + dx);
    const height = Math.max(2 * ROW - GAP, start.height + dy);
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    t = { x: cur.x, y: cur.y, w: Math.max(2, Math.min(COLS - cur.x, Math.round((width + GAP) / m.colW))), h: Math.max(2, Math.round((height + GAP) / ROW)) };
  }
  // Scroll the page when dragging near the top/bottom edge.
  if (e.clientY > window.innerHeight - 50) window.scrollBy(0, 14);
  else if (e.clientY < 50) window.scrollBy(0, -14);

  const same = t.x === drag.target.x && t.y === drag.target.y && t.w === drag.target.w && t.h === drag.target.h;
  if (same && drag.result) return;
  drag.target = t;
  // Preview: start from the positions at drag start, place the block, push the others away.
  const items = JSON.parse(JSON.stringify(drag.snap));
  Object.assign(items[drag.k], t);
  if (drag.mode === 'resize') items[drag.k].auto = false;
  resolve(shownItems(items), drag.k);
  drag.result = items;
  let bottom = 0;
  for (const it of shownItems(items)) {
    bottom = Math.max(bottom, it.y + it.h);
    if (it.k === drag.k) continue;
    const p = toPx(it, m);
    Object.assign(blockEl(it.k).style, { left: `${p.left}px`, top: `${p.top}px`, width: `${p.width}px`, height: `${p.height}px` });
  }
  $('#board').style.height = `${(bottom + 10) * ROW}px`;
  showGhost(t);
}
function onDragEnd() {
  window.removeEventListener('pointermove', onDragMove);
  if (!drag) return;
  const { node, result } = drag;
  node.classList.remove('dragging');
  $('#drop-ghost').hidden = true;
  if (result) {
    for (const k of Object.keys(result)) Object.assign(D.settings.layout.items[k], result[k]);
    save();
  }
  drag = null;
  applyLayout();
}

/* ---- Showing / hiding blocks ---- */
function setWidget(k, on) {
  const was = D.settings.widgets[k] !== false;
  D.settings.widgets[k] = on;
  if (on && !was && D.settings.layout.items[k]) {
    // Coming back: keep its old spot if it is free, otherwise put it at the bottom.
    const it = D.settings.layout.items[k];
    const others = shownItems().filter((o) => o !== it);
    if (others.some((o) => overlaps(it, o))) it.y = Math.max(0, ...others.map((o) => o.y + o.h));
  }
  save();
  applyTheme();
  if (on && !was) loadBlock(k);
  if ($('#drawer').classList.contains('open')) fillSettings();
}
function renderHiddenChips() {
  const box = $('#lb-hidden');
  if (!box) return;
  box.innerHTML = '';
  const hidden = Object.keys(BLOCKS).filter((k) => !isShown(k));
  if (!hidden.length) { box.append(el('span', 'muted small', 'Tidak ada — semua blok tampil.')); return; }
  hidden.forEach((k) => {
    const b = el('button', 'chip-btn', `+ ${BLOCKS[k]}`);
    b.type = 'button';
    b.onclick = () => setWidget(k, true);
    box.append(b);
  });
}

/* ---- Edit mode + toolbar ---- */
function syncLayoutBar() {
  const L = D.settings.layout;
  const seg = (id, v) => $$(`${id} button`).forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
  seg('#lb-tile', L.tile);
  seg('#lb-gridlines', L.grid === false ? 'off' : 'on');
  renderHiddenChips();
  renderPresetChips();
}
function setEditLayout(on) {
  if (on && focusMode) setFocusMode(false, true);
  if (on && boardMetrics().W < 760) { toast('Perbesar jendela browser dulu untuk mengatur tata letak'); return; }
  editingLayout = on;
  document.body.classList.toggle('editing', on);
  $('#layout-bar').hidden = !on;
  if (on) { closeDrawer(); closeTrPanel(); syncLayoutBar(); }
  applyLayout();
}
function bindSeg(id, apply) {
  $$(`${id} button`).forEach((b) => b.addEventListener('click', () => {
    apply(b.dataset.v);
    save();
    applyLayout();
    syncLayoutBar();
  }));
}
bindSeg('#lb-tile', (v) => { D.settings.layout.tile = v; });
bindSeg('#lb-gridlines', (v) => { D.settings.layout.grid = v === 'on'; });
$('#lb-compact').addEventListener('click', () => {
  compact();
  save();
  applyLayout();
  toast('Ruang kosong dirapikan');
});
$('#lb-reset').addEventListener('click', () => {
  if (!confirm('Kembalikan semua posisi dan ukuran blok ke awal?')) return;
  D.settings.layout = defaultLayout();
  save();
  applyLayout();
  syncLayoutBar();
  Object.keys(BLOCKS).forEach((k) => measureBlock(k, true));
  toast('Tata letak dikembalikan ke awal');
});
$('#lb-done').addEventListener('click', () => { setEditLayout(false); toast('Tata letak disimpan'); });
/* ---- Templates & saved arrangements ---- */
const T = (x, y, w, h, auto = true) => ({ x, y, w, h, auto });
const onlyBlocks = (keys) => Object.fromEntries(Object.keys(BLOCKS).map((k) => [k, keys.includes(k)]));
const allBlocks = () => onlyBlocks(Object.keys(BLOCKS));
const LAYOUT_TEMPLATES = {
  klasik: {
    name: 'Klasik', icon: '🏠', desc: 'Jam di tengah, widget di kanan dan bawah',
    make: () => ({ items: defaultLayout().items, show: allBlocks() }),
  },
  minimalis: {
    name: 'Minimalis', icon: '🤍', desc: 'Hanya jam besar, pencarian, dan shortcut',
    make: () => ({
      items: { clock: T(4, 3, 16, 13, false), ayah: T(5, 16, 14, 4), search: T(5, 20, 14, 5), shortcuts: T(3, 26, 18, 10) },
      show: onlyBlocks(['clock', 'ayah', 'search', 'shortcuts']),
    }),
  },
  dashboard: {
    name: 'Dashboard', icon: '📊', desc: 'Semua widget tampil rapat dalam 4 kolom',
    make: () => ({
      items: {
        clock: T(0, 0, 8, 8, false), search: T(8, 1, 10, 5), ayah: T(8, 6, 10, 4), weather: T(18, 0, 6, 12),
        shortcuts: T(0, 10, 18, 10), music: T(0, 21, 6, 11), pomo: T(6, 21, 6, 17), calendar: T(12, 21, 6, 18),
        prayer: T(18, 12, 6, 21), todo: T(0, 33, 6, 8), notes: T(6, 39, 6, 10), countdown: T(12, 40, 6, 8),
        reminders: T(18, 34, 6, 9),
      },
      show: allBlocks(),
    }),
  },
  kerja: {
    name: 'Kerja', icon: '💼', desc: 'Pomodoro, tugas, catatan, dan musik di depan',
    make: () => ({
      items: {
        clock: T(0, 0, 6, 6, false), search: T(6, 1, 12, 5), music: T(18, 0, 6, 11), notes: T(0, 7, 6, 14),
        pomo: T(6, 7, 6, 17), todo: T(12, 7, 6, 10), reminders: T(18, 12, 6, 9), shortcuts: T(0, 25, 18, 9),
        calendar: T(12, 18, 6, 18),
      },
      show: onlyBlocks(['clock', 'search', 'music', 'notes', 'pomo', 'todo', 'reminders', 'shortcuts', 'calendar']),
    }),
  },
  ibadah: {
    name: 'Ibadah', icon: '🕌', desc: 'Jadwal sholat, ayat, kalender Hijriah, hitung mundur',
    make: () => ({
      items: {
        clock: T(6, 0, 12, 8, false), ayah: T(6, 8, 12, 5), search: T(6, 13, 12, 5), prayer: T(0, 0, 6, 21),
        calendar: T(18, 0, 6, 18), countdown: T(18, 19, 6, 8), reminders: T(0, 22, 6, 9), shortcuts: T(6, 19, 12, 10),
        todo: T(18, 28, 6, 8),
      },
      show: onlyBlocks(['clock', 'ayah', 'search', 'prayer', 'calendar', 'countdown', 'reminders', 'shortcuts', 'todo']),
    }),
  },
  simetris: {
    name: 'Simetris', icon: '⚖️', desc: 'Jam di tengah, widget seimbang di kiri dan kanan',
    make: () => ({
      items: {
        weather: T(0, 0, 6, 12), music: T(0, 12, 6, 11), todo: T(0, 23, 6, 8),
        clock: T(6, 0, 12, 9, false), ayah: T(6, 9, 12, 4), search: T(6, 13, 12, 5), shortcuts: T(6, 18, 12, 10),
        prayer: T(18, 0, 6, 21), calendar: T(18, 21, 6, 18), notes: T(0, 32, 6, 10),
        pomo: T(6, 29, 6, 17), countdown: T(12, 29, 6, 8), reminders: T(12, 38, 6, 9),
      },
      show: allBlocks(),
    }),
  },
};

// Fill a block that just became visible.
function loadBlock(k) {
  if (k === 'weather' || k === 'prayer') loadWidgets();
  if (k === 'ayah') loadAyah();
  if (k === 'calendar') renderCalendar();
  if (k === 'countdown') renderCountdown();
  if (k === 'reminders') renderReminders();
  if (k === 'pomo') renderPomo();
  if (k === 'music') renderMusic(true);
  window.QAX?.renderWidget(k);
}

let layoutUndo = null;
function applyArrangement(arr, label, exact = false) {
  if (focusMode) setFocusMode(false, true);
  layoutUndo = { items: JSON.parse(JSON.stringify(D.settings.layout.items)), widgets: { ...D.settings.widgets }, tile: D.settings.layout.tile };
  const def = defaultLayout().items;
  const wasShown = Object.fromEntries(Object.keys(BLOCKS).map((k) => [k, D.settings.widgets[k] !== false]));
  const items = {};
  for (const k of Object.keys(BLOCKS)) items[k] = { ...(arr.items[k] || def[k]) };
  D.settings.layout.items = items;
  for (const k of Object.keys(BLOCKS)) if (k in arr.show) D.settings.widgets[k] = !!arr.show[k];
  if (arr.tile) D.settings.layout.tile = arr.tile;
  ensureItems();
  resolve(shownItems(), null);
  if (!exact) compact();
  save();
  applyTheme();
  Object.keys(BLOCKS).forEach((k) => { if (isShown(k) && !wasShown[k]) loadBlock(k); });
  Object.keys(BLOCKS).forEach((k) => measureBlock(k, true));
  syncLayoutBar();
  toast(`Tata letak "${label}" dipakai`);
}

function undoArrangement() {
  if (!layoutUndo) return;
  const u = layoutUndo;
  layoutUndo = null;
  D.settings.layout.items = u.items;
  D.settings.widgets = { ...D.settings.widgets, ...u.widgets };
  D.settings.layout.tile = u.tile;
  save();
  applyTheme();
  Object.keys(BLOCKS).forEach((k) => { if (isShown(k)) loadBlock(k); });
  syncLayoutBar();
  toast('Tata letak sebelumnya dikembalikan');
}

function saveProfile(name) {
  const list = (D.settings.layoutProfiles ||= []);
  const snap = {
    id: uid(), name,
    items: JSON.parse(JSON.stringify(D.settings.layout.items)),
    show: Object.fromEntries(Object.keys(BLOCKS).map((k) => [k, D.settings.widgets[k] !== false])),
    tile: D.settings.layout.tile,
  };
  const i = list.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
  if (i >= 0) {
    if (!confirm(`Susunan "${list[i].name}" sudah ada. Timpa dengan susunan sekarang?`)) return;
    snap.id = list[i].id;
    list[i] = snap;
  } else {
    list.push(snap);
  }
  D.settings.activeProfile = snap.id;
  save();
  syncLayoutBar();
  toast(`Susunan "${name}" disimpan`);
}
function loadProfile(id) {
  const p = (D.settings.layoutProfiles || []).find((x) => x.id === id);
  if (!p) return;
  applyArrangement({ items: JSON.parse(JSON.stringify(p.items)), show: p.show, tile: p.tile }, p.name, true);
  D.settings.activeProfile = id;
  save();
  syncLayoutBar();
}
async function renameProfile(id) {
  const p = (D.settings.layoutProfiles || []).find((x) => x.id === id);
  if (!p) return;
  const name = await promptDialog('Ganti nama susunan', 'Nama susunan', p.name);
  if (!name) return;
  p.name = name;
  save();
  syncLayoutBar();
}
function deleteProfile(id) {
  const list = D.settings.layoutProfiles || [];
  const p = list.find((x) => x.id === id);
  if (!p || !confirm(`Hapus susunan "${p.name}"?`)) return;
  D.settings.layoutProfiles = list.filter((x) => x !== p);
  if (D.settings.activeProfile === id) D.settings.activeProfile = null;
  save();
  syncLayoutBar();
}

function renderPresetChips() {
  const tb = $('#lb-templates');
  if (tb && !tb.childElementCount) {
    Object.entries(LAYOUT_TEMPLATES).forEach(([key, tpl]) => {
      const b = el('button', 'chip-btn', `${tpl.icon} ${tpl.name}`);
      b.type = 'button';
      b.title = tpl.desc;
      b.onclick = () => applyArrangement(tpl.make(), tpl.name);
      tb.append(b);
    });
  }
  const pb = $('#lb-profiles');
  if (!pb) return;
  pb.innerHTML = '';
  const list = D.settings.layoutProfiles || [];
  if (!list.length) pb.append(el('span', 'muted small', 'Belum ada. Atur sesukamu lalu klik 💾 Simpan susunan.'));
  list.forEach((p) => {
    const b = el('button', 'chip-btn profile' + (p.id === D.settings.activeProfile ? ' on' : ''), p.name);
    b.type = 'button';
    b.title = 'Klik: pakai · klik kanan: ganti nama';
    b.onclick = () => loadProfile(p.id);
    b.oncontextmenu = (e) => { e.preventDefault(); renameProfile(p.id); };
    const x = el('span', 'chip-x', '✕');
    x.title = 'Hapus susunan';
    x.onclick = (e) => { e.stopPropagation(); deleteProfile(p.id); };
    b.append(x);
    pb.append(b);
  });
  const undo = $('#lb-undo');
  if (undo) undo.hidden = !layoutUndo;
}

$('#lb-save').addEventListener('click', async () => {
  const cur = (D.settings.layoutProfiles || []).find((p) => p.id === D.settings.activeProfile);
  const name = await promptDialog('Simpan susunan', 'Nama susunan (mis. Kerja, Santai, Ramadan)', cur ? cur.name : '');
  if (name) saveProfile(name);
});
$('#lb-undo').addEventListener('click', undoArrangement);

/* ---- Focus mode ---- */
function setFocusMode(on, quiet) {
  if (on && editingLayout) setEditLayout(false);
  focusMode = on;
  focusItems = on ? {
    clock: { k: 'clock', ...T(5, 2, 14, 12, false) },
    search: { k: 'search', ...T(6, 14, 12, 5) },
    pomo: { k: 'pomo', ...T(9, 20, 6, 17) },
  } : null;
  document.body.classList.toggle('focus', on);
  $('#btn-focus').classList.toggle('on', on);
  applyLayout();
  if (on) { renderPomo(); FOCUS_KEYS.forEach((k) => measureBlock(k, true)); }
  else Object.keys(BLOCKS).forEach((k) => { if (isShown(k)) loadBlock(k); });
  if (!quiet) toast(on ? '🎯 Mode fokus — klik 🎯 lagi atau tekan Esc untuk keluar' : 'Mode fokus selesai');
}
$('#btn-focus').addEventListener('click', () => setFocusMode(!focusMode));

function showMenu(anchor, items) {
  const m = $('#layout-menu');
  m.innerHTML = '';
  items.forEach(([label, fn]) => {
    const b = el('button', null, label);
    b.type = 'button';
    b.onclick = () => { m.hidden = true; fn(); };
    m.append(b);
  });
  m.hidden = false;
  const r = anchor.getBoundingClientRect();
  m.style.top = `${Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 10)}px`;
  m.style.left = `${Math.max(12, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 12))}px`;
}
/* ---- Layout menu (top bar) ---- */function openLayoutMenu(anchor) {
  const m = $('#layout-menu');
  m.innerHTML = '';
  const item = (label, fn, cls = '') => {
    const b = el('button', cls, label);
    b.type = 'button';
    b.onclick = () => { m.hidden = true; fn(); };
    m.append(b);
  };
  item('✏️ Atur tata letak…', () => setEditLayout(true));
  item(focusMode ? '🎯 Keluar dari mode fokus' : '🎯 Mode fokus', () => setFocusMode(!focusMode));
  const profiles = D.settings.layoutProfiles || [];
  if (profiles.length) {
    m.append(el('div', 'menu-label', 'Susunan tersimpan'));
    profiles.forEach((p) => item(`${p.id === D.settings.activeProfile ? '● ' : ''}${p.name}`, () => loadProfile(p.id), 'indent'));
  }
  m.append(el('div', 'menu-label', 'Template'));
  Object.values(LAYOUT_TEMPLATES).forEach((tpl) => item(`${tpl.icon} ${tpl.name}`, () => applyArrangement(tpl.make(), tpl.name), 'indent'));
  if (layoutUndo) item('↶ Batalkan ganti tata letak', undoArrangement);
  m.hidden = false;
  const r = anchor.getBoundingClientRect();
  m.style.top = `${r.bottom + 8}px`;
  m.style.left = `${Math.max(12, r.right - m.offsetWidth)}px`;
}
$('#btn-layout').addEventListener('click', (e) => {
  e.stopPropagation();
  if (editingLayout) { setEditLayout(false); toast('Tata letak disimpan'); return; }
  const m = $('#layout-menu');
  if (!m.hidden) { m.hidden = true; return; }
  openLayoutMenu(e.currentTarget);
});
document.addEventListener('click', (e) => { if (!e.target.closest('#layout-menu')) $('#layout-menu').hidden = true; });
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(applyLayout, 120); });

/* ================= Hijri + holidays ================= */
let hijriFmt = null;
try { hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }); } catch {}
function hijri(d) {
  if (!hijriFmt) return null;
  const p = hijriFmt.formatToParts(d);
  const v = (t) => parseInt((p.find((x) => x.type === t) || {}).value, 10);
  return { d: v('day'), m: v('month'), y: v('year') || v('relatedYear') };
}
function hijriStr(d) {
  const h = hijri(d);
  return h ? `${h.d} ${HIJRI_MONTHS[h.m - 1]} ${h.y} H` : '';
}

function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
// Lunar holidays that can't be computed here (from government decree / astronomical tables).
const IMLEK = { 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03' };
const NYEPI = { 2025: '03-29', 2026: '03-19' };
const WAISAK = { 2025: '05-12', 2026: '05-31' };
const ISLAMIC_DAYS = [
  [1, 1, 'Tahun Baru Islam'], [3, 12, 'Maulid Nabi Muhammad SAW'], [7, 27, "Isra Mi'raj"],
  [9, 1, 'Awal Ramadan', 'info'], [10, 1, 'Idul Fitri'], [10, 2, 'Idul Fitri (hari ke-2)'], [12, 10, 'Idul Adha'],
];
const holidayCache = {};
function holidays(y) {
  if (holidayCache[y]) return holidayCache[y];
  const map = {};
  const add = (d, name, approx = false, type = 'libur') => { (map[ymd(d)] ||= []).push({ name, approx, type }); };
  add(new Date(y, 0, 1), 'Tahun Baru Masehi');
  add(new Date(y, 4, 1), 'Hari Buruh');
  add(new Date(y, 5, 1), 'Hari Lahir Pancasila');
  add(new Date(y, 7, 17), 'HUT Kemerdekaan RI');
  add(new Date(y, 11, 25), 'Hari Natal');
  const e = easter(y);
  add(addDays(e, -2), 'Wafat Yesus Kristus');
  add(e, 'Hari Paskah');
  add(addDays(e, 39), 'Kenaikan Yesus Kristus');
  const fromTable = (tbl, name) => { if (tbl[y]) add(parseYmd(`${y}-${tbl[y]}`), name); };
  fromTable(IMLEK, 'Tahun Baru Imlek');
  fromTable(NYEPI, 'Hari Raya Nyepi');
  fromTable(WAISAK, 'Hari Raya Waisak');
  if (hijriFmt) {
    for (let d = new Date(y, 0, 1); d.getFullYear() === y; d = addDays(d, 1)) {
      const h = hijri(d);
      for (const [m, day, name, type] of ISLAMIC_DAYS) if (h.m === m && h.d === day) add(d, name, true, type || 'libur');
    }
  }
  holidayCache[y] = map;
  return map;
}
function nextHoliday(from = today0(), filter = () => true) {
  for (const y of [from.getFullYear(), from.getFullYear() + 1]) {
    const entries = Object.entries(holidays(y)).sort(([a], [b]) => a.localeCompare(b));
    for (const [k, list] of entries) {
      const d = parseYmd(k);
      if (d < from) continue;
      const hit = list.find((h) => h.type === 'libur' && filter(h));
      if (hit) return { date: d, ...hit };
    }
  }
  return null;
}

/* ================= Clock ================= */
function analogSVG() {
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    ticks += `<line x1="100" y1="${big ? 12 : 14}" x2="100" y2="${big ? 24 : 19}" class="tk${big ? ' big' : ''}" transform="rotate(${i * 6} 100 100)"/>`;
  }
  return `<svg viewBox="0 0 200 200" class="analog" aria-hidden="true">
    <circle cx="100" cy="100" r="96" class="face"/>${ticks}
    <line id="hand-h" x1="100" y1="100" x2="100" y2="56" class="hand hh"/>
    <line id="hand-m" x1="100" y1="100" x2="100" y2="32" class="hand mm"/>
    <line id="hand-s" x1="100" y1="116" x2="100" y2="22" class="hand ss"/>
    <circle cx="100" cy="100" r="4.5" class="pin"/></svg><div class="analog-sub" id="analog-sub"></div>`;
}

// Flip clock: one tile per digit; a tile flips when its digit changes.
function renderFlip(t, s) {
  const box = $('#flip');
  if (!box) return;
  const digits = `${t.h.padStart(2, '0')}:${t.m}${s.seconds ? ':' + t.s : ''}`;
  if (box.dataset.n !== String(digits.length)) {
    box.dataset.n = String(digits.length);
    box.innerHTML = [...digits].map((ch) => (ch === ':' ? '<span class="flip-colon">:</span>' : '<span class="flip-tile"><b></b></span>')).join('') +
      (t.ampm ? `<span class="flip-ampm">${t.ampm}</span>` : '');
  }
  const tiles = $$('.flip-tile', box);
  [...digits.replace(/:/g, '')].forEach((ch, i) => {
    const tile = tiles[i];
    if (!tile) return;
    const b = tile.firstChild;
    if (b.textContent !== ch) {
      b.textContent = ch;
      tile.classList.remove('flipping');
      void tile.offsetWidth;
      tile.classList.add('flipping');
    }
  });
}
// "jam sembilan lewat seperempat malam"
const ANGKA = ['dua belas', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas'];
function timeInWords(now) {
  const h24 = now.getHours();
  let m = Math.round(now.getMinutes() / 5) * 5;
  let h = h24;
  if (m === 60) { m = 0; h++; }
  const part = (hh) => { hh %= 24; return hh < 4 ? 'dini hari' : hh < 11 ? 'pagi' : hh < 15 ? 'siang' : hh < 18 ? 'sore' : 'malam'; };
  const name = (hh) => ANGKA[hh % 12];
  let txt;
  if (m === 0) txt = `jam <b>${name(h)}</b> tepat`;
  else if (m === 15) txt = `jam <b>${name(h)}</b> lewat seperempat`;
  else if (m === 30) txt = `jam <b>setengah ${name(h + 1)}</b>`;
  else if (m === 45) txt = `jam <b>${name(h + 1)}</b> kurang seperempat`;
  else if (m < 30) txt = `jam <b>${name(h)}</b> lewat ${{ 5: 'lima', 10: 'sepuluh', 20: 'dua puluh', 25: 'dua puluh lima' }[m]} menit`;
  else txt = `jam <b>${name(h + 1)}</b> kurang ${{ 35: 'dua puluh lima', 40: 'dua puluh', 50: 'sepuluh', 55: 'lima' }[m]} menit`;
  return `${txt} <span>${part(m >= 30 && m !== 30 ? h + 1 : h)}</span>`;
}

let renderedClockStyle = '';function renderClock(force) {
  if (!force && renderedClockStyle === D.settings.clockStyle) return;
  renderedClockStyle = D.settings.clockStyle;
  const cs = D.settings.clockStyle;
  $('#clock').innerHTML = cs === 'analog' ? analogSVG()
    : cs === 'flip' ? '<div class="flip" id="flip"></div>'
    : cs === 'words' ? '<div class="words" id="words"></div>'
    : `<div class="digital${cs === 'neon' ? ' neon' : ''}" id="digital"></div>`;
  tick();
}

function timeParts(now) {
  const s = D.settings;
  let h = now.getHours();
  let ampm = '';
  if (!s.h24) { ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; }
  return { h: s.h24 ? pad(h) : String(h), m: pad(now.getMinutes()), s: pad(now.getSeconds()), ampm };
}

let lastDay = '';
function tick() {
  const now = new Date();
  const s = D.settings;
  const t = timeParts(now);

  if (s.clockStyle === 'analog') {
    const sec = now.getSeconds(), min = now.getMinutes() + sec / 60, hr = (now.getHours() % 12) + min / 60;
    $('#hand-h')?.setAttribute('transform', `rotate(${hr * 30} 100 100)`);
    $('#hand-m')?.setAttribute('transform', `rotate(${min * 6} 100 100)`);
    $('#hand-s')?.setAttribute('transform', `rotate(${sec * 6} 100 100)`);
    const sub = $('#analog-sub');
    if (sub) sub.textContent = `${t.h}:${t.m}${s.seconds ? ':' + t.s : ''}${t.ampm ? ' ' + t.ampm : ''}`;
  } else if (s.clockStyle === 'flip') {
    renderFlip(t, s);
  } else if (s.clockStyle === 'words') {
    const w = $('#words');
    const txt = timeInWords(now);
    if (w && w.dataset.t !== txt) { w.dataset.t = txt; w.innerHTML = txt; }
  } else {
    const d = $('#digital');
    if (d) d.innerHTML = `${t.h}<span class="colon">:</span>${t.m}${s.seconds ? `<span class="sec">${t.s}</span>` : ''}${t.ampm ? `<span class="ampm">${t.ampm}</span>` : ''}`;
  }

  const h = now.getHours();
  const greet = h < 4 ? 'Selamat malam' : h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  const g = $('#greeting');
  const name = (s.name || '').trim();
  if (g.dataset.k !== greet + name) {
    g.innerHTML = name ? `${greet}, <b></b> ✨` : `${greet} ✨`;
    if (name) $('b', g).textContent = name;
    g.dataset.k = greet + name;
  }

  updatePrayerCountdown(now);
  renderPomo();
  updateMusicProgress();

  const dk = dayKey(now);
  if (dk !== lastDay) {
    $('#top-date').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('#top-hijri').textContent = hijriStr(now);
    if (lastDay) { loadWidgets(); loadAyah(); renderCalendar(); renderCountdown(); }
    lastDay = dk;
  }
  if (now.getSeconds() === 0) applyAutoTheme();
}

/* ================= Theme presets + automatic theme by time of day ================= */
const THEMES = {
  aurora:  { name: 'Aurora Klasik', icon: '🔮', wall: 'aurora',   accent: '#8b9dff', dim: 20 },
  malam:   { name: 'Malam Tenang',  icon: '🌌', wall: 'midnight', accent: '#a78bfa', dim: 25 },
  senja:   { name: 'Senja Hangat',  icon: '🌅', wall: 'sunset',   accent: '#fb923c', dim: 15 },
  biru:    { name: 'Fokus Biru',    icon: '🌊', wall: 'ocean',    accent: '#38bdf8', dim: 15 },
  hutan:   { name: 'Zen Hutan',     icon: '🌿', wall: 'forest',   accent: '#4ade80', dim: 20 },
  sakura:  { name: 'Sakura',        icon: '🌸', wall: 'sakura',   accent: '#f9a8d4', dim: 15 },
  kopi:    { name: 'Kopi Pagi',     icon: '☕', wall: 'coffee',   accent: '#fbbf24', dim: 15 },
  ramadan: { name: 'Ramadan',       icon: '🕌', wall: 'ramadan',  accent: '#fcd34d', dim: 20, clock: 'analog' },
  fajar:   { name: 'Fajar',         icon: '🌄', wall: 'sunrise',  accent: '#fdba74', dim: 20 },
  lavender:{ name: 'Lavender',      icon: '💜', wall: 'lavender', accent: '#c4b5fd', dim: 15 },
  cerah:   { name: 'Langit Cerah',  icon: '🌤️', wall: 'daylight', accent: '#fde68a', dim: 25 },
};
const DAY_PARTS = { pagi: 'kopi', siang: 'biru', sore: 'senja', malam: 'malam' };
const DAY_PART_LABEL = { pagi: 'Pagi', siang: 'Siang', sore: 'Sore', malam: 'Malam' };
function dayPart(h = new Date().getHours()) {
  return h >= 5 && h < 10 ? 'pagi' : h >= 10 && h < 15 ? 'siang' : h >= 15 && h < 18 ? 'sore' : 'malam';
}

function applyThemePreset(key, { auto = false } = {}) {
  const t = THEMES[key];
  if (!t) return;
  const s = D.settings;
  s.wallpaper = t.wall;
  s.accent = t.accent;
  s.dim = t.dim;
  s.blur = 0;
  if (t.clock) s.clockStyle = t.clock;
  s.theme = key;
  if (!auto) s.autoTheme = false; // picking a theme by hand turns the automatic switch off
  save();
  applyTheme();
  renderClock();
  if ($('#drawer').classList.contains('open')) fillSettings();
}

let lastDayPart = '';
function applyAutoTheme(force) {
  if (!D.settings.autoTheme) return;
  const part = dayPart();
  if (!force && part === lastDayPart) return;
  lastDayPart = part;
  const key = (D.settings.autoThemeMap || DAY_PARTS)[part] || DAY_PARTS[part];
  if (D.settings.theme !== key || force) applyThemePreset(key, { auto: true });
}

function renderThemeCards() {
  const box = $('#set-themes');
  if (!box) return;
  box.innerHTML = '';
  Object.entries(THEMES).forEach(([key, t]) => {
    const w = WALLS[t.wall] || WALLS.aurora;
    const b = el('button', 'theme-card' + (D.settings.theme === key ? ' on' : ''));
    b.type = 'button';
    b.style.background = `radial-gradient(circle at 25% 30%, ${w.blobs[0]}bb, transparent 55%), radial-gradient(circle at 80% 75%, ${w.blobs[1]}aa, transparent 55%), ${w.bg}`;
    const dot = el('i');
    dot.style.background = t.accent;
    b.append(el('span', 'tc-icon', t.icon), el('span', 'tc-name', t.name), dot);
    b.onclick = () => { applyThemePreset(key); toast(`Tema "${t.name}" dipakai`); };
    box.append(b);
  });
  const info = $('#autotheme-info');
  if (info) {
    const map = D.settings.autoThemeMap || DAY_PARTS;
    info.textContent = Object.entries(map).map(([p, k]) => `${DAY_PART_LABEL[p]}: ${THEMES[k]?.name || k}`).join(' · ');
  }
}

/* ================= Weather effects behind the page ================= */
const wfx = { kind: 'none', parts: [], raf: 0, flash: 0, code: null, isDay: 1, last: 0 };
const fxReduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function fxKind(code, isDay) {
  if (code == null) return 'none';
  if ([95, 96, 99].includes(code)) return 'storm';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code === 45 || code === 48) return 'fog';
  if (!isDay && code <= 2) return 'stars';
  return 'none';
}
function setWeatherFx(code, isDay) {
  wfx.code = code;
  wfx.isDay = isDay;
  updateWeatherFx();
}
function fxCanvas() {
  let c = $('#wx-fx');
  if (!c) {
    c = el('canvas');
    c.id = 'wx-fx';
    c.setAttribute('aria-hidden', 'true');
    $('#bg-dim').after(c);
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (c.width !== Math.round(innerWidth * dpr) || c.height !== Math.round(innerHeight * dpr)) {
    c.width = Math.round(innerWidth * dpr);
    c.height = Math.round(innerHeight * dpr);
  }
  return c;
}
function updateWeatherFx() {
  const want = D.settings.weatherFx !== false && !fxReduce ? fxKind(wfx.code, wfx.isDay) : 'none';
  if (want === wfx.kind) return;
  wfx.kind = want;
  cancelAnimationFrame(wfx.raf);
  const c = fxCanvas();
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  c.hidden = want === 'none';
  if (want === 'none') return;
  const W = c.width, H = c.height, r = Math.random;
  const n = { rain: 160, storm: 220, snow: 110, stars: 140, fog: 7 }[want];
  wfx.parts = Array.from({ length: n }, () => ({
    x: r() * W, y: r() * H, z: 0.4 + r() * 0.6, a: r() * Math.PI * 2, s: 0.5 + r() * 1.5,
  }));
  wfx.last = performance.now();
  wfx.raf = requestAnimationFrame(drawWeatherFx);
}
function drawWeatherFx(t) {
  wfx.raf = requestAnimationFrame(drawWeatherFx);
  if (document.hidden) return;
  const c = fxCanvas();
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  const dt = Math.min(0.05, (t - wfx.last) / 1000);
  wfx.last = t;
  const dpr = W / innerWidth;
  g.clearRect(0, 0, W, H);
  const k = wfx.kind;
  if (k === 'rain' || k === 'storm') {
    g.strokeStyle = 'rgba(190, 210, 255, 0.32)';
    g.lineWidth = 1.1 * dpr;
    g.beginPath();
    for (const p of wfx.parts) {
      const sp = (k === 'storm' ? 1250 : 900) * p.z * dpr;
      p.y += sp * dt;
      p.x -= sp * 0.18 * dt;
      if (p.y > H) { p.y = -20 * dpr; p.x = Math.random() * W * 1.2; }
      const len = 16 * p.z * dpr;
      g.moveTo(p.x, p.y);
      g.lineTo(p.x - len * 0.18, p.y + len);
    }
    g.stroke();
    if (k === 'storm') {
      if (Math.random() < dt * 0.15) wfx.flash = 1;
      if (wfx.flash > 0) {
        g.fillStyle = `rgba(220, 230, 255, ${wfx.flash * 0.18})`;
        g.fillRect(0, 0, W, H);
        wfx.flash = Math.max(0, wfx.flash - dt * 2.5);
      }
    }
  } else if (k === 'snow') {
    g.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (const p of wfx.parts) {
      p.a += dt * p.s;
      p.y += 45 * p.z * dpr * dt;
      p.x += Math.sin(p.a) * 18 * dpr * dt;
      if (p.y > H) { p.y = -6; p.x = Math.random() * W; }
      g.beginPath();
      g.arc(p.x, p.y, (1 + p.z * 2) * dpr, 0, Math.PI * 2);
      g.fill();
    }
  } else if (k === 'stars') {
    for (const p of wfx.parts) {
      p.a += dt * p.s * 1.6;
      const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(p.a));
      g.fillStyle = `rgba(255, 255, 240, ${alpha * p.z})`;
      g.fillRect(p.x, p.y * 0.75, 1.6 * p.z * dpr, 1.6 * p.z * dpr);
    }
    // An occasional shooting star.
    if (!wfx.shoot && Math.random() < dt * 0.06) wfx.shoot = { x: Math.random() * W * 0.7 + W * 0.3, y: Math.random() * H * 0.3, life: 1 };
    if (wfx.shoot) {
      const s = wfx.shoot;
      s.x -= 900 * dpr * dt;
      s.y += 380 * dpr * dt;
      s.life -= dt * 1.4;
      const grad = g.createLinearGradient(s.x, s.y, s.x + 90 * dpr, s.y - 38 * dpr);
      grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, s.life)})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = grad;
      g.lineWidth = 2 * dpr;
      g.beginPath();
      g.moveTo(s.x, s.y);
      g.lineTo(s.x + 90 * dpr, s.y - 38 * dpr);
      g.stroke();
      if (s.life <= 0) wfx.shoot = null;
    }
  } else if (k === 'fog') {
    for (const p of wfx.parts) {
      p.x += 12 * p.s * dpr * dt;
      if (p.x > W + 400 * dpr) p.x = -400 * dpr;
      const rad = 260 * (0.8 + p.z) * dpr;
      const grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      grad.addColorStop(0, 'rgba(230, 235, 245, 0.07)');
      grad.addColorStop(1, 'rgba(230, 235, 245, 0)');
      g.fillStyle = grad;
      g.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
    }
  }
}
window.addEventListener('resize', () => { if (wfx.kind !== 'none') fxCanvas(); });

function startClock() {
  renderClock(true);
  const loop = () => { tick(); setTimeout(loop, 1000 - (Date.now() % 1000) + 5); };
  setTimeout(loop, 1000 - (Date.now() % 1000) + 5);
}

/* ================= Shortcuts: model helpers ================= */
const isFolder = (s) => s.type === 'folder';
const findItem = (id) => D.shortcuts.find((s) => s.id === id);
const childrenOf = (fid) => D.shortcuts.filter((s) => s.folder === fid);
const topLevel = (gid) => D.shortcuts.filter((s) => s.group === gid && !s.folder);
const realGroupId = () => (D.activeGroup === FREQ ? D.groups[0].id : D.activeGroup);

function frequentList() {
  const now = Date.now();
  return D.shortcuts
    .filter((s) => !isFolder(s) && s.hits > 0)
    .map((s) => ({ s, score: s.hits / (1 + (now - (s.lastUsed || 0)) / (7 * 864e5)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.s);
}
const hasFrequent = () => D.settings.showFrequent && D.shortcuts.some((s) => !isFolder(s) && s.hits > 0);

function trackUse(s) {
  s.hits = (s.hits || 0) + 1;
  s.lastUsed = Date.now();
}

function normalizeUrl(u) {
  u = u.trim();
  if (!u) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return u; // already has a scheme (https:, steam:, mailto:)
  return (/^(localhost|\d{1,3}(\.\d{1,3}){3})/.test(u) ? 'http://' : 'https://') + u;
}

function hashColor(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 65% 55%)`;
}

function faviconFor(url, size = 128) {
  if (hasChrome && chrome.runtime?.id && size <= 32) {
    return `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(url)}&size=${size}`;
  }
  let host = '';
  try { host = new URL(url).hostname; } catch {}
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}` : '';
}

function iconNode(s, big = false) {
  const box = el('div', 'tile-ico' + (big ? ' big' : ''));
  const letter = () => {
    box.innerHTML = '';
    box.classList.remove('full', 'emoji');
    box.style.background = `linear-gradient(135deg, ${hashColor(s.name || '?')}, ${hashColor((s.name || '?') + 'x')})`;
    box.textContent = (s.name || '?').trim().charAt(0).toUpperCase() || '?';
  };
  const icon = (s.icon || '').trim();
  if (icon && /^(https?:|data:)/i.test(icon)) {
    box.classList.add('full');
    const img = el('img');
    img.alt = '';
    img.src = icon;
    img.onerror = letter;
    box.append(img);
  } else if (icon) {
    box.classList.add('emoji');
    box.textContent = icon;
  } else if (/^https?:\/\//i.test(s.url || '')) {
    const src = faviconFor(s.url, 128);
    if (!src) { letter(); return box; }
    const img = el('img');
    img.alt = '';
    img.src = src;
    img.onerror = letter;
    // Google returns a tiny default globe for unknown sites → fall back to a letter.
    img.onload = () => { if (img.naturalWidth <= 16) letter(); };
    box.append(img);
  } else {
    letter();
  }
  return box;
}

/* ================= Shortcuts: opening ================= */
function go(url, newTab) {
  if (newTab) window.open(url, '_blank', 'noopener');
  else location.href = url;
}
function openItem(s, newTab) {
  if (isFolder(s)) return openFolder(s);
  trackUse(s);
  persistNow().then(() => go(s.url, newTab || D.settings.openNewTab));
}

function openAll(list) {
  const urls = [...new Set(list.filter((s) => !isFolder(s) && /^https?:/i.test(s.url || '')).map((s) => s.url))];
  if (!urls.length) { toast('Tidak ada link web untuk dibuka'); return; }
  if (urls.length > 10 && !confirm(`Buka ${urls.length} tab sekaligus?`)) return;
  if (hasChrome && chrome.tabs) urls.forEach((url) => chrome.tabs.create({ url, active: false }));
  else urls.forEach((url) => window.open(url, '_blank', 'noopener'));
  toast(`${urls.length} tab dibuka`);
}
function activeGroupItems() {
  if (D.activeGroup === FREQ) return frequentList();
  return D.shortcuts.filter((s) => s.group === D.activeGroup);
}

/* ================= Shortcuts: rendering ================= */
function matches() {
  if (!query || query.startsWith('!')) return [];
  return D.shortcuts.filter((s) => (s.name || '').toLowerCase().includes(query) || (s.url || '').toLowerCase().includes(query));
}
function isSearching() { return !!query && !query.startsWith('!'); }
function visibleShortcuts() {
  if (isSearching()) return matches();
  if (D.activeGroup === FREQ) return frequentList();
  return topLevel(D.activeGroup);
}

function renderGroups() {
  if (D.activeGroup === FREQ && !hasFrequent()) D.activeGroup = D.groups[0].id;
  const nav = $('#groups');
  nav.innerHTML = '';
  if (hasFrequent()) {
    const f = el('button', 'group-btn freq' + (D.activeGroup === FREQ && !query ? ' active' : ''), '🔥 Sering');
    f.title = 'Shortcut yang paling sering kamu buka';
    f.onclick = () => selectGroup(FREQ);
    nav.append(f);
  }
  D.groups.forEach((g) => {
    const b = el('button', 'group-btn' + (g.id === D.activeGroup && !query ? ' active' : ''), g.name);
    b.title = 'Klik dua kali / klik kanan untuk mengubah';
    b.onclick = () => selectGroup(g.id);
    b.ondblclick = () => openGroupDialog(g);
    b.oncontextmenu = (e) => { e.preventDefault(); openGroupDialog(g); };
    b.ondragover = (e) => { if (dragId) { e.preventDefault(); b.classList.add('drop'); } };
    b.ondragleave = () => b.classList.remove('drop');
    b.ondrop = (e) => {
      e.preventDefault();
      b.classList.remove('drop');
      moveToGroup(dragId, g.id);
    };
    nav.append(b);
  });
  const add = el('button', 'group-btn add', '+');
  add.title = 'Tambah grup';
  add.onclick = () => openGroupDialog(null);
  nav.append(add);
  const all = el('button', 'group-btn openall', '⧉ Buka semua');
  all.title = 'Buka semua shortcut di grup ini sebagai tab baru';
  all.onclick = () => openAll(activeGroupItems());
  nav.append(all);
}
function selectGroup(id) {
  D.activeGroup = id;
  clearSearch();
  save();
  renderGroups();
  renderGrid();
}

let dragId = null;
function attachDrag(node, s) {
  node.draggable = true;
  node.addEventListener('dragstart', (e) => {
    dragId = s.id;
    node.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', s.id);
  });
  node.addEventListener('dragend', () => {
    dragId = null;
    $$('.tile.over,.tile.dragging,.group-btn.drop').forEach((t) => t.classList.remove('over', 'dragging', 'drop'));
  });
  node.addEventListener('dragover', (e) => {
    if (dragId && dragId !== s.id) { e.preventDefault(); node.classList.add('over'); }
  });
  node.addEventListener('dragleave', () => node.classList.remove('over'));
  node.addEventListener('drop', (e) => {
    e.preventDefault();
    node.classList.remove('over');
    const dragged = findItem(dragId);
    if (!dragged) return;
    if (isFolder(s) && !isFolder(dragged)) moveIntoFolder(dragged, s);
    else moveShortcut(dragged, s);
  });
}

function buildTile(s, i, ctx = {}) {
  if (isFolder(s)) return buildFolderTile(s, i, ctx);
  const a = el('a', 'tile');
  a.href = s.url;
  a.style.animationDelay = `${Math.min(i, 16) * 0.025}s`;
  if (D.settings.openNewTab) { a.target = '_blank'; a.rel = 'noopener'; }
  if (i < 9 && ctx.numbered) a.append(el('span', 'badge', String(i + 1)));
  a.append(iconNode(s), el('span', 'label', s.name));
  if (ctx.showGroup) {
    const g = D.groups.find((x) => x.id === s.group);
    if (g) a.append(el('span', 'group-tag', g.name));
  }
  const edit = el('button', 'edit', '⋯');
  edit.title = 'Edit';
  edit.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openShortcutDialog(s); };
  a.append(edit);
  a.oncontextmenu = (e) => { e.preventDefault(); openShortcutDialog(s); };
  a.addEventListener('click', (e) => {
    if (e.button !== 0 || e.defaultPrevented) return;
    trackUse(s);
    if (e.ctrlKey || e.metaKey || e.shiftKey || a.target === '_blank') { persistNow(); renderGroups(); return; }
    e.preventDefault();
    persistNow().then(() => { location.href = s.url; });
  });
  a.addEventListener('auxclick', (e) => { if (e.button === 1) { trackUse(s); persistNow(); renderGroups(); } });
  if (ctx.draggable) attachDrag(a, s);
  return a;
}

function buildFolderTile(f, i, ctx = {}) {
  const b = el('div', 'tile folder');
  b.tabIndex = 0;
  b.setAttribute('role', 'button');
  b.style.animationDelay = `${Math.min(i, 16) * 0.025}s`;
  if (i < 9 && ctx.numbered) b.append(el('span', 'badge', String(i + 1)));
  const ico = el('div', 'folder-ico');
  childrenOf(f.id).slice(0, 4).forEach((c) => ico.append(iconNode(c)));
  b.append(ico, el('span', 'label', f.name));
  if (ctx.showGroup) {
    const g = D.groups.find((x) => x.id === f.group);
    if (g) b.append(el('span', 'group-tag', g.name));
  }
  b.onclick = () => openFolder(f);
  b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFolder(f); } };
  b.oncontextmenu = (e) => { e.preventDefault(); openFolder(f); };
  if (ctx.draggable) attachDrag(b, f);
  return b;
}

function renderGrid() {
  const grid = $('#grid');
  grid.innerHTML = '';
  const list = visibleShortcuts();
  const searching = isSearching();
  const freq = D.activeGroup === FREQ && !searching;
  const ctx = { numbered: true, draggable: !searching && !freq, showGroup: searching || freq };
  list.forEach((s, i) => grid.append(buildTile(s, i, ctx)));

  if (searching && !list.length) {
    grid.append(el('div', 'empty', 'Tidak ada shortcut yang cocok — tekan Enter untuk mencari di web.'));
  }
  if (!searching && !freq) {
    const add = el('button', 'tile add');
    add.append(el('div', 'tile-ico', '+'), el('span', 'label', 'Tambah'));
    add.onclick = (e) => { e.stopPropagation(); openAddMenu(add); };
    grid.append(add);
  }
  updateHint();
}

function renderShortcuts() {
  renderGroups();
  renderGrid();
  if ($('#dlg-folder').open) renderFolder();
}

/* ---- Moving ---- */
function moveShortcut(item, target) {
  if (!item || item === target) return;
  if (isFolder(item) && target.folder) return; // no folders inside folders
  const arr = D.shortcuts;
  const fi = arr.indexOf(item);
  const ti = arr.indexOf(target);
  arr.splice(fi, 1);
  const newTi = arr.indexOf(target);
  item.group = target.group;
  if (target.folder) item.folder = target.folder; else delete item.folder;
  if (isFolder(item)) childrenOf(item.id).forEach((c) => { c.group = item.group; });
  arr.splice(fi < ti ? newTi + 1 : newTi, 0, item);
  save();
  renderShortcuts();
}
function moveIntoFolder(item, folder) {
  if (item.folder === folder.id) return;
  D.shortcuts = D.shortcuts.filter((s) => s !== item);
  item.folder = folder.id;
  item.group = folder.group;
  D.shortcuts.push(item);
  save();
  renderShortcuts();
  toast(`Dimasukkan ke folder "${folder.name}"`);
}
function moveToGroup(id, gid) {
  const item = findItem(id);
  if (!item) return;
  if (item.group === gid && !item.folder) return;
  D.shortcuts = D.shortcuts.filter((s) => s !== item);
  item.group = gid;
  delete item.folder;
  if (isFolder(item)) childrenOf(item.id).forEach((c) => { c.group = gid; });
  D.shortcuts.push(item);
  save();
  renderShortcuts();
  toast(`Dipindah ke "${(D.groups.find((g) => g.id === gid) || {}).name}"`);
}

/* ---- Add menu ---- */
function openAddMenu(anchor) {
  const m = $('#add-menu');
  m.hidden = false;
  const r = anchor.getBoundingClientRect();
  const left = Math.min(r.left, window.innerWidth - m.offsetWidth - 12);
  const top = r.bottom + 6 + m.offsetHeight > window.innerHeight ? r.top - m.offsetHeight - 6 : r.bottom + 6;
  m.style.left = `${Math.max(12, left)}px`;
  m.style.top = `${Math.max(12, top)}px`;
}
function closeAddMenu() { $('#add-menu').hidden = true; }
document.addEventListener('click', (e) => { if (!e.target.closest('#add-menu')) closeAddMenu(); });
$$('#add-menu button').forEach((b) => b.addEventListener('click', async () => {
  closeAddMenu();
  if (b.dataset.add === 'shortcut') return openShortcutDialog(null);
  const name = await promptDialog('Folder baru', 'Nama folder', '');
  if (!name) return;
  const f = { id: uid(), type: 'folder', name, group: realGroupId() };
  D.shortcuts.push(f);
  save();
  renderShortcuts();
  openFolder(f);
}));

/* ---- Prompt dialog ---- */
function promptDialog(title, label, value) {
  return new Promise((resolve) => {
    const dlg = $('#dlg-prompt');
    $('#prompt-title').textContent = title;
    $('#prompt-label').textContent = label;
    const input = $('#prompt-input');
    input.value = value || '';
    let done = false;
    const form = $('#form-prompt');
    const onSubmit = (e) => {
      e.preventDefault();
      done = true;
      dlg.close();
      resolve(input.value.trim() || null);
    };
    form.addEventListener('submit', onSubmit, { once: true });
    dlg.addEventListener('close', () => {
      form.removeEventListener('submit', onSubmit);
      if (!done) resolve(null);
    }, { once: true });
    dlg.showModal();
    input.select();
  });
}

/* ---- Shortcut dialog ---- */
let editingShortcut = null;
function fillFolderSelect(gid, selected) {
  const sel = $('#sc-folder');
  sel.innerHTML = '';
  const none = el('option', null, '— Tanpa folder —');
  none.value = '';
  sel.append(none);
  D.shortcuts.filter((s) => isFolder(s) && s.group === gid).forEach((f) => {
    const o = el('option', null, f.name);
    o.value = f.id;
    sel.append(o);
  });
  sel.value = selected || '';
}
function openShortcutDialog(s, preset = {}) {
  editingShortcut = s;
  $('#dlg-shortcut-title').textContent = s ? 'Edit shortcut' : 'Tambah shortcut';
  $('#sc-name').value = s ? s.name : '';
  $('#sc-url').value = s ? s.url : '';
  $('#sc-icon').value = s ? s.icon || '' : '';
  const sel = $('#sc-group');
  sel.innerHTML = '';
  D.groups.forEach((g) => { const o = el('option', null, g.name); o.value = g.id; sel.append(o); });
  const gid = s ? s.group : preset.group || realGroupId();
  sel.value = gid;
  fillFolderSelect(gid, s ? s.folder : preset.folder);
  $('#sc-delete').hidden = !s;
  updatePreview();
  $('#dlg-shortcut').showModal();
  $('#sc-name').focus();
}
$('#sc-group').addEventListener('change', (e) => fillFolderSelect(e.target.value, ''));
function updatePreview() {
  const p = $('#sc-preview');
  const tmp = { name: $('#sc-name').value || '?', url: normalizeUrl($('#sc-url').value), icon: $('#sc-icon').value };
  p.replaceWith(Object.assign(iconNode(tmp, true), { id: 'sc-preview' }));
}
let previewTimer;
['#sc-name', '#sc-url', '#sc-icon'].forEach((id) => {
  $(id).addEventListener('input', () => { clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 300); });
});
$('#form-shortcut').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#sc-name').value.trim();
  const url = normalizeUrl($('#sc-url').value);
  if (!name || !url) return;
  const data = { name, url, icon: $('#sc-icon').value.trim(), group: $('#sc-group').value };
  const folder = $('#sc-folder').value;
  const wasEditing = !!editingShortcut;
  let item = editingShortcut;
  if (item) Object.assign(item, data);
  else { item = { id: uid(), ...data }; D.shortcuts.push(item); }
  if (folder) item.folder = folder; else delete item.folder;
  if (!folder && D.activeGroup !== FREQ) D.activeGroup = data.group;
  save();
  renderShortcuts();
  $('#dlg-shortcut').close();
  toast(wasEditing ? 'Shortcut diperbarui' : 'Shortcut ditambahkan');
});
let undoStack = null;
$('#sc-delete').addEventListener('click', () => {
  if (!editingShortcut) return;
  const removed = editingShortcut;
  const idx = D.shortcuts.indexOf(removed);
  D.shortcuts = D.shortcuts.filter((s) => s !== removed);
  save();
  renderShortcuts();
  $('#dlg-shortcut').close();
  toast(`"${removed.name}" dihapus — Ctrl+Z untuk batal`);
  undoStack = { item: removed, idx };
});

/* ---- Folder dialog ---- */
let openFolderId = null;
function openFolder(f) {
  openFolderId = f.id;
  $('#folder-name').value = f.name;
  renderFolder();
  const dlg = $('#dlg-folder');
  if (!dlg.open) dlg.showModal();
}
function renderFolder() {
  const f = findItem(openFolderId);
  const dlg = $('#dlg-folder');
  if (!f) { if (dlg.open) dlg.close(); return; }
  if (document.activeElement !== $('#folder-name')) $('#folder-name').value = f.name;
  const grid = $('#folder-grid');
  grid.innerHTML = '';
  childrenOf(f.id).forEach((c, i) => grid.append(buildTile(c, i, { draggable: true })));
  const add = el('button', 'tile add');
  add.append(el('div', 'tile-ico', '+'), el('span', 'label', 'Tambah'));
  add.onclick = () => openShortcutDialog(null, { group: f.group, folder: f.id });
  grid.append(add);
}
$('#dlg-folder').addEventListener('close', () => { openFolderId = null; });
$('#folder-name').addEventListener('change', (e) => {
  const f = findItem(openFolderId);
  if (!f) return;
  f.name = e.target.value.trim() || 'Folder';
  save();
  renderGrid();
});
$('#folder-openall').addEventListener('click', () => openAll(childrenOf(openFolderId)));
$('#folder-delete').addEventListener('click', () => {
  const f = findItem(openFolderId);
  if (!f) return;
  const kids = childrenOf(f.id);
  if (kids.length && !confirm(`Hapus folder "${f.name}"? ${kids.length} shortcut di dalamnya akan dikeluarkan ke grup.`)) return;
  kids.forEach((c) => { delete c.folder; });
  D.shortcuts = D.shortcuts.filter((s) => s !== f);
  save();
  $('#dlg-folder').close();
  renderShortcuts();
});

/* ---- Group dialog ---- */
let editingGroup = null;
function openGroupDialog(g) {
  editingGroup = g;
  $('#dlg-group-title').textContent = g ? 'Ubah grup' : 'Grup baru';
  $('#grp-name').value = g ? g.name : '';
  $('#grp-delete').hidden = !g || D.groups.length <= 1;
  $('#dlg-group').showModal();
  $('#grp-name').select();
}
$('#form-group').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#grp-name').value.trim();
  if (!name) return;
  if (editingGroup) editingGroup.name = name;
  else { const g = { id: uid(), name }; D.groups.push(g); D.activeGroup = g.id; }
  save();
  renderShortcuts();
  $('#dlg-group').close();
});
$('#grp-delete').addEventListener('click', () => {
  const g = editingGroup;
  if (!g || D.groups.length <= 1) return;
  const count = D.shortcuts.filter((s) => s.group === g.id).length;
  const target = D.groups.find((x) => x.id !== g.id);
  if (count && !confirm(`Hapus grup "${g.name}"? ${count} item di dalamnya akan dipindah ke "${target.name}".`)) return;
  D.shortcuts.forEach((s) => { if (s.group === g.id) s.group = target.id; });
  D.groups = D.groups.filter((x) => x !== g);
  if (D.activeGroup === g.id) D.activeGroup = target.id;
  save();
  renderShortcuts();
  $('#dlg-group').close();
});
$$('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

/* ================= Search + suggestions ================= */
const searchInput = $('#search');
function clearSearch() { searchInput.value = ''; query = ''; hideSugg(); }

function looksLikeUrl(q) {
  if (/\s/.test(q)) return false;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(q)) return true;
  return /^(localhost|\d{1,3}(\.\d{1,3}){3}|[\w-]+(\.[\w-]+)*\.[a-z]{2,})(:\d+)?(\/\S*)?$/i.test(q);
}

function updateHint() {
  const h = $('#search-hint');
  const raw = searchInput.value.trim();
  if (!raw) { h.innerHTML = '&nbsp;'; return; }
  if (isTrMode()) {
    h.textContent = `Enter → terjemahkan ke ${langName(D.settings.translate.target)}  ·  Shift+Enter → cari di ${ENGINE_NAMES[D.settings.engine] || 'web'}`;
    return;
  }
  const calcRes = D.settings.ui.calc !== false ? window.QAX?.calc(raw) : null;
  if (calcRes && calcRes.text) { h.innerHTML = ''; h.append(el('b', 'calc-res', calcRes.text), document.createTextNode('  ·  Enter = salin hasil')); return; }
  if (calcRes && calcRes.pending) { h.textContent = 'Menghitung kurs…'; return; }
  const bang = raw.split(' ')[0];
  const m = matches();
  if (BANGS[bang]) h.textContent = `Enter → cari "${raw.slice(bang.length).trim()}" via ${bang}`;
  else if (suggIdx >= 0 && sugg[suggIdx]) h.textContent = `Enter → buka ${sugg[suggIdx].title}`;
  else if (m.length) h.textContent = `Enter → buka ${m[0].name}  ·  Shift+Enter → cari di web`;
  else if (looksLikeUrl(raw)) h.textContent = `Enter → buka ${raw}`;
  else h.textContent = `Enter → cari di ${ENGINE_NAMES[D.settings.engine] || 'web'}`;
}

let sugg = [];
let suggIdx = -1;
let suggSeq = 0;
let suggTimer;
async function fetchSuggestions(q) {
  const [bm, hist] = await Promise.all([
    chrome.bookmarks ? chrome.bookmarks.search(q).catch(() => []) : [],
    chrome.history ? chrome.history.search({ text: q, maxResults: 30, startTime: 0 }).catch(() => []) : [],
  ]);
  const seen = new Set(D.shortcuts.map((s) => s.url));
  const out = [];
  let nb = 0, nh = 0;
  for (const b of bm) {
    if (nb >= 4) break;
    if (!b.url || !/^https?:/i.test(b.url) || seen.has(b.url)) continue;
    seen.add(b.url); nb++;
    out.push({ kind: 'Bookmark', title: b.title || b.url, url: b.url });
  }
  hist.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
  for (const h of hist) {
    if (nh >= 5) break;
    if (!h.url || !/^https?:/i.test(h.url) || seen.has(h.url)) continue;
    seen.add(h.url); nh++;
    out.push({ kind: 'Riwayat', title: h.title || h.url, url: h.url });
  }
  return out;
}
function hideSugg() {
  sugg = [];
  suggIdx = -1;
  $('#suggest').hidden = true;
  searchInput.setAttribute('aria-expanded', 'false');
}
function renderSugg() {
  const ul = $('#suggest');
  ul.innerHTML = '';
  if (!sugg.length) { hideSugg(); return; }
  sugg.forEach((s, i) => {
    const li = el('li', i === suggIdx ? 'sel' : '');
    li.setAttribute('role', 'option');
    const img = el('img');
    img.alt = '';
    img.src = faviconFor(s.url, 32);
    const main = el('div', 's-main');
    let host = s.url;
    try { const u = new URL(s.url); host = u.hostname + (u.pathname !== '/' ? u.pathname : ''); } catch {}
    main.append(el('span', 's-title', s.title), el('span', 's-url', host));
    li.append(img, main, el('span', 's-kind', s.kind));
    li.addEventListener('mousedown', (e) => e.preventDefault());
    li.addEventListener('click', (e) => go(s.url, e.ctrlKey || e.metaKey));
    ul.append(li);
  });
  ul.hidden = false;
  searchInput.setAttribute('aria-expanded', 'true');
}
function scheduleSuggestions() {
  clearTimeout(suggTimer);
  const raw = searchInput.value.trim();
  if (!raw || raw.startsWith('!') || isTrMode() || !D.settings.searchHistory || !hasChrome || !(chrome.history || chrome.bookmarks)) { hideSugg(); return; }
  const seq = ++suggSeq;
  suggTimer = setTimeout(async () => {
    const items = await fetchSuggestions(raw);
    if (seq !== suggSeq) return;
    sugg = items;
    suggIdx = -1;
    renderSugg();
  }, 120);
}

searchInput.addEventListener('input', () => {
  // In AI mode the text is a question, so don't filter the shortcut grid.
  query = isTrMode() ? '' : searchInput.value.trim().toLowerCase();
  if (isTrMode()) { clearTimeout(trTimer); trTimer = setTimeout(() => runTranslate(searchInput.value), 550); }
  renderGroups();
  renderGrid();
  scheduleSuggestions();
});
searchInput.addEventListener('blur', () => setTimeout(hideSugg, 150));
searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) scheduleSuggestions(); });
searchInput.addEventListener('keydown', (e) => {
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && sugg.length) {
    e.preventDefault();
    const n = sugg.length;
    suggIdx = e.key === 'ArrowDown' ? (suggIdx + 1) % (n + 1) : (suggIdx - 1 + n + 1) % (n + 1);
    if (suggIdx === n) suggIdx = -1;
    renderSugg();
    updateHint();
    return;
  }
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const raw = searchInput.value.trim();
  if (!raw) return;
  const newTab = e.ctrlKey || e.metaKey;
  // AI: Enter in AI mode, or Alt+Enter from web mode. Shift+Enter in AI mode = web search.
  if (isTrMode() && !e.shiftKey) { clearTimeout(trTimer); return runTranslate(raw); }
  if (isTrMode() && e.shiftKey) return go((ENGINES[D.settings.engine] || ENGINES.google) + encodeURIComponent(raw), newTab);
  if (suggIdx >= 0 && sugg[suggIdx]) return go(sugg[suggIdx].url, newTab);
  const calcRes = !e.shiftKey && D.settings.ui.calc !== false ? window.QAX?.calc(raw) : null;
  if (calcRes && calcRes.text) { navigator.clipboard?.writeText(calcRes.copy).catch(() => {}); toast(`🧮 ${calcRes.text} — disalin`); return; }
  const bang = raw.split(' ')[0];
  const m = matches();
  if (BANGS[bang]) go(BANGS[bang] + encodeURIComponent(raw.slice(bang.length).trim()), newTab);
  else if (!e.shiftKey && m.length) openItem(m[0], newTab);
  else if (!e.shiftKey && looksLikeUrl(raw)) go(normalizeUrl(raw), newTab);
  else go((ENGINES[D.settings.engine] || ENGINES.google) + encodeURIComponent(raw), newTab);
});
$('#search-form').addEventListener('submit', (e) => e.preventDefault());

/* ================= Search mode: Web / Terjemah ================= */
const LANGS = {
  id: 'Indonesia', en: 'Inggris', ar: 'Arab', ja: 'Jepang', ko: 'Korea', 'zh-CN': 'Mandarin',
  jw: 'Jawa', su: 'Sunda', ms: 'Melayu', th: 'Thai', vi: 'Vietnam', fr: 'Prancis', de: 'Jerman',
  es: 'Spanyol', nl: 'Belanda', pt: 'Portugis', it: 'Italia', ru: 'Rusia', tr: 'Turki', hi: 'Hindi',
};
const POS_ID = { noun: 'kata benda', verb: 'kata kerja', adjective: 'kata sifat', adverb: 'kata keterangan', pronoun: 'kata ganti', preposition: 'kata depan', conjunction: 'kata sambung', interjection: 'seruan' };
const langName = (c) => LANGS[c] || LANGS[(c || '').split('-')[0]] || (c || '?').toUpperCase();
const isTrMode = () => D.settings.searchMode === 'translate';

function renderSearchMode() {
  const tr = isTrMode();
  $('#search-form').classList.toggle('tr', tr);
  $$('#mode-switch button').forEach((b) => {
    const on = b.dataset.mode === (tr ? 'translate' : 'web');
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
  });
  $('#mode-web-label').textContent = ENGINE_NAMES[D.settings.engine] || 'Web';
  const sel = $('#tr-lang');
  if (!sel.options.length) {
    Object.entries(LANGS).forEach(([code, name]) => { const o = el('option', null, `→ ${name}`); o.value = code; sel.append(o); });
  }
  sel.hidden = !tr;
  sel.value = D.settings.translate.target;
  searchInput.placeholder = tr ? 'Ketik teks untuk diterjemahkan…' : 'Cari di web, riwayat, atau shortcut…';
}
function setSearchMode(mode) {
  D.settings.searchMode = mode === 'translate' ? 'translate' : 'web';
  save();
  renderSearchMode();
  query = isTrMode() ? '' : searchInput.value.trim().toLowerCase();
  hideSugg();
  renderGroups();
  renderGrid();
  if (isTrMode() && searchInput.value.trim()) runTranslate(searchInput.value);
  if (!isTrMode()) closeTrPanel();
  searchInput.focus();
}
$$('#mode-switch button').forEach((b) => b.addEventListener('click', () => setSearchMode(b.dataset.mode)));
$('#tr-lang').addEventListener('change', (e) => {
  D.settings.translate.target = e.target.value;
  save();
  updateHint();
  if (searchInput.value.trim()) runTranslate(searchInput.value, { target: e.target.value });
  searchInput.focus();
});

/* ---- Translation (Google Translate's public endpoint; no key needed) ---- */
async function translateText(q, target, source = 'auto') {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dt=bd&dj=1' +
    `&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&q=${encodeURIComponent(q)}`;
  const j = await fetchJSON(url);
  return {
    text: (j.sentences || []).map((s) => s.trans || '').join(''),
    src: j.src || source,
    alts: (j.dict || []).map((d) => ({ pos: d.pos, terms: (d.terms || []).slice(0, 6) })),
  };
}

let trSeq = 0;
let trLast = null;
let trTimer;
async function runTranslate(raw, opts = {}) {
  const q = String(raw || '').trim();
  if (!q) { closeTrPanel(); return; }
  const seq = ++trSeq;
  let target = opts.target || D.settings.translate.target;
  const panel = $('#tr-panel');
  panel.hidden = false;
  panel.classList.add('loading');
  try {
    let r = await translateText(q, target, opts.source || 'auto');
    // Typed in the target language already? Translate the other way (Indonesia ↔ Inggris).
    if (!opts.target && !opts.source && r.src === target.split('-')[0]) {
      target = target === 'en' ? 'id' : 'en';
      r = await translateText(q, target, r.src);
    }
    if (seq !== trSeq) return;
    trLast = { q, src: r.src, target, text: r.text };
    $('#tr-langs').textContent = `${langName(r.src)} → ${langName(target)}`;
    $('#tr-text').textContent = r.text;
    $('#tr-text').lang = target;
    const alts = $('#tr-alts');
    alts.innerHTML = '';
    r.alts.forEach((a) => {
      const row = el('div', 'tr-alt');
      row.append(el('span', 'tr-pos', POS_ID[a.pos] || a.pos || ''), el('span', null, a.terms.join(', ')));
      alts.append(row);
    });
    alts.hidden = !r.alts.length;
  } catch {
    if (seq !== trSeq) return;
    $('#tr-langs').textContent = 'Terjemah';
    $('#tr-text').textContent = 'Tidak bisa menerjemahkan. Cek koneksi internet.';
    $('#tr-alts').hidden = true;
  } finally {
    if (seq === trSeq) panel.classList.remove('loading');
  }
}
function closeTrPanel() {
  trSeq++;
  clearTimeout(trTimer);
  $('#tr-panel').hidden = true;
  try { speechSynthesis.cancel(); } catch {}
}
$('#tr-close').addEventListener('click', closeTrPanel);
$('#tr-swap').addEventListener('click', () => {
  if (!trLast) return;
  searchInput.value = trLast.text;
  runTranslate(trLast.text, { source: trLast.target, target: trLast.src });
});
$('#tr-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(trLast?.text || ''); toast('Terjemahan disalin'); } catch { toast('Gagal menyalin'); }
});
$('#tr-speak').addEventListener('click', () => {
  if (!trLast?.text || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(trLast.text);
  u.lang = trLast.target;
  speechSynthesis.speak(u);
});
$('#tr-open').addEventListener('click', () => {
  if (!trLast) return;
  go(`https://translate.google.com/?sl=${encodeURIComponent(trLast.src)}&tl=${encodeURIComponent(trLast.target)}&text=${encodeURIComponent(trLast.q)}&op=translate`, true);
});

/* ================= Music: what's playing on YouTube ================= */
let ytTabs = {}; // tabId → state reported by yt-content.js (via background.js)
const fmtTime = (t) => {
  t = Math.max(0, Math.floor(t || 0));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};
function currentTrack() {
  const list = Object.values(ytTabs).filter((s) => s && s.title);
  if (!list.length) return null;
  const playing = list.filter((s) => !s.paused);
  return (playing.length ? playing : list).sort((a, b) => b.at - a.at)[0];
}
function trackPosition(t) {
  if (!t) return 0;
  const pos = t.currentTime + (t.paused ? 0 : (Date.now() - t.at) / 1000);
  return t.duration ? Math.min(t.duration, pos) : pos;
}

let musicKey = '';
function renderMusic(force) {
  if (!D.settings.widgets.music) return;
  const card = $('#w-music');
  const t = currentTrack();
  const key = t ? [t.tabId, t.title, t.artist, t.art, t.paused, t.ad, t.muted, t.repeat, t.shuffle, (t.upNext || []).map((q) => q.title).join('/'), D.settings.musicLyrics, D.settings.musicQueue].join('|') : 'none';
  if (key === musicKey && !force) { updateMusicProgress(); return; }
  musicKey = key;
  card.innerHTML = '';
  if (!t) {
    card.append(cardHead('Musik', 'YouTube'));
    const empty = el('div', 'mu-empty');
    const row = el('div', 'inline-form wrap');
    if (hasChrome && !ytStatus.allowed) {
      // Host access to YouTube is missing (usually: the extension wasn't reloaded after updating).
      empty.append(el('span', 'mu-note', '🔒'), document.createTextNode('Ekstensi belum punya izin membaca YouTube.'));
      const allow = el('button', 'btn primary sm', 'Izinkan akses YouTube');
      allow.onclick = async () => {
        try {
          const ok = await chrome.permissions.request({ origins: YT_ORIGINS });
          if (ok) { toast('Akses YouTube diizinkan'); probeYouTube(); }
        } catch {
          toast('Buka chrome://extensions lalu klik ↻ Reload pada Quick Access');
        }
      };
      row.append(allow);
      empty.append(row, el('div', 'mu-others', 'Kalau tombol ini tidak berhasil: buka chrome://extensions → klik ↻ Reload pada Quick Access.'));
      card.append(empty);
      return;
    }
    if (hasChrome && ytStatus.openTabs > 0) {
      // YouTube is open but its tab hasn't reported anything yet.
      empty.append(el('span', 'mu-note', '🔌'), document.createTextNode(
        `${ytStatus.openTabs} tab YouTube terbuka, tapi belum ada lagu yang terbaca. Putar lagunya, atau sambungkan ulang.`));
      const retry = el('button', 'btn primary sm', '↻ Sambungkan');
      retry.onclick = () => probeYouTube(true);
      const reload = el('button', 'btn ghost sm', 'Muat ulang tab YouTube');
      reload.onclick = async () => {
        const tabs = await chrome.tabs.query({ url: YT_ORIGINS }).catch(() => []);
        tabs.forEach((tb) => chrome.tabs.reload(tb.id));
        toast('Tab YouTube dimuat ulang — putar lagunya lagi');
      };
      row.append(retry, reload);
      empty.append(row);
      card.append(empty);
      return;
    }
    empty.append(el('span', 'mu-note', '🎧'), document.createTextNode(
      hasChrome ? 'Putar lagu di YouTube atau YouTube Music, nanti muncul di sini.' : 'Pemutar musik aktif setelah dipasang sebagai ekstensi Chrome.'));
    const a1 = el('button', 'btn ghost sm', '▶ YouTube Music');
    a1.onclick = () => go('https://music.youtube.com', true);
    const a2 = el('button', 'btn ghost sm', '▶ YouTube');
    a2.onclick = () => go('https://www.youtube.com', true);
    row.append(a1, a2);
    empty.append(row);
    card.append(empty);
    return;
  }
  const bg = el('div', 'mu-bg');
  if (t.art) bg.style.backgroundImage = `url("${t.art.replace(/"/g, '%22')}")`;
  const head = cardHead('Musik', '');
  const src = el('span', 'mu-src');
  src.append(el('i'), document.createTextNode(t.music ? 'YouTube Music' : 'YouTube'));
  if (!t.paused) { const eq = el('span', 'mu-eq'); eq.append(el('b'), el('b'), el('b')); src.append(eq); }
  head.lastChild.replaceWith(src);

  const top = el('div', 'mu-top');
  const img = el('img', 'mu-art');
  img.alt = '';
  if (t.art) img.src = t.art;
  img.onerror = () => { img.removeAttribute('src'); };
  const meta = el('div', 'mu-meta');
  meta.append(el('div', 'mu-title', t.ad ? `Iklan · ${t.title}` : t.title), el('div', 'mu-artist', t.artist || ''));
  top.append(img, meta);

  const bar = el('div', 'mu-bar');
  bar.title = 'Klik untuk lompat';
  bar.append(el('div', 'mu-fill'));
  bar.onclick = (e) => {
    const r = bar.getBoundingClientRect();
    ytCommand('seek', { frac: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) });
  };
  const times = el('div', 'mu-times');
  times.append(el('span', 'mu-cur'), el('span', 'mu-dur'));

  const ctrl = el('div', 'mu-ctrl');
  const btn = (cls, label, title, cmd) => {
    const b = el('button', cls, label);
    b.title = title;
    b.setAttribute('aria-label', title);
    b.onclick = () => ytCommand(cmd);
    return b;
  };
  ctrl.append(
    btn('mu-prev', '⏮', 'Sebelumnya', 'prev'),
    btn('mu-play', t.paused ? '▶' : '⏸', t.paused ? 'Putar' : 'Jeda', 'toggle'),
    btn('mu-next', '⏭', 'Berikutnya', 'next'),
  );
  const open = el('button', 'mu-open', '↗');
  open.title = 'Buka tab YouTube';
  open.onclick = async () => {
    try {
      const tab = await chrome.tabs.update(t.tabId, { active: true });
      if (tab?.windowId != null) chrome.windows.update(tab.windowId, { focused: true });
    } catch { toast('Tab YouTube sudah ditutup'); }
  };
  ctrl.append(open);

  // Second row: volume, repeat, shuffle, lyrics, queue.
  const ctrl2 = el('div', 'mu-ctrl2');
  const mute = el('button', 'mu-mini', t.muted || t.volume === 0 ? '🔇' : t.volume < 0.5 ? '🔉' : '🔊');
  mute.title = t.muted ? 'Bunyikan' : 'Bisukan';
  mute.onclick = () => ytCommand('mute');
  const vol = el('input', 'mu-vol');
  vol.type = 'range';
  vol.min = '0';
  vol.max = '100';
  vol.value = String(Math.round((t.muted ? 0 : t.volume ?? 1) * 100));
  vol.title = 'Volume';
  vol.style.setProperty('--v', `${vol.value}%`);
  let volTimer;
  vol.oninput = () => {
    vol.style.setProperty('--v', `${vol.value}%`);
    clearTimeout(volTimer);
    volTimer = setTimeout(() => ytCommand('volume', { value: vol.value / 100 }), 60);
  };
  const rep = el('button', 'mu-mini' + (t.repeat && t.repeat !== 'off' ? ' on' : ''), t.repeat === 'one' ? '🔂' : '🔁');
  rep.title = t.repeat === 'one' ? 'Ulangi lagu ini (aktif)' : t.repeat === 'all' ? 'Ulangi semua (aktif)' : 'Ulangi';
  rep.onclick = () => ytCommand('repeat');
  ctrl2.append(mute, vol, rep);
  if (t.shuffle) {
    const shf = el('button', 'mu-mini', '🔀');
    shf.title = 'Acak antrean';
    shf.onclick = () => { ytCommand('shuffle'); toast('Antrean diacak'); };
    ctrl2.append(shf);
  }
  const lyr = el('button', 'mu-mini' + (D.settings.musicLyrics ? ' on' : ''), '📜');
  lyr.title = 'Lirik';
  lyr.onclick = () => { D.settings.musicLyrics = !D.settings.musicLyrics; save(); renderMusic(true); };
  const que = el('button', 'mu-mini' + (D.settings.musicQueue ? ' on' : ''), '☰');
  que.title = 'Lagu berikutnya';
  que.onclick = () => { D.settings.musicQueue = !D.settings.musicQueue; save(); renderMusic(true); };
  ctrl2.append(lyr, que);

  card.append(bg, head, top, bar, times, ctrl, ctrl2);

  if (D.settings.musicLyrics) {
    const box = el('div', 'mu-lyrics');
    box.id = 'mu-lyrics';
    card.append(box);
    loadLyrics(t);
  }
  if (D.settings.musicQueue) {
    const list = el('div', 'mu-queue');
    const items = t.upNext || [];
    list.append(el('div', 'mu-qhead', items[0]?.suggestion ? 'Saran berikutnya' : 'Berikutnya'));
    if (!items.length) list.append(el('div', 'mu-qempty', t.music ? 'Antrean kosong.' : 'Buka playlist untuk melihat antrean.'));
    items.forEach((q, i) => {
      const row = el('button', 'mu-qitem');
      row.type = 'button';
      row.title = 'Putar lagu ini';
      row.append(el('span', 'qn', String(i + 1)), el('span', 'qt', q.title), el('span', 'qa', q.artist || ''));
      row.onclick = () => ytCommand('queue', { index: i });
      list.append(row);
    });
    card.append(list);
  }
  const others = Object.values(ytTabs).filter((s) => s && s.title && s !== t).length;
  if (others) card.append(el('div', 'mu-others', `+${others} tab YouTube lain`));
  updateMusicProgress();
}
function updateMusicProgress() {
  const t = currentTrack();
  const card = $('#w-music');
  const fill = $('.mu-fill', card);
  if (!t || !fill) return;
  const pos = trackPosition(t);
  fill.style.width = t.duration ? `${(pos / t.duration) * 100}%` : '0%';
  $('.mu-cur', card).textContent = fmtTime(pos);
  $('.mu-dur', card).textContent = t.duration ? fmtTime(t.duration) : '–:–';
  drawLyrics(false);
  // keep the volume slider in sync unless the user is dragging it
  const vol = $('.mu-vol', card);
  if (vol && document.activeElement !== vol) { const v = Math.round((t.muted ? 0 : t.volume ?? 1) * 100); if (+vol.value !== v) { vol.value = v; vol.style.setProperty('--v', `${v}%`); } }
}
/* ---- Lyrics (lrclib.net: free, synced lyrics when available) ---- */
const lyricsCache = new Map();
let lyricsFor = '';
let lyricsData = null; // { synced: [{t, text}], plain: '' } | { none: true }

// "Artist - Song (Official Music Video) [HD] ft. X" → { artist, title }
function cleanTrack(t) {
  let title = t.title || '';
  let artist = (t.artist || '').replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').replace(/\s*Official$/i, '').trim();
  title = title.replace(/[([【][^)\]】]*(official|video|lyric|lirik|audio|mv|m\/v|hd|4k|visualizer|live|remaster)[^)\]】]*[)\]】]/gi, '');
  title = title.replace(/\b(official\s+(music\s+)?video|lyric(s)?\s+video|video\s+lirik|official\s+audio|mv)\b/gi, '');
  const dash = title.split(/\s+[-–—|]\s+/);
  if (dash.length >= 2 && !t.music) { artist = dash[0].trim(); title = dash.slice(1).join(' - '); }
  title = title.replace(/\s+(ft\.?|feat\.?|featuring)\s+.*$/i, '').replace(/["“”]/g, '').replace(/\s{2,}/g, ' ').trim();
  artist = artist.replace(/\s+(ft\.?|feat\.?|x|&)\s+.*$/i, '').trim();
  return { artist, title };
}
function parseLrc(lrc) {
  const out = [];
  for (const line of String(lrc || '').split('\n')) {
    const m = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (m) out.push({ t: +m[1] * 60 + +m[2], text: m[3].trim() });
  }
  return out;
}
async function fetchLyrics(t) {
  const { artist, title } = cleanTrack(t);
  const q = (o) => new URLSearchParams(o).toString();
  const pickBest = (list) => (list || []).find((x) => x.syncedLyrics) || (list || []).find((x) => x.plainLyrics) || null;
  let hit = null;
  try {
    const r = await fetch(`https://lrclib.net/api/get?${q({ track_name: title, artist_name: artist, ...(t.duration ? { duration: Math.round(t.duration) } : {}) })}`);
    if (r.ok) hit = await r.json();
  } catch {}
  if (!hit || (!hit.syncedLyrics && !hit.plainLyrics)) {
    try { hit = pickBest(await fetchJSON(`https://lrclib.net/api/search?${q({ track_name: title, artist_name: artist })}`)); } catch {}
  }
  if (!hit) {
    try { hit = pickBest(await fetchJSON(`https://lrclib.net/api/search?${q({ q: `${title} ${artist}`.trim() })}`)); } catch {}
  }
  if (!hit) return { none: true, query: `${artist} – ${title}` };
  return { synced: parseLrc(hit.syncedLyrics), plain: hit.plainLyrics || '', name: `${hit.artistName} – ${hit.trackName}` };
}
async function loadLyrics(t) {
  const key = `${t.title}|${t.artist}`;
  const box = $('#mu-lyrics');
  if (!box) return;
  if (lyricsFor === key && lyricsData) { drawLyrics(true); return; }
  lyricsFor = key;
  lyricsData = null;
  box.innerHTML = '';
  box.append(el('div', 'ly-msg', 'Mencari lirik…'));
  let data = lyricsCache.get(key);
  if (!data) {
    data = await fetchLyrics(t);
    lyricsCache.set(key, data);
  }
  if (lyricsFor !== key) return;
  lyricsData = data;
  drawLyrics(true);
}
let lyricsLine = -2;
function drawLyrics(rebuild) {
  const box = $('#mu-lyrics');
  if (!box || !lyricsData) return;
  const t = currentTrack();
  if (lyricsData.none) {
    if (rebuild) { box.innerHTML = ''; box.append(el('div', 'ly-msg', 'Lirik tidak ditemukan untuk lagu ini 😔')); }
    return;
  }
  if (!lyricsData.synced.length) {
    if (rebuild) { box.innerHTML = ''; const p = el('div', 'ly-plain', lyricsData.plain); box.append(p); }
    return;
  }
  if (rebuild) {
    box.innerHTML = '';
    lyricsData.synced.forEach((l, i) => {
      const d = el('div', 'ly-line', l.text || '♪');
      d.dataset.i = i;
      d.onclick = () => t && t.duration && ytCommand('seek', { frac: l.t / t.duration });
      box.append(d);
    });
    lyricsLine = -2;
  }
  const pos = t ? trackPosition(t) + 0.3 : 0;
  let idx = -1;
  for (let i = 0; i < lyricsData.synced.length; i++) { if (lyricsData.synced[i].t <= pos) idx = i; else break; }
  if (idx === lyricsLine) return;
  lyricsLine = idx;
  $$('.ly-line', box).forEach((d, i) => { d.classList.toggle('now', i === idx); d.classList.toggle('past', i < idx); });
  const cur = box.children[Math.max(0, idx)];
  if (cur) box.scrollTo({ top: cur.offsetTop - box.clientHeight / 2 + cur.offsetHeight / 2, behavior: rebuild ? 'auto' : 'smooth' });
}

/* ---- Music visualizer: a soft wave along the bottom of the page ---- */
const viz = { bands: null, at: 0, raf: 0, smooth: new Array(24).fill(0), lastPing: 0 };
if (hasChrome && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg?.type !== 'yt-viz') return;
    const t = currentTrack();
    if (t && sender.tab && sender.tab.id === t.tabId) { viz.bands = msg.bands; viz.at = performance.now(); }
  });
}
function vizCanvas() {
  let c = $('#mu-viz');
  if (!c) {
    c = el('canvas');
    c.id = 'mu-viz';
    c.setAttribute('aria-hidden', 'true');
    $('#bg-dim').after(c);
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(innerWidth * dpr), h = Math.round(180 * dpr);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
}
function updateVisualizer() {
  const on = D.settings.musicViz && !fxReduce;
  if (!on) { cancelAnimationFrame(viz.raf); viz.raf = 0; const c = $('#mu-viz'); if (c) c.hidden = true; return; }
  vizCanvas().hidden = false;
  if (!viz.raf) viz.raf = requestAnimationFrame(drawVisualizer);
}
function drawVisualizer(time) {
  viz.raf = requestAnimationFrame(drawVisualizer);
  if (document.hidden) return;
  const c = vizCanvas();
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  const t = currentTrack();
  const playing = !!(t && !t.paused);
  // Ask the YouTube tab for levels about once a second while something plays.
  if (playing && hasChrome && chrome.tabs && time - viz.lastPing > 1000) {
    viz.lastPing = time;
    chrome.tabs.sendMessage(t.tabId, { type: 'yt-viz-on' }).catch(() => {});
  }
  const live = viz.bands && time - viz.at < 600;
  const n = viz.smooth.length;
  for (let i = 0; i < n; i++) {
    // Real levels when the tab sends them; otherwise a gentle "breathing" wave while music plays.
    const target = live ? viz.bands[i] / 255 : playing ? 0.18 + 0.12 * Math.sin(time / 380 + i * 0.7) * Math.sin(time / 910 + i * 0.3) : 0;
    viz.smooth[i] += (target - viz.smooth[i]) * 0.25;
  }
  if (viz.smooth.every((v) => v < 0.01)) return;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8b9dff';
  const grad = g.createLinearGradient(0, H, 0, 0);
  grad.addColorStop(0, `${accent}66`);
  grad.addColorStop(1, `${accent}00`);
  // Mirror the bands so the wave is symmetric, then draw a smooth curve through them.
  const pts = [...viz.smooth.slice().reverse(), ...viz.smooth];
  const step = W / (pts.length - 1);
  g.beginPath();
  g.moveTo(0, H);
  pts.forEach((v, i) => {
    const x = i * step, y = H - v * H * 0.95;
    if (i === 0) g.lineTo(x, y);
    else { const px = (i - 1) * step, py = H - pts[i - 1] * H * 0.95; g.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2); }
  });
  g.lineTo(W, H);
  g.closePath();
  g.fillStyle = grad;
  g.fill();
}
async function ytCommand(cmd, extra = {}) {
  const t = currentTrack();
  if (!t || !hasChrome || !chrome.tabs) return;
  // Instant feedback for play/pause; the tab confirms shortly after.
  if (cmd === 'toggle') {
    t.currentTime = trackPosition(t);
    t.at = Date.now();
    t.paused = !t.paused;
    renderMusic(true);
  }
  try {
    await chrome.tabs.sendMessage(t.tabId, { type: 'yt-cmd', cmd, ...extra });
  } catch {
    toast('Tab YouTube tidak merespons — muat ulang tab YouTube-nya sekali');
  }
}
const YT_ORIGINS = ['https://www.youtube.com/*', 'https://music.youtube.com/*'];
let ytStatus = { allowed: true, openTabs: 0 };

// Find open YouTube tabs and make sure each one runs the reader script (e.g. tabs opened
// before the extension was installed or reloaded).
async function probeYouTube(manual) {
  if (!hasChrome || !chrome.tabs) return;
  try { ytStatus.allowed = chrome.permissions ? await chrome.permissions.contains({ origins: YT_ORIGINS }) : true; } catch { ytStatus.allowed = true; }
  let tabs = [];
  if (ytStatus.allowed) { try { tabs = await chrome.tabs.query({ url: YT_ORIGINS }); } catch {} }
  ytStatus.openTabs = tabs.length;
  for (const tb of tabs) {
    if (ytTabs[tb.id] && !manual) continue;
    try {
      await chrome.tabs.sendMessage(tb.id, { type: 'yt-ping' });
    } catch {
      try { await chrome.scripting.executeScript({ target: { tabId: tb.id }, files: ['yt-content.js'] }); } catch {}
    }
  }
  renderMusic(true);
  if (manual) toast(tabs.length ? `Menyambung ke ${tabs.length} tab YouTube…` : 'Tidak ada tab YouTube yang terbuka');
}

async function loadMusic() {
  if (!hasChrome || !chrome.storage.session) { renderMusic(true); return; }
  try { ytTabs = (await chrome.storage.session.get('qa-yt'))['qa-yt'] || {}; } catch { ytTabs = {}; }
  renderMusic(true);
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'session' || !ch['qa-yt']) return;
    ytTabs = ch['qa-yt'].newValue || {};
    renderMusic();
  });
  probeYouTube();
  // Coming back to this tab (e.g. after starting a song): look again.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) probeYouTube(); });
}

/* ================= Keyboard ================= */
function isTyping(e) {
  const t = e.target;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable;
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && undoStack && !isTyping(e)) {
    D.shortcuts.splice(Math.min(undoStack.idx, D.shortcuts.length), 0, undoStack.item);
    undoStack = null;
    save();
    renderShortcuts();
    toast('Dikembalikan');
    return;
  }
  if (document.querySelector('dialog[open]')) return;
  if (e.key === 'Escape') {
    closeAddMenu();
    if (editingLayout) { setEditLayout(false); toast('Tata letak disimpan'); return; }
    if (focusMode) { setFocusMode(false); return; }
    if ($('#drawer').classList.contains('open')) return closeDrawer();
    if (!$('#tr-panel').hidden) { closeTrPanel(); return; }
    if (searchInput.value) { clearSearch(); renderGroups(); renderGrid(); }
    searchInput.blur();
    return;
  }
  if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault();
    const ids = [...(hasFrequent() ? [FREQ] : []), ...D.groups.map((g) => g.id)];
    const i = ids.indexOf(D.activeGroup);
    selectGroup(ids[(i + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length]);
    return;
  }
  if (isTyping(e) || $('#drawer').classList.contains('open')) return;
  if (e.key === '/') { e.preventDefault(); searchInput.focus(); return; }
  if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
    const s = visibleShortcuts()[+e.key - 1];
    if (s) openItem(s);
  }
});

/* ================= Weather ================= */
const WMO = {
  0: ['☀️', 'Cerah'], 1: ['🌤️', 'Cerah berawan'], 2: ['⛅', 'Berawan sebagian'], 3: ['☁️', 'Mendung'],
  45: ['🌫️', 'Berkabut'], 48: ['🌫️', 'Kabut beku'],
  51: ['🌦️', 'Gerimis ringan'], 53: ['🌦️', 'Gerimis'], 55: ['🌧️', 'Gerimis lebat'],
  56: ['🌧️', 'Gerimis beku'], 57: ['🌧️', 'Gerimis beku'],
  61: ['🌦️', 'Hujan ringan'], 63: ['🌧️', 'Hujan sedang'], 65: ['🌧️', 'Hujan lebat'],
  66: ['🌧️', 'Hujan beku'], 67: ['🌧️', 'Hujan beku'],
  71: ['🌨️', 'Salju ringan'], 73: ['🌨️', 'Salju'], 75: ['❄️', 'Salju lebat'], 77: ['❄️', 'Butiran salju'],
  80: ['🌦️', 'Hujan lokal'], 81: ['🌧️', 'Hujan lokal'], 82: ['⛈️', 'Hujan deras'],
  85: ['🌨️', 'Salju lokal'], 86: ['🌨️', 'Salju lokal'],
  95: ['⛈️', 'Badai petir'], 96: ['⛈️', 'Badai petir & es'], 99: ['⛈️', 'Badai petir & es'],
};
const wmo = (code, isDay = 1) => {
  const [e, t] = WMO[code] || ['🌡️', '—'];
  return [(code === 0 || code === 1) && !isDay ? '🌙' : e, t];
};

async function getGeo() {
  const city = (D.settings.city || '').trim();
  if (!city) throw new Error('nocity');
  const cache = await Store.get('qa-geo');
  if (cache && cache.q === city.toLowerCase()) return cache;
  const j = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`);
  if (!j.results || !j.results.length) throw new Error('notfound');
  const g = j.results[0];
  const geo = { q: city.toLowerCase(), lat: g.latitude, lon: g.longitude, name: g.name, region: g.admin1 || g.country || '' };
  await Store.set('qa-geo', geo);
  return geo;
}

function cardHead(title, sub) {
  const h = el('div', 'card-head');
  h.append(el('span', null, title), el('span', 'muted', sub || ''));
  return h;
}
function cardState(card, title, msg, withSettings) {
  card.innerHTML = '';
  card.append(cardHead(title));
  const st = el('div', 'state', msg);
  if (withSettings) {
    const b = el('button', 'link-btn', 'Ubah lokasi di Pengaturan →');
    b.onclick = () => { openDrawer(); setTimeout(() => $('#set-city').focus(), 350); };
    st.append(el('br'), b);
  }
  card.append(st);
}
function geoError(err) {
  if (err.message === 'notfound') return ['Kota tidak ditemukan.', true];
  if (err.message === 'nocity') return ['Lokasi belum diatur.', true];
  return ['Tidak bisa memuat data. Cek koneksi internet.', false];
}

async function loadWeather(geo) {
  const card = $('#w-weather');
  const cache = await Store.get('qa-weather');
  let data;
  if (cache && cache.lat === geo.lat && cache.lon === geo.lon && cache.data?.hourly && Date.now() - cache.at < 30 * 60 * 1000) {
    data = cache.data;
  } else {
    data = await fetchJSON(`https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
      '&hourly=temperature_2m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7');
    await Store.set('qa-weather', { at: Date.now(), lat: geo.lat, lon: geo.lon, data });
  }
  const c = data.current;
  const [emoji, desc] = wmo(c.weather_code, c.is_day);
  setWeatherFx(c.weather_code, c.is_day);
  card.innerHTML = '';
  card.append(cardHead('Cuaca', geo.name));
  const main = el('div', 'wx-main');
  const right = el('div');
  right.append(el('div', 'wx-temp', `${Math.round(c.temperature_2m)}°`), el('div', 'wx-desc', desc));
  main.append(el('div', 'wx-emoji', emoji), right);
  const meta = el('div', 'wx-meta');
  const rain = data.daily.precipitation_probability_max?.[0];
  meta.append(
    el('span', null, `Terasa ${Math.round(c.apparent_temperature)}°`),
    el('span', null, `💧 ${c.relative_humidity_2m}%`),
    el('span', null, `💨 ${Math.round(c.wind_speed_10m)} km/j`),
    ...(rain != null ? [el('span', null, `☔ ${rain}%`)] : []),
  );
  const days = el('div', 'wx-days');
  for (let i = 1; i <= 3; i++) {
    const d = el('div', 'wx-day');
    const date = new Date(data.daily.time[i] + 'T00:00');
    d.append(
      el('span', null, date.toLocaleDateString('id-ID', { weekday: 'short' })),
      el('span', 'e', wmo(data.daily.weather_code[i])[0]),
    );
    const temps = el('span');
    temps.append(document.createTextNode(`${Math.round(data.daily.temperature_2m_max[i])}° `), el('span', 'lo', `${Math.round(data.daily.temperature_2m_min[i])}°`));
    d.append(temps);
    days.append(d);
  }
  card.append(main, meta, days);
  window.QAX?.weatherDetail(card, data, geo);
}

/* ================= Prayer times + qibla ================= */
const PRAYERS = [
  ['Imsak', 'Imsak', true], ['Subuh', 'Fajr'], ['Terbit', 'Sunrise', true],
  ['Dzuhur', 'Dhuhr'], ['Ashar', 'Asr'], ['Maghrib', 'Maghrib'], ['Isya', 'Isha'],
];
let prayerTimes = null;
let prayerNextKey = '';

function qiblaInfo(lat, lon) {
  const rad = Math.PI / 180;
  const k = { lat: 21.4225, lon: 39.8262 };
  const p1 = lat * rad, p2 = k.lat * rad, dl = (k.lon - lon) * rad;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  const deg = (Math.atan2(y, x) / rad + 360) % 360;
  const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dirs = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  return { deg, km, dir: dirs[Math.round(deg / 45) % 8] };
}
function qiblaNode(geo) {
  const q = qiblaInfo(geo.lat, geo.lon);
  const wrap = el('div', 'qibla');
  wrap.innerHTML = `<svg viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)"/>
      <text x="22" y="9.5" text-anchor="middle" font-size="7" fill="currentColor" opacity="0.6">U</text>
      <g class="needle" style="transform: rotate(${q.deg.toFixed(1)}deg)">
        <path d="M22 7 L26 23 L22 21 L18 23 Z" fill="var(--accent)"/>
        <path d="M22 37 L25 23 L22 25 L19 23 Z" fill="rgba(255,255,255,0.3)"/>
      </g>
      <circle cx="22" cy="22" r="2" fill="#fff"/></svg>`;
  const txt = el('div');
  const line = el('div');
  line.append(document.createTextNode('🕋 Arah kiblat '), el('b', null, `${Math.round(q.deg)}°`), document.createTextNode(` dari utara (${q.dir})`));
  txt.append(line, el('div', 'muted small', `± ${Math.round(q.km).toLocaleString('id-ID')} km ke Makkah`));
  wrap.append(txt);
  return wrap;
}

async function loadPrayer(geo) {
  const now = new Date();
  const dateKey = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
  const cache = await Store.get('qa-prayer');
  let timings;
  if (cache && cache.date === dateKey && cache.lat === geo.lat && cache.lon === geo.lon) {
    timings = cache.timings;
  } else {
    // method 20 = Kementerian Agama RI
    const j = await fetchJSON(`https://api.aladhan.com/v1/timings/${dateKey}?latitude=${geo.lat}&longitude=${geo.lon}&method=20`);
    timings = j.data.timings;
    await Store.set('qa-prayer', { date: dateKey, lat: geo.lat, lon: geo.lon, timings });
  }
  prayerTimes = PRAYERS.map(([name, key, minor]) => {
    const [h, m] = String(timings[key] || '00:00').slice(0, 5).split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return { name, key, minor: !!minor, date: d, label: `${pad(h)}:${pad(m)}` };
  });

  const card = $('#w-prayer');
  card.innerHTML = '';
  const az = D.settings.azan;
  card.append(cardHead('Jadwal Sholat', `${geo.name}${az.enabled ? ' · 🔔' : ''}`));
  const next = el('div', 'pr-next');
  next.append(el('div', 'lbl'), el('div', 'cd'));
  const ul = el('ul', 'pr-list');
  prayerTimes.forEach((p) => {
    const li = el('li', p.minor ? 'minor' : '');
    const name = el('span', null, p.name);
    if (!p.minor && az.enabled && az[p.key] === false) name.append(el('span', 'muted small', ' 🔕'));
    li.append(name, el('span', null, p.label));
    ul.append(li);
  });
  card.append(next, ul, qiblaNode(geo));
  prayerNextKey = '';
  updatePrayerCountdown(now);
}

function updatePrayerCountdown(now) {
  if (!prayerTimes || !D.settings.widgets.prayer) return;
  const main = prayerTimes.filter((p) => !p.minor);
  let next = main.find((p) => p.date > now);
  let target;
  if (next) target = next.date;
  else { next = main[0]; target = new Date(next.date.getTime() + 864e5); } // Subuh tomorrow (approx.)
  const diff = Math.max(0, Math.floor((target - now) / 1000));
  const card = $('#w-prayer');
  const lbl = $('.pr-next .lbl', card), cd = $('.pr-next .cd', card);
  if (!lbl) return;
  lbl.textContent = `Menuju ${next.name}`;
  cd.textContent = `${pad(Math.floor(diff / 3600))}:${pad(Math.floor((diff % 3600) / 60))}:${pad(diff % 60)}`;
  const key = next.name + now.getDate();
  if (key !== prayerNextKey) {
    prayerNextKey = key;
    $$('.pr-list li', card).forEach((li, i) => {
      const p = prayerTimes[i];
      li.classList.toggle('next', p === next);
      li.classList.toggle('passed', p.date <= now && p !== next);
    });
  }
}

async function loadWidgets() {
  const w = D.settings.widgets;
  if (!w.weather && !w.prayer) return;
  if (w.weather) cardState($('#w-weather'), 'Cuaca', 'Memuat…');
  if (w.prayer) cardState($('#w-prayer'), 'Jadwal Sholat', 'Memuat…');
  let geo;
  try { geo = await getGeo(); } catch (err) {
    const [msg, s] = geoError(err);
    if (w.weather) cardState($('#w-weather'), 'Cuaca', msg, s);
    if (w.prayer) cardState($('#w-prayer'), 'Jadwal Sholat', msg, s);
    return;
  }
  if (w.weather) loadWeather(geo).catch(() => cardState($('#w-weather'), 'Cuaca', 'Tidak bisa memuat cuaca. Cek koneksi internet.'));
  if (w.prayer) loadPrayer(geo).catch(() => cardState($('#w-prayer'), 'Jadwal Sholat', 'Tidak bisa memuat jadwal. Cek koneksi internet.'));
}

/* ================= Daily verse ================= */
async function loadAyah() {
  const box = $('#ayah');
  if (!D.settings.widgets.ayah) { box.hidden = true; return; }
  const now = new Date();
  const key = dayKey(now);
  let c = await Store.get('qa-ayah');
  if (!c || c.day !== key) {
    const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    const [s, a, name] = AYAHS[(doy + now.getFullYear()) % AYAHS.length];
    try {
      const j = await fetchJSON(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-uthmani,id.indonesian`);
      c = { day: key, ar: j.data[0].text, id: j.data[1].text, ref: `QS ${name} (${s}): ${a}` };
      await Store.set('qa-ayah', c);
    } catch {
      if (!c) { box.hidden = true; return; }
    }
  }
  $('#ayah-ar').textContent = c.ar;
  $('#ayah-text').textContent = `“${c.id}”`;
  $('#ayah-ref').textContent = `— ${c.ref}`;
  box.title = 'Klik untuk menampilkan teks Arab';
  box.hidden = false;
}
$('#ayah').addEventListener('click', () => $('#ayah').classList.toggle('open'));

/* ================= Pomodoro ================= */
const RING = 2 * Math.PI * 52;
let pomo = null;
const defPomo = () => ({ mode: 'work', running: false, endAt: null, remaining: null, day: dayKey(), count: 0 });
function pomoDur(mode) {
  const p = D.settings.pomo;
  return (mode === 'work' ? p.work : mode === 'long' ? p.long : p.short) * 60;
}
function pomoRemaining() {
  if (pomo.running && pomo.endAt) return Math.max(0, Math.round((pomo.endAt - Date.now()) / 1000));
  return pomo.remaining ?? pomoDur(pomo.mode);
}
function savePomo() { Store.set('qa-pomo', pomo); }
function pomoStart() {
  pomo.remaining = pomoRemaining() || pomoDur(pomo.mode);
  pomo.running = true;
  pomo.endAt = Date.now() + pomo.remaining * 1000;
  savePomo(); renderPomo();
}
function pomoPause() {
  pomo.remaining = pomoRemaining();
  pomo.running = false;
  pomo.endAt = null;
  savePomo(); renderPomo();
}
function pomoReset(mode = pomo.mode) {
  pomo.mode = mode;
  pomo.running = false;
  pomo.endAt = null;
  pomo.remaining = null;
  savePomo(); renderPomo();
}
// Used only in preview (no background worker); the extension's background.js does this otherwise.
function pomoFinishLocal() {
  const p = D.settings.pomo;
  if (pomo.mode === 'work') {
    pomo.count = (pomo.count || 0) + 1;
    pomo.hist = { ...(pomo.hist || {}), [dayKey()]: pomo.count };
    pomo.mode = pomo.count % p.every === 0 ? 'long' : 'short';
    toast('Sesi fokus selesai — waktunya istirahat ☕');
  } else {
    pomo.mode = 'work';
    toast('Istirahat selesai — ayo fokus lagi 💪');
  }
  pomo.remaining = null;
  pomo.running = !!p.auto;
  pomo.endAt = p.auto ? Date.now() + pomoDur(pomo.mode) * 1000 : null;
  if (D.settings.sound) playChime('pomo', D.settings.volume / 100);
  savePomo();
}

let lastPomoSig = '';
function renderPomo() {
  if (!pomo || !D.settings.widgets.pomo) { if (pomo && !pomo.running) document.title = 'Tab Baru'; return; }
  const today = dayKey();
  if (pomo.day !== today) { pomo.day = today; pomo.count = 0; }
  const sig = `${pomo.mode}|${!!pomo.running}`;
  if (lastPomoSig && sig !== lastPomoSig) window.QAPet?.event('pomo', { mode: pomo.mode, running: !!pomo.running, remaining: pomoRemaining() });
  if (lastPomoSig && sig !== lastPomoSig) window.QAX?.renderStats();
  lastPomoSig = sig;
  let rem = pomoRemaining();
  if (pomo.running && rem <= 0 && !hasChrome) { pomoFinishLocal(); rem = pomoRemaining(); }
  const total = pomoDur(pomo.mode);
  const isWork = pomo.mode === 'work';
  $('#pomo-time').textContent = `${pad(Math.floor(rem / 60))}:${pad(rem % 60)}`;
  $('#pomo-label').textContent = pomo.running
    ? (isWork ? 'Sedang fokus…' : 'Sedang istirahat…')
    : rem < total ? 'Dijeda' : isWork ? 'Siap fokus' : 'Siap istirahat';
  $('#pomo-ring').style.strokeDashoffset = String(RING * (1 - Math.min(1, rem / total)));
  $('#pomo-toggle').textContent = pomo.running ? 'Jeda' : rem < total ? 'Lanjut' : 'Mulai';
  $$('#pomo-modes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === pomo.mode));
  $('#w-pomo').classList.toggle('break', !isWork);
  $('#pomo-count').textContent = pomo.count ? `${pomo.count} sesi hari ini` : '';
  const every = D.settings.pomo.every;
  const totalDots = Math.max(every, Math.ceil((pomo.count + 1) / every) * every);
  const dots = $('#pomo-dots');
  if (dots.childElementCount !== totalDots || dots.dataset.c !== String(pomo.count)) {
    dots.innerHTML = '';
    for (let i = 0; i < totalDots; i++) dots.append(el('i', i < pomo.count ? 'on' : ''));
    dots.dataset.c = String(pomo.count);
  }
  document.title = pomo.running ? `⏱ ${pad(Math.floor(rem / 60))}:${pad(rem % 60)} · ${isWork ? 'Fokus' : 'Istirahat'}` : 'Tab Baru';
}
$('#pomo-ring').style.strokeDasharray = String(RING);
$('#pomo-toggle').addEventListener('click', () => (pomo.running ? pomoPause() : pomoStart()));
$('#pomo-reset').addEventListener('click', () => pomoReset());
$('#pomo-skip').addEventListener('click', () => pomoReset(pomo.mode === 'work' ? 'short' : 'work'));
$$('#pomo-modes button').forEach((b) => b.addEventListener('click', () => {
  if (pomo.running && !confirm('Timer sedang berjalan. Ganti mode?')) return;
  pomoReset(b.dataset.mode);
}));

/* ================= Calendar ================= */
let calMonth = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
const SHORT_MONTH = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

function eventsByDate() {
  const map = {};
  (D.countdowns || []).forEach((c) => { (map[c.date] ||= []).push(c.name); });
  return map;
}

function renderCalendar() {
  if (!D.settings.widgets.calendar) return;
  const card = $('#w-calendar');
  card.innerHTML = '';
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const head = el('div', 'cal-head');
  const prev = el('button', null, '‹'); prev.title = 'Bulan sebelumnya';
  const next = el('button', null, '›'); next.title = 'Bulan berikutnya';
  const title = el('button', 't', calMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
  title.style.textAlign = 'left';
  title.title = 'Kembali ke bulan ini';
  prev.onclick = () => { calMonth = new Date(y, m - 1, 1); renderCalendar(); };
  next.onclick = () => { calMonth = new Date(y, m + 1, 1); renderCalendar(); };
  title.onclick = () => { const d = new Date(); calMonth = new Date(d.getFullYear(), d.getMonth(), 1); renderCalendar(); };
  head.append(title, prev, next);
  card.append(head);

  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
  const h1 = hijri(first), h2 = hijri(last);
  if (h1 && h2) {
    const txt = h1.m === h2.m ? `${HIJRI_MONTHS[h1.m - 1]} ${h1.y} H`
      : `${HIJRI_MONTHS[h1.m - 1]}${h1.y !== h2.y ? ' ' + h1.y : ''} – ${HIJRI_MONTHS[h2.m - 1]} ${h2.y} H`;
    card.append(el('div', 'cal-hijri', txt));
  }

  const grid = el('div', 'cal-grid');
  ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].forEach((d, i) => grid.append(el('div', 'wd' + (i === 6 ? ' sun' : ''), d)));
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  const rows = Math.ceil((offset + last.getDate()) / 7);
  const hol = { ...holidays(y - (m === 0 ? 1 : 0)), ...holidays(y), ...holidays(y + (m === 11 ? 1 : 0)) };
  const evs = eventsByDate();
  const todayKey = dayKey();
  const listItems = [];
  for (let i = 0; i < rows * 7; i++) {
    const d = addDays(start, i);
    const k = ymd(d);
    const inMonth = d.getMonth() === m;
    const hs = (hol[k] || []).filter((x) => x.type === 'libur');
    const info = (hol[k] || []).filter((x) => x.type !== 'libur');
    const es = evs[k] || [];
    const cls = ['cal-day'];
    if (!inMonth) cls.push('out');
    if (d.getDay() === 0) cls.push('sun');
    if (hs.length) cls.push('hol');
    if (es.length || info.length) cls.push('ev');
    if (k === todayKey) cls.push('today');
    const cell = el('div', cls.join(' '), String(d.getDate()));
    const h = hijri(d);
    if (h) cell.append(el('small', null, String(h.d)));
    const tips = [h ? hijriStr(d) : '', ...hs.map((x) => x.name + (x.approx ? ' (perkiraan)' : '')), ...info.map((x) => x.name), ...es.map((x) => '📌 ' + x)].filter(Boolean);
    cell.title = tips.join('\n');
    grid.append(cell);
    if (inMonth) {
      hs.forEach((x) => listItems.push({ d, name: x.name, approx: x.approx, hol: true }));
      info.forEach((x) => listItems.push({ d, name: x.name, approx: x.approx }));
      es.forEach((x) => listItems.push({ d, name: '📌 ' + x }));
    }
  }
  card.append(grid);
  if (listItems.length) {
    const ul = el('ul', 'cal-list');
    listItems.forEach((it) => {
      const li = el('li');
      li.append(el('span', 'd', SHORT_MONTH(it.d)), el('span', it.hol ? 'hol' : '', it.name + (it.approx ? '*' : '')));
      ul.append(li);
    });
    card.append(ul);
    if (listItems.some((x) => x.approx)) {
      card.append(el('div', 'cal-note', '* Perkiraan kalender Umm al-Qura; bisa berbeda 1 hari dengan ketetapan pemerintah.'));
    }
  }
}

/* ================= Countdown ================= */
function daysUntil(dateStr) {
  return Math.round((parseYmd(dateStr) - today0()) / 864e5);
}
function renderCountdown() {
  if (!D.settings.widgets.countdown) return;
  const nh = nextHoliday();
  const hol = $('#cd-next-holiday');
  hol.innerHTML = '';
  if (nh) {
    const n = Math.round((nh.date - today0()) / 864e5);
    hol.append(document.createTextNode('Libur berikutnya: '), el('b', null, nh.name + (nh.approx ? '*' : '')),
      document.createTextNode(` · ${n === 0 ? 'hari ini' : n + ' hari lagi'} (${nh.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })})`));
  }
  const ul = $('#cd-list');
  ul.innerHTML = '';
  const list = [...(D.countdowns || [])].sort((a, b) => a.date.localeCompare(b.date));
  list.forEach((c) => {
    const n = daysUntil(c.date);
    const li = el('li', n < 0 ? 'past' : '');
    const name = el('div', 'n');
    name.append(el('b', null, c.name), el('small', null, parseYmd(c.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })));
    const days = el('div', 'days');
    if (n > 0) days.append(el('b', null, String(n)), el('small', null, 'hari lagi'));
    else if (n === 0) days.append(el('b', null, '🎉'), el('small', null, 'hari ini'));
    else days.append(el('small', null, 'sudah lewat'));
    const x = el('button', 'x', '✕');
    x.title = 'Hapus';
    x.onclick = () => { D.countdowns = D.countdowns.filter((y) => y !== c); save(); renderCountdown(); renderCalendar(); };
    li.append(name, days, x);
    ul.append(li);
  });
  if (!list.length) {
    const li = el('li');
    li.style.background = 'none';
    li.style.padding = '0';
    const wrap = el('div', 'empty-small');
    wrap.append(document.createTextNode('Belum ada. Coba: '));
    const fitri = nextHoliday(today0(), (h) => h.name === 'Idul Fitri');
    const sugg = [];
    if (fitri) sugg.push(['Lebaran', ymd(fitri.date)]);
    sugg.push(['Tahun Baru', `${new Date().getFullYear() + 1}-01-01`]);
    sugg.forEach(([name, date], i) => {
      const b = el('button', 'link-btn', `+ ${name}`);
      b.style.margin = '0 8px 0 0';
      b.onclick = () => { D.countdowns.push({ id: uid(), name, date }); save(); renderCountdown(); renderCalendar(); };
      wrap.append(b);
    });
    li.append(wrap);
    ul.append(li);
  }
}
$('#cd-add-btn').addEventListener('click', () => {
  const f = $('#cd-form');
  f.hidden = !f.hidden;
  if (!f.hidden) $('#cd-name').focus();
});
$('#cd-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#cd-name').value.trim();
  const date = $('#cd-date').value;
  if (!name || !date) return;
  D.countdowns.push({ id: uid(), name, date });
  $('#cd-name').value = '';
  $('#cd-date').value = '';
  $('#cd-form').hidden = true;
  save();
  renderCountdown();
  renderCalendar();
  toast('Hitung mundur ditambahkan');
});

/* ================= Reminders ================= */
const fmtEvery = (m) => (m % 60 === 0 ? `${m / 60} jam` : `${m} menit`);
function reminderDesc(r) {
  if (r.type === 'interval') return `Setiap ${fmtEvery(+r.every || 60)}${r.from && r.to ? ` · ${r.from}–${r.to}` : ''}`;
  if (r.type === 'daily') return `Setiap hari jam ${r.at}`;
  const d = new Date(r.at);
  const past = d < new Date();
  return d.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + (past ? ' · sudah lewat' : '');
}
function renderReminders() {
  if (!D.settings.widgets.reminders) return;
  const ul = $('#rem-list');
  ul.innerHTML = '';
  D.reminders.forEach((r) => {
    const li = el('li', r.enabled ? '' : 'off');
    const ic = el('span', 'ic', r.type === 'interval' ? '🔁' : r.type === 'daily' ? '📅' : '⏰');
    const n = el('div', 'n');
    n.append(el('b', null, r.text), el('small', null, reminderDesc(r)));
    const sw = el('label', 'mini-switch');
    sw.title = r.enabled ? 'Matikan' : 'Nyalakan';
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = !!r.enabled;
    cb.onchange = () => { r.enabled = cb.checked; save(); renderReminders(); };
    sw.append(cb, el('span', 'switch'));
    sw.onclick = (e) => e.stopPropagation();
    li.append(ic, n, sw);
    li.onclick = () => openReminderDialog(r);
    ul.append(li);
  });
  if (!D.reminders.length) ul.append(el('li', 'empty-small', 'Belum ada pengingat.'));
  const note = $('#rem-note');
  note.hidden = hasChrome;
  note.textContent = 'Notifikasi hanya berjalan setelah dipasang sebagai ekstensi Chrome.';
}

let editingReminder = null;
let remType = 'interval';
function setRemType(t) {
  remType = t;
  $$('#rem-type button').forEach((b) => b.classList.toggle('on', b.dataset.v === t));
  $$('#form-reminder [data-show]').forEach((d) => d.classList.toggle('on', d.dataset.show === t));
}
function localDT(d) { return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function openReminderDialog(r) {
  editingReminder = r;
  $('#rem-title').textContent = r ? 'Edit pengingat' : 'Pengingat baru';
  $('#rem-text').value = r ? r.text : '';
  $('#rem-every').value = r?.every || 60;
  $('#rem-from').value = r?.from || '07:00';
  $('#rem-to').value = r?.to || '22:00';
  $('#rem-daily').value = r?.type === 'daily' ? r.at : '08:00';
  const soon = new Date(Date.now() + 3600e3);
  soon.setMinutes(0);
  $('#rem-once').value = r?.type === 'once' ? r.at : localDT(soon);
  setRemType(r ? r.type : 'interval');
  $('#rem-delete').hidden = !r;
  $('#dlg-reminder').showModal();
  $('#rem-text').focus();
}
$$('#rem-type button').forEach((b) => b.addEventListener('click', () => setRemType(b.dataset.v)));
$('#rem-add-btn').addEventListener('click', () => openReminderDialog(null));
$('#form-reminder').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('#rem-text').value.trim();
  if (!text) return;
  const r = { id: editingReminder ? editingReminder.id : uid(), text, type: remType, enabled: true };
  if (remType === 'interval') {
    r.every = Math.max(1, Math.min(1440, +$('#rem-every').value || 60));
    r.from = $('#rem-from').value;
    r.to = $('#rem-to').value;
  } else if (remType === 'daily') {
    r.at = $('#rem-daily').value || '08:00';
  } else {
    r.at = $('#rem-once').value;
    if (!r.at || new Date(r.at) <= new Date()) { toast('Pilih waktu yang belum lewat'); return; }
  }
  if (editingReminder) D.reminders[D.reminders.indexOf(editingReminder)] = r;
  else D.reminders.push(r);
  save();
  renderReminders();
  $('#dlg-reminder').close();
  toast(editingReminder ? 'Pengingat diperbarui' : 'Pengingat ditambahkan');
});
$('#rem-delete').addEventListener('click', () => {
  D.reminders = D.reminders.filter((x) => x !== editingReminder);
  save();
  renderReminders();
  $('#dlg-reminder').close();
});

/* ================= Todo + notes ================= */
let lastAllDone = null; // null until the first render, so opening the page doesn't count as finishing
function renderTodos() {
  const ul = $('#todo-list');
  ul.innerHTML = '';
  D.todos.forEach((t) => {
    const li = el('li', t.done ? 'done' : '');
    const cb = el('input', 'check');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.onchange = () => { t.done = cb.checked; save(); renderTodos(); };
    const x = el('button', 'x', '✕');
    x.title = 'Hapus';
    x.onclick = () => { D.todos = D.todos.filter((y) => y !== t); save(); renderTodos(); };
    li.append(cb, el('span', 't', t.text), x);
    ul.append(li);
  });
  const left = D.todos.filter((t) => !t.done).length;
  const allDone = D.todos.length > 0 && left === 0;
  if (allDone && lastAllDone === false) window.QAPet?.event('todos-done');
  lastAllDone = allDone;
  $('#todo-count').textContent = D.todos.length ? `${left} tersisa` : '';
  $('#todo-clear').hidden = !D.todos.some((t) => t.done);
}
$('#todo-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('#todo-input').value.trim();
  if (!v) return;
  D.todos.unshift({ id: uid(), text: v, done: false });
  $('#todo-input').value = '';
  save();
  renderTodos();
});
$('#todo-clear').addEventListener('click', () => { D.todos = D.todos.filter((t) => !t.done); save(); renderTodos(); });

let notesTimer;
$('#notes').addEventListener('input', () => {
  $('#notes-status').textContent = 'Menyimpan…';
  clearTimeout(notesTimer);
  notesTimer = setTimeout(async () => {
    const text = $('#notes').value;
    if (D.notesEnc && notesKey) {
      notesPlain = text;
      D.notesEnc = await encryptText(notesKey, text);
      D.notes = '';
    } else {
      D.notes = text;
    }
    save();
    $('#notes-status').textContent = 'Tersimpan ✓';
  }, 400);
});

/* ---- Notes lock: PIN → PBKDF2 → AES-GCM. The PIN itself is never stored. ---- */
let notesKey = null;   // only in memory while unlocked
let notesPlain = null;
let pinFails = 0;
let pinBlockedUntil = 0;
const te = new TextEncoder();
const td = new TextDecoder();
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));
async function deriveNotesKey(pin, saltB64) {
  const base = await crypto.subtle.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(saltB64), iterations: 210000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}
async function encryptText(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(text));
  return { iv: toB64(iv), data: toB64(data) };
}
async function decryptText(key, box) {
  return td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.data)));
}
const notesLocked = () => !!D.notesEnc && !notesKey;

function renderNotes() {
  const locked = notesLocked();
  $('#notes').hidden = locked;
  $('#notes-lock').hidden = !locked;
  const btn = $('#notes-lockbtn');
  btn.textContent = !D.notesEnc ? '🔐' : notesKey ? '🔓' : '🔒';
  btn.title = !D.notesEnc ? 'Kunci catatan dengan PIN' : notesKey ? 'Catatan terbuka — klik untuk mengunci / ganti PIN' : 'Catatan terkunci';
  if (!locked && document.activeElement !== $('#notes')) $('#notes').value = D.notesEnc ? (notesPlain ?? '') : (D.notes || '');
}

async function askNewPin(title) {
  const p1 = await promptDialog(title, 'PIN baru (4–8 angka)', '');
  if (p1 == null) return null;
  if (!/^\d{4,8}$/.test(p1)) { toast('PIN harus 4–8 angka'); return null; }
  const p2 = await promptDialog(title, 'Ulangi PIN', '');
  if (p2 == null) return null;
  if (p1 !== p2) { toast('PIN tidak sama'); return null; }
  return p1;
}
async function setNotesPin() {
  const pin = await askNewPin('Kunci catatan dengan PIN');
  if (!pin) return;
  const text = D.notesEnc ? (notesPlain ?? '') : (D.notes || $('#notes').value || '');
  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  notesKey = await deriveNotesKey(pin, salt);
  notesPlain = text;
  D.notesLock = { salt };
  D.notesEnc = await encryptText(notesKey, text);
  D.notes = '';
  save();
  renderNotes();
  toast('🔐 Catatan dikunci. Ingat PIN-nya — kalau lupa, catatan tidak bisa dibuka.');
}
function lockNotesNow() {
  notesKey = null;
  notesPlain = null;
  $('#notes').value = '';
  renderNotes();
  toast('🔒 Catatan dikunci');
}
async function removeNotesPin() {
  if (!notesKey || !confirm('Hapus PIN? Catatan akan disimpan tanpa kunci lagi.')) return;
  D.notes = notesPlain ?? '';
  delete D.notesEnc;
  delete D.notesLock;
  notesKey = null;
  notesPlain = null;
  save();
  renderNotes();
  toast('PIN catatan dihapus');
}
$('#notes-lockbtn').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!D.notesEnc) return setNotesPin();
  if (!notesKey) { $('#notes-pin').focus(); return; }
  showMenu(e.currentTarget, [
    ['🔒 Kunci sekarang', lockNotesNow],
    ['🔑 Ganti PIN', setNotesPin],
    ['🗑️ Hapus PIN', removeNotesPin],
  ]);
});
$('#notes-lock').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('#notes-pin');
  if (Date.now() < pinBlockedUntil) { toast(`Tunggu ${Math.ceil((pinBlockedUntil - Date.now()) / 1000)} detik lagi`); return; }
  try {
    const key = await deriveNotesKey(input.value, D.notesLock.salt);
    notesPlain = await decryptText(key, D.notesEnc);
    notesKey = key;
    pinFails = 0;
    input.value = '';
    renderNotes();
    $('#notes').focus();
  } catch {
    pinFails++;
    if (pinFails >= 5) { pinBlockedUntil = Date.now() + 30000; pinFails = 0; toast('Terlalu banyak salah — coba lagi 30 detik lagi'); }
    else toast('PIN salah');
    input.value = '';
    $('#notes-lock').classList.remove('shake');
    void $('#notes-lock').offsetWidth;
    $('#notes-lock').classList.add('shake');
  }
});
$('#notes-forgot').addEventListener('click', () => {
  if (!confirm('Lupa PIN? Catatan yang terkunci akan DIHAPUS permanen dan PIN dihapus. Lanjutkan?')) return;
  delete D.notesEnc;
  delete D.notesLock;
  D.notes = '';
  notesKey = null;
  notesPlain = null;
  save();
  renderNotes();
  toast('Catatan dan PIN dihapus');
});

/* ================= Settings drawer ================= */
function openDrawer() {
  fillSettings();
  $('#drawer').classList.add('open');
  $('#drawer-backdrop').classList.add('open');
}
function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer-backdrop').classList.remove('open');
}
$('#btn-settings').addEventListener('click', openDrawer);
$('#drawer-close').addEventListener('click', closeDrawer);
$('#drawer-backdrop').addEventListener('click', closeDrawer);

function fillSettings() {
  const s = D.settings;
  renderThemeCards();
  $('#set-autotheme').checked = !!s.autoTheme;
  $('#set-weatherfx').checked = s.weatherFx !== false;
  $('#set-musicviz').checked = !!s.musicViz;
  window.QAPet?.fillSettings();
  window.QAX?.fillSettings();
  $('#set-name').value = s.name;
  $('#set-city').value = s.city;
  $$('#set-clock button').forEach((b) => b.classList.toggle('on', b.dataset.v === s.clockStyle));
  $('#set-h24').checked = s.h24;
  $('#set-sec').checked = s.seconds;
  $('#set-engine').value = s.engine;
  $('#set-newtab').checked = s.openNewTab;
  $('#set-history').checked = s.searchHistory;
  $('#set-frequent').checked = s.showFrequent;
  $('#set-dim').value = s.dim; $('#set-dim-val').textContent = s.dim + '%';
  $('#set-blur').value = s.blur; $('#set-blur-val').textContent = s.blur + 'px';
  $('#set-sound').checked = s.sound;
  $('#set-volume').value = s.volume; $('#set-volume-val').textContent = s.volume + '%';
  $$('[data-widget]').forEach((c) => { c.checked = !!s.widgets[c.dataset.widget]; });
  $('#set-wall-remove').hidden = !customWall;

  $('#set-azan').checked = s.azan.enabled;
  $$('[data-prayer]').forEach((c) => { c.checked = s.azan[c.dataset.prayer] !== false; c.disabled = !s.azan.enabled; });
  $('#set-azan-before').value = String(s.azan.before || 0);
  $('#set-azan-sound').value = s.azanSound;
  $('#set-azan-file-info').textContent = s.azanFileName ? `File azan: ${s.azanFileName}` : 'Belum ada file azan. Unggah MP3 milikmu sendiri untuk dipakai sebagai suara azan.';

  $('#set-pomo-work').value = s.pomo.work;
  $('#set-pomo-short').value = s.pomo.short;
  $('#set-pomo-long').value = s.pomo.long;
  $('#set-pomo-every').value = s.pomo.every;
  $('#set-pomo-auto').checked = s.pomo.auto;

  const walls = $('#set-walls');
  walls.innerHTML = '';
  Object.entries(WALLS).forEach(([k, w]) => {
    const b = el('button', 'sw' + (s.wallpaper === k ? ' on' : ''));
    b.title = k;
    b.style.background = `radial-gradient(circle at 25% 30%, ${w.blobs[0]}aa, transparent 55%), radial-gradient(circle at 80% 75%, ${w.blobs[1]}aa, transparent 55%), ${w.bg}`;
    b.onclick = () => { s.wallpaper = k; save(); applyTheme(); fillSettings(); };
    walls.append(b);
  });
  if (customWall) {
    const b = el('button', 'sw' + (s.wallpaper === 'custom' ? ' on' : ''));
    b.title = 'Gambar sendiri';
    b.style.background = `center/cover url("${customWall}")`;
    b.onclick = () => { s.wallpaper = 'custom'; save(); applyTheme(); fillSettings(); };
    walls.append(b);
  }

  const acc = $('#set-accents');
  acc.innerHTML = '';
  ACCENTS.forEach((c) => {
    const b = el('button', 'sw' + (s.accent === c ? ' on' : ''));
    b.style.background = c;
    b.title = c;
    b.onclick = () => { s.accent = c; save(); applyTheme(); fillSettings(); };
    acc.append(b);
  });
}

$('#set-name').addEventListener('input', (e) => { D.settings.name = e.target.value; save(); tick(); });
$('#set-city-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  D.settings.city = $('#set-city').value.trim();
  save();
  await loadWidgets();
  toast('Lokasi disimpan');
});
$$('#set-clock button').forEach((b) => b.addEventListener('click', () => {
  D.settings.clockStyle = b.dataset.v; save(); renderClock(); fillSettings();
}));
$('#set-h24').addEventListener('change', (e) => { D.settings.h24 = e.target.checked; save(); tick(); });
$('#set-sec').addEventListener('change', (e) => { D.settings.seconds = e.target.checked; save(); tick(); });
$('#set-engine').addEventListener('change', (e) => { D.settings.engine = e.target.value; save(); updateHint(); renderSearchMode(); });


$('#set-newtab').addEventListener('change', (e) => { D.settings.openNewTab = e.target.checked; save(); renderGrid(); });
$('#set-history').addEventListener('change', (e) => { D.settings.searchHistory = e.target.checked; save(); });
$('#set-frequent').addEventListener('change', (e) => { D.settings.showFrequent = e.target.checked; save(); renderShortcuts(); });
$('#set-dim').addEventListener('input', (e) => { D.settings.dim = +e.target.value; $('#set-dim-val').textContent = e.target.value + '%'; save(); applyTheme(); });
$('#set-blur').addEventListener('input', (e) => { D.settings.blur = +e.target.value; $('#set-blur-val').textContent = e.target.value + 'px'; save(); applyTheme(); });
$('#set-sound').addEventListener('change', (e) => { D.settings.sound = e.target.checked; save(); });
$('#set-volume').addEventListener('input', (e) => { D.settings.volume = +e.target.value; $('#set-volume-val').textContent = e.target.value + '%'; save(); });
$$('[data-widget]').forEach((c) => c.addEventListener('change', () => setWidget(c.dataset.widget, c.checked)));
$('#set-layout').addEventListener('click', () => setEditLayout(true));

// Azan
$('#set-azan').addEventListener('change', (e) => { D.settings.azan.enabled = e.target.checked; save(); fillSettings(); loadWidgets(); });
$$('[data-prayer]').forEach((c) => c.addEventListener('change', () => { D.settings.azan[c.dataset.prayer] = c.checked; save(); loadWidgets(); }));
$('#set-azan-before').addEventListener('change', (e) => { D.settings.azan.before = +e.target.value; save(); });
$('#set-azan-sound').addEventListener('change', async (e) => {
  if (e.target.value === 'custom' && !(await Store.get('qa-azan-audio'))) {
    toast('Unggah file azan dulu');
    e.target.value = D.settings.azanSound;
    return;
  }
  D.settings.azanSound = e.target.value;
  save();
});
$('#set-azan-file').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 25 * 1024 * 1024) { toast('File terlalu besar (maks 25 MB)'); return; }
  const r = new FileReader();
  r.onload = async () => {
    await Store.set('qa-azan-audio', r.result);
    D.settings.azanSound = 'custom';
    D.settings.azanFileName = f.name;
    save();
    fillSettings();
    toast('File azan dipasang');
  };
  r.readAsDataURL(f);
  e.target.value = '';
});
let previewAudio = null;
async function testSound(kind) {
  if (hasChrome && chrome.runtime?.id) {
    chrome.runtime.sendMessage({ type: 'test', kind }).catch(() => {});
    toast('Notifikasi tes dikirim');
    return;
  }
  const vol = D.settings.volume / 100;
  if (kind === 'azan' && D.settings.azanSound === 'custom') {
    if (previewAudio) { previewAudio.pause(); previewAudio = null; return; }
    previewAudio = new Audio(await Store.get('qa-azan-audio'));
    previewAudio.volume = vol;
    previewAudio.play();
  } else if (!(kind === 'azan' && D.settings.azanSound === 'none')) {
    playChime(kind, vol);
  }
  toast('Pratinjau suara (notifikasi hanya ada di versi ekstensi)');
}
$('#set-azan-test').addEventListener('click', () => testSound('azan'));
$$('[data-test]').forEach((b) => b.addEventListener('click', () => testSound(b.dataset.test)));

// Pomodoro
[['#set-pomo-work', 'work', 1, 180], ['#set-pomo-short', 'short', 1, 60], ['#set-pomo-long', 'long', 1, 90], ['#set-pomo-every', 'every', 2, 12]].forEach(([id, k, min, max]) => {
  $(id).addEventListener('change', (e) => {
    D.settings.pomo[k] = Math.max(min, Math.min(max, Math.round(+e.target.value) || min));
    e.target.value = D.settings.pomo[k];
    save();
    if (!pomo.running) { pomo.remaining = null; savePomo(); }
    renderPomo();
  });
});
$('#set-pomo-auto').addEventListener('change', (e) => { D.settings.pomo.auto = e.target.checked; save(); });

// Wallpaper
$('#set-autotheme').addEventListener('change', (e) => {
  D.settings.autoTheme = e.target.checked;
  save();
  if (e.target.checked) { applyAutoTheme(true); toast(`Tema otomatis aktif — sekarang: ${THEMES[DAY_PARTS[dayPart()]].name}`); }
});
$('#set-weatherfx').addEventListener('change', (e) => { D.settings.weatherFx = e.target.checked; save(); updateWeatherFx(); });
$('#set-musicviz').addEventListener('change', (e) => { D.settings.musicViz = e.target.checked; save(); updateVisualizer(); if (e.target.checked) toast('Visualizer aktif — klik sekali di tab YouTube-nya kalau gelombangnya belum mengikuti irama'); });
$('#set-wall-file').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 15 * 1024 * 1024) { toast('Gambar terlalu besar (maks 15 MB)'); return; }
  const r = new FileReader();
  r.onload = async () => {
    customWall = r.result;
    await Store.set('qa-wall', customWall);
    D.settings.wallpaper = 'custom';
    save(); applyTheme(); fillSettings();
    toast('Wallpaper dipasang');
  };
  r.readAsDataURL(f);
  e.target.value = '';
});
$('#set-wall-remove').addEventListener('click', async () => {
  customWall = null;
  await Store.remove('qa-wall');
  if (D.settings.wallpaper === 'custom') D.settings.wallpaper = 'aurora';
  save(); applyTheme(); fillSettings();
});

// Bookmark import
const countUrls = (n) => (n.url ? 1 : (n.children || []).reduce((a, c) => a + countUrls(c), 0));
const collectUrls = (n, out = []) => { if (n.url) out.push(n); else (n.children || []).forEach((c) => collectUrls(c, out)); return out; };
$('#set-import-bm').addEventListener('click', async () => {
  if (!hasChrome || !chrome.bookmarks) { toast('Hanya tersedia setelah dipasang sebagai ekstensi Chrome'); return; }
  const tree = await chrome.bookmarks.getTree();
  const sel = $('#import-folder');
  sel.innerHTML = '';
  const walk = (node, depth) => {
    for (const c of node.children || []) {
      if (c.url) continue;
      const n = countUrls(c);
      if (n) {
        const o = el('option', null, `${'   '.repeat(depth)}${depth ? '└ ' : ''}${c.title || '(tanpa nama)'} (${n})`);
        o.value = c.id;
        sel.append(o);
      }
      walk(c, depth + 1);
    }
  };
  walk(tree[0], 0);
  if (!sel.options.length) { toast('Tidak ada bookmark untuk diimpor'); return; }
  $('#dlg-import').showModal();
});
$('#form-import').addEventListener('submit', async (e) => {
  e.preventDefault();
  const [node] = await chrome.bookmarks.getSubTree($('#import-folder').value);
  const ok = (u) => u && !/^javascript:/i.test(u);
  const g = { id: uid(), name: (node.title || 'Bookmark').slice(0, 24) };
  D.groups.push(g);
  let n = 0;
  for (const c of node.children || []) {
    if (c.url) {
      if (!ok(c.url)) continue;
      D.shortcuts.push({ id: uid(), group: g.id, name: (c.title || c.url).slice(0, 40), url: c.url, icon: '' });
      n++;
    } else {
      const urls = collectUrls(c).filter((b) => ok(b.url));
      if (!urls.length) continue;
      const f = { id: uid(), type: 'folder', name: (c.title || 'Folder').slice(0, 30), group: g.id };
      D.shortcuts.push(f);
      urls.forEach((b) => { D.shortcuts.push({ id: uid(), group: g.id, folder: f.id, name: (b.title || b.url).slice(0, 40), url: b.url, icon: '' }); n++; });
    }
  }
  D.activeGroup = g.id;
  save();
  renderShortcuts();
  $('#dlg-import').close();
  closeDrawer();
  toast(`${n} shortcut diimpor ke grup "${g.name}"`);
});

// Export / import / reset
$('#set-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = `quick-access-${dayKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('#set-import').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!Array.isArray(data.shortcuts) || !Array.isArray(data.groups)) throw new Error();
      D = merge(data);
      save(); renderAll(); fillSettings(); loadWidgets();
      toast('Data berhasil di-import');
    } catch { toast('File tidak valid'); }
  };
  r.readAsText(f);
  e.target.value = '';
});
$('#set-reset').addEventListener('click', async () => {
  if (!confirm('Reset semua shortcut, tugas, catatan, pengingat, dan pengaturan ke awal?')) return;
  D = defaults();
  customWall = null;
  await Promise.all(['qa-wall', 'qa-geo', 'qa-weather', 'qa-prayer', 'qa-azan-audio'].map((k) => Store.remove(k)));
  pomo = defPomo();
  savePomo();
  save(); renderAll(); fillSettings(); loadWidgets();
  toast('Sudah di-reset');
});

/* ================= Sync with other tabs / background ================= */
function onExternal(key, value) {
  if (key === 'qa-data') {
    if (!value) return;
    const js = JSON.stringify(value);
    if (ownWrites.includes(js) || js === JSON.stringify(D)) return;
    const prevCity = D.settings.city, prevAzan = JSON.stringify(D.settings.azan);
    D = merge(value);
    renderAll();
    if (D.settings.city !== prevCity || JSON.stringify(D.settings.azan) !== prevAzan) loadWidgets();
    if ($('#drawer').classList.contains('open') && !$('#drawer').contains(document.activeElement)) fillSettings();
  } else if (key === 'qa-pomo') {
    pomo = value || defPomo();
    renderPomo();
  }
}
if (hasChrome) {
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    ['qa-data', 'qa-pomo'].forEach((k) => { if (ch[k]) onExternal(k, ch[k].newValue); });
  });
} else {
  window.addEventListener('storage', (e) => {
    if (e.key === 'qa-data' || e.key === 'qa-pomo') {
      try { onExternal(e.key, JSON.parse(e.newValue)); } catch {}
    }
  });
}

/* ================= Init ================= */
function renderAll() {
  applyTheme();
  renderClock();
  renderShortcuts();
  renderTodos();
  renderReminders();
  renderCountdown();
  renderCalendar();
  renderPomo();
  renderSearchMode();
  renderMusic(true);
  window.QAPet?.apply();
  window.QAX?.renderAll();
  renderNotes();
}

(async function init() {
  D = merge(await Store.get('qa-data'));
  customWall = (await Store.get('qa-wall')) || null;
  pomo = { ...defPomo(), ...((await Store.get('qa-pomo')) || {}) };
  Store.remove('qa-ai-keys'); // AI search was removed: don't keep the API keys around
  initBlocks();
  window.QAPet?.init();
  window.QAX?.init();
  renderAll();
  setTimeout(startMeasuring, 60);
  applyAutoTheme(true);
  updateVisualizer();
  startClock();
  loadWidgets();
  loadAyah();
  loadMusic();
})();
