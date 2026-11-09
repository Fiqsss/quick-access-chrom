'use strict';
/*
 * Background worker: fires notifications even when no new-tab page is open.
 *  - Azan (prayer time) notifications, optionally a few minutes early
 *  - Reminders (once / daily / every N minutes)
 *  - Pomodoro phase changes
 * Sounds are played through an offscreen document.
 */

const ICON = 'icons/icon128.png';
const PRAYER_NAMES = { Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya' };
const LATE_LIMIT = 10 * 60 * 1000; // skip alarms that fire >10 min late (PC was asleep)
const pad = (n) => String(n).padStart(2, '0');
const hhmm = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function get(k) { return (await chrome.storage.local.get(k))[k]; }
async function settings() { return ((await get('qa-data')) || {}).settings || {}; }

/* ---------------- Sound ---------------- */
let creatingOffscreen = null;
async function ensureOffscreen() {
  try { if (await chrome.offscreen.hasDocument()) return; } catch {}
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Memutar suara azan, pomodoro, dan pengingat',
    }).catch(() => {}).finally(() => { creatingOffscreen = null; });
  }
  return creatingOffscreen;
}

async function playSound(kind) {
  const s = await settings();
  const volume = (s.volume ?? 80) / 100;
  let src = null;
  if (kind === 'azan') {
    if (s.azanSound === 'none') return;
    if (s.azanSound === 'custom') src = (await get('qa-azan-audio')) || null;
  } else if (s.sound === false) {
    return;
  }
  try {
    await ensureOffscreen();
    await chrome.runtime.sendMessage({ target: 'offscreen', type: 'play', kind, src, volume });
  } catch (e) { console.warn('sound', e); }
}

function notify(prefix, title, message, extra = {}) {
  chrome.notifications.create(`${prefix}-${Date.now()}`, {
    type: 'basic', iconUrl: ICON, title, message, priority: 2, silent: true, ...extra,
  });
}

/* ---------------- Location + prayer times ---------------- */
async function getGeo(city) {
  const cache = await get('qa-geo');
  if (cache && cache.q === city.toLowerCase()) return cache;
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`);
  const j = await r.json();
  if (!j.results || !j.results.length) return null;
  const g = j.results[0];
  const geo = { q: city.toLowerCase(), lat: g.latitude, lon: g.longitude, name: g.name, region: g.admin1 || g.country || '' };
  await chrome.storage.local.set({ 'qa-geo': geo });
  return geo;
}

async function getTimings(geo, date) {
  const key = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  const c = await get('qa-prayer');
  if (c && c.date === key && c.lat === geo.lat && c.lon === geo.lon) return c.timings;
  const r = await fetch(`https://api.aladhan.com/v1/timings/${key}?latitude=${geo.lat}&longitude=${geo.lon}&method=20`);
  const j = await r.json();
  if (dayKey(date) === dayKey()) {
    await chrome.storage.local.set({ 'qa-prayer': { date: key, lat: geo.lat, lon: geo.lon, timings: j.data.timings } });
  }
  return j.data.timings;
}

async function scheduleAzan() {
  const all = await chrome.alarms.getAll();
  await Promise.all(all.filter((a) => a.name.startsWith('azan')).map((a) => chrome.alarms.clear(a.name)));
  const s = await settings();
  const az = s.azan || {};
  if (!az.enabled || !s.city) return;
  try {
    const geo = await getGeo(s.city);
    if (!geo) return;
    const now = Date.now();
    for (const offset of [0, 1]) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const t = await getTimings(geo, d);
      for (const key of Object.keys(PRAYER_NAMES)) {
        if (az[key] === false) continue;
        const [h, m] = String(t[key] || '').slice(0, 5).split(':').map(Number);
        if (Number.isNaN(h)) continue;
        const when = new Date(d);
        when.setHours(h, m, 0, 0);
        const ts = when.getTime();
        if (ts > now) chrome.alarms.create(`azan|${key}|${ts}`, { when: ts });
        const before = +az.before || 0;
        if (before > 0 && ts - before * 60000 > now) {
          chrome.alarms.create(`azanpre|${key}|${ts}`, { when: ts - before * 60000 });
        }
      }
    }
  } catch (e) { console.warn('azan schedule', e); }
}

function scheduleDaily() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 2, 0, 0);
  chrome.alarms.create('daily', { when: d.getTime(), periodInMinutes: 1440 });
}

/* ---------------- Reminders ---------------- */
function scheduleReminder(r) {
  const name = `rem|${r.id}`;
  if (!r.enabled) { chrome.alarms.clear(name); return; }
  const now = Date.now();
  if (r.type === 'once') {
    const w = new Date(r.at).getTime();
    if (w > now) chrome.alarms.create(name, { when: w });
    else chrome.alarms.clear(name);
  } else if (r.type === 'daily') {
    const [h, m] = String(r.at || '08:00').split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    if (d.getTime() <= now) d.setDate(d.getDate() + 1);
    chrome.alarms.create(name, { when: d.getTime(), periodInMinutes: 1440 });
  } else {
    const every = Math.max(1, +r.every || 60);
    chrome.alarms.create(name, { delayInMinutes: every, periodInMinutes: every });
  }
}

async function scheduleAllReminders() {
  const all = await chrome.alarms.getAll();
  await Promise.all(all.filter((a) => a.name.startsWith('rem|')).map((a) => chrome.alarms.clear(a.name)));
  const D = (await get('qa-data')) || {};
  (D.reminders || []).forEach(scheduleReminder);
}

function diffReminders(oldList = [], newList = []) {
  const oldMap = new Map(oldList.map((r) => [r.id, JSON.stringify(r)]));
  const newIds = new Set();
  for (const r of newList) {
    newIds.add(r.id);
    if (oldMap.get(r.id) !== JSON.stringify(r)) scheduleReminder(r);
  }
  for (const r of oldList) if (!newIds.has(r.id)) chrome.alarms.clear(`rem|${r.id}`);
}

function inWindow(r) {
  if (!r.from || !r.to) return true;
  const d = new Date();
  const cur = d.getHours() * 60 + d.getMinutes();
  const [fh, fm] = r.from.split(':').map(Number);
  const [th, tm] = r.to.split(':').map(Number);
  const a = fh * 60 + fm, b = th * 60 + tm;
  return a <= b ? cur >= a && cur <= b : cur >= a || cur <= b;
}

/* ---------------- Pomodoro ---------------- */
function pomoDur(s, mode) {
  const p = s.pomo || {};
  return (mode === 'work' ? p.work || 25 : mode === 'long' ? p.long || 15 : p.short || 5) * 60;
}

async function syncPomoAlarm(st) {
  if (st && st.running && st.endAt) chrome.alarms.create('pomo', { when: Math.max(Date.now() + 500, st.endAt) });
  else chrome.alarms.clear('pomo');
}

async function finishPomo() {
  const st = await get('qa-pomo');
  if (!st || !st.running) return;
  if (st.endAt && Date.now() < st.endAt - 1500) return syncPomoAlarm(st);
  const s = await settings();
  const p = s.pomo || {};
  const today = dayKey();
  if (st.day !== today) { st.day = today; st.count = 0; }
  let title, msg;
  if (st.mode === 'work') {
    st.count = (st.count || 0) + 1;
    st.hist = { ...(st.hist || {}), [today]: st.count }; // for the focus-stats widget
    const next = st.count % (p.every || 4) === 0 ? 'long' : 'short';
    st.mode = next;
    title = 'Waktunya istirahat ☕';
    msg = `Sesi fokus ke-${st.count} hari ini selesai. Istirahat ${pomoDur(s, next) / 60} menit.`;
  } else {
    st.mode = 'work';
    title = 'Ayo fokus lagi 💪';
    msg = `Istirahat selesai. Mulai sesi fokus ${pomoDur(s, 'work') / 60} menit.`;
  }
  st.remaining = pomoDur(s, st.mode);
  if (p.auto) { st.running = true; st.endAt = Date.now() + st.remaining * 1000; }
  else { st.running = false; st.endAt = null; }
  await chrome.storage.local.set({ 'qa-pomo': st });
  notify('pomo', title, msg);
  playSound('pomo');
}

/* ---------------- Wiring ---------------- */
async function scheduleAll() {
  scheduleDaily();
  await scheduleAzan();
  await scheduleAllReminders();
  const st = await get('qa-pomo');
  if (st && st.running) {
    if (st.endAt && st.endAt <= Date.now()) await finishPomo();
    else syncPomoAlarm(st);
  }
}

chrome.runtime.onInstalled.addListener(scheduleAll);
chrome.runtime.onStartup.addListener(scheduleAll);

chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== 'local') return;
  if (ch['qa-data']) {
    const o = ch['qa-data'].oldValue || {}, n = ch['qa-data'].newValue || {};
    const azKey = (d) => JSON.stringify([d.settings?.city, d.settings?.azan]);
    if (azKey(o) !== azKey(n)) scheduleAzan();
    diffReminders(o.reminders, n.reminders);
  }
  if (ch['qa-pomo']) syncPomoAlarm(ch['qa-pomo'].newValue);
});

chrome.alarms.onAlarm.addListener(async (a) => {
  const late = Date.now() - a.scheduledTime > LATE_LIMIT;
  if (a.name === 'daily') return scheduleAzan();
  if (a.name === 'pomo') return finishPomo();

  const [type, id, tsStr] = a.name.split('|');
  if (type === 'azan' || type === 'azanpre') {
    if (late) return;
    const s = await settings();
    const geo = (await get('qa-geo')) || {};
    const name = PRAYER_NAMES[id] || id;
    const ts = +tsStr;
    if (type === 'azan') {
      const custom = s.azanSound === 'custom';
      notify('azan', `🕌 Waktu ${name} telah tiba`, `${name} · ${hhmm(ts)}${geo.name ? ' · ' + geo.name : ''}\nSelamat menunaikan ibadah sholat.`,
        custom ? { buttons: [{ title: 'Hentikan suara azan' }], requireInteraction: true } : {});
      playSound('azan');
    } else {
      notify('azanpre', `🕌 ${name} sebentar lagi`, `${s.azan?.before || ''} menit lagi masuk waktu ${name} (${hhmm(ts)}).`);
      playSound('reminder');
    }
    return;
  }

  if (type === 'rem') {
    if (late) return;
    const D = (await get('qa-data')) || {};
    const r = (D.reminders || []).find((x) => x.id === id);
    if (!r || !r.enabled) return;
    if (r.type === 'interval' && !inWindow(r)) return;
    notify('rem', '⏰ Pengingat', r.text, { requireInteraction: r.type !== 'interval' });
    playSound('reminder');
  }
});

chrome.notifications.onClicked.addListener((id) => {
  chrome.notifications.clear(id);
  chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {});
  chrome.tabs.create({});
});
chrome.notifications.onButtonClicked.addListener((id) => {
  chrome.notifications.clear(id);
  chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {});
});
chrome.notifications.onClosed.addListener((id) => {
  if (id.startsWith('azan-')) chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {});
});

/* ---------------- YouTube now-playing ---------------- */
// yt-content.js reports state per tab; the new-tab page reads it from storage.session.
let ytQueue = Promise.resolve();
function updateYt(fn) {
  ytQueue = ytQueue.then(async () => {
    const map = (await chrome.storage.session.get('qa-yt'))['qa-yt'] || {};
    fn(map);
    await chrome.storage.session.set({ 'qa-yt': map });
  }).catch((e) => console.warn('yt state', e));
}
chrome.tabs.onRemoved.addListener((tabId) => updateYt((m) => { delete m[tabId]; }));

// Reach YouTube tabs that were already open before the extension was (re)loaded.
async function injectYouTube() {
  try {
    const tabs = await chrome.tabs.query({ url: ['https://www.youtube.com/*', 'https://music.youtube.com/*'] });
    for (const t of tabs) {
      chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['yt-content.js'] }).catch(() => {});
    }
  } catch (e) { console.warn('inject', e); }
}
chrome.runtime.onInstalled.addListener(injectYouTube);
chrome.runtime.onStartup.addListener(injectYouTube);

// Messages from the new-tab page (test buttons) and from YouTube tabs.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.target === 'offscreen') return;
  if (msg.type === 'yt-state' && sender.tab) {
    const tabId = sender.tab.id;
    updateYt((m) => { m[tabId] = { ...msg.state, tabId }; });
    return;
  }
  if (msg.type === 'yt-gone' && sender.tab) {
    const tabId = sender.tab.id;
    updateYt((m) => { delete m[tabId]; });
    return;
  }
  if (msg.type === 'test') {
    const texts = {
      azan: ['🕌 Tes notifikasi azan', 'Seperti inilah pemberitahuan saat masuk waktu sholat.'],
      pomo: ['⏱️ Tes pomodoro', 'Seperti inilah pemberitahuan saat sesi fokus selesai.'],
      reminder: ['⏰ Tes pengingat', 'Seperti inilah pemberitahuan pengingatmu.'],
    };
    const [t, m] = texts[msg.kind] || texts.reminder;
    notify('test', t, m, msg.kind === 'azan' ? { buttons: [{ title: 'Hentikan suara' }] } : {});
    playSound(msg.kind);
  }
  if (msg.type === 'stop-sound') chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {});
});
