'use strict';
/*
 * Virtual pets for the new-tab page (one or two at a time).
 *  - Walk, sit, sleep, dance when YouTube music plays, chat now and then, play with each other.
 *  - Needs: hunger, happiness, energy (bars above the head). Level up → accessories.
 *  - Stand on the floor and on top of widget cards; fall with gravity.
 *  - Tap: happy hop · hold: petting · drag & throw · double-click: trick · right-click: menu.
 *  - Ball toy: throw it (or drag it), the pets chase it and bring it back.
 * Uses globals from app.js: D, save, $, toast, playChime, showMenu, Store, prayerTimes, pomo, currentTrack.
 */
(() => {
  const TYPES = {
    cat:   { name: 'Kucing',    snack: '🐟', c: { body: '#f6a54c', belly: '#ffe7c7', dark: '#b8652a', accent: '#ff8fa3' } },
    dog:   { name: 'Anjing',    snack: '🦴', c: { body: '#d9a06b', belly: '#f7e6d2', dark: '#7a4b2a', accent: '#ff7a8a' } },
    bunny: { name: 'Kelinci',   snack: '🥕', c: { body: '#f5f2fa', belly: '#ffffff', dark: '#a79fbd', accent: '#ffb3c7' } },
    panda: { name: 'Panda',     snack: '🎋', c: { body: '#f7f7f7', belly: '#ffffff', dark: '#2b2b33', accent: '#ff9fb2' } },
    chick: { name: 'Anak ayam', snack: '🌽', c: { body: '#ffd84d', belly: '#fff3b0', dark: '#d98a12', accent: '#ff8a3d' } },
    slime: { name: 'Slime',     snack: '🍬', c: { body: '#6ee7c8', belly: '#c9fbec', dark: '#22a283', accent: '#ff9fb2' } },
  };
  const ACCESSORIES = [
    { id: 'none', name: 'Tanpa', icon: '✖️', lv: 1 },
    { id: 'bow', name: 'Pita', icon: '🎀', lv: 2 },
    { id: 'glasses', name: 'Kacamata', icon: '👓', lv: 3 },
    { id: 'scarf', name: 'Syal', icon: '🧣', lv: 4 },
    { id: 'partyhat', name: 'Topi pesta', icon: '🥳', lv: 5 },
    { id: 'flower', name: 'Bunga', icon: '🌸', lv: 6 },
    { id: 'headphones', name: 'Headphone', icon: '🎧', lv: 7 },
    { id: 'crown', name: 'Mahkota', icon: '👑', lv: 8 },
  ];
  const SIZES = { s: 60, m: 80, l: 104 };
  const SPEED = { calm: 30, normal: 52, hyper: 88 };
  const GRAVITY = 2300;
  const xpForLevel = (lv) => 30 * lv * (lv - 1); // Lv1: 0 · Lv2: 60 · Lv3: 180 · Lv4: 360 · Lv5: 600 …
  const levelFor = (xp) => { let lv = 1; while (xp >= xpForLevel(lv + 1)) lv++; return lv; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Drawing ---------------- */
  const mirror = (svg) => `${svg}<g transform="scale(-1 1)">${svg}</g>`;

  function face(type, c) {
    const eyes = mirror(`<ellipse cx="-9" cy="-52" rx="3.6" ry="4.4" fill="#2a1f2d"/><circle cx="-7.8" cy="-53.8" r="1.3" fill="#fff"/>`);
    const happy = mirror(`<path d="M-13,-51 q4,-5.5 8,0" stroke="#2a1f2d" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
    const sleep = mirror(`<path d="M-13,-52 q4,3.5 8,0" stroke="#2a1f2d" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
    const dizzy = mirror(`<path d="M-12,-55 l6,6 M-6,-55 l-6,6" stroke="#2a1f2d" stroke-width="2" stroke-linecap="round"/>`);
    const sad = mirror(`<ellipse cx="-9" cy="-51" rx="3.2" ry="3.8" fill="#2a1f2d"/><path d="M-14,-58 l8,2.5" stroke="#2a1f2d" stroke-width="1.8" stroke-linecap="round"/><circle cx="-11" cy="-46.5" r="1.4" fill="#7dd3fc" opacity="0.9"/>`);
    const cheeks = mirror(`<ellipse cx="-15.5" cy="-45" rx="4" ry="2.6" fill="${c.accent}" opacity="0.55"/>`);
    let mouth = `<path class="p-mouth" d="M-4,-44.5 q4,4 8,0" stroke="#2a1f2d" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    let extra = '';
    if (type === 'cat') {
      mouth = `<path class="p-mouth" d="M-5,-44 q2.5,3 5,0 q2.5,3 5,0" stroke="#2a1f2d" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
      extra = `<path d="M-1.8,-47.6 h3.6 l-1.8,2z" fill="${c.accent}"/>` +
        mirror(`<path d="M-17,-47 h-9 M-17,-44.5 l-8,2" stroke="${c.dark}" stroke-width="1" stroke-linecap="round" opacity="0.7"/>`);
    } else if (type === 'dog' || type === 'bunny') {
      extra = `<ellipse cx="0" cy="-47.5" rx="2.6" ry="1.9" fill="${type === 'dog' ? '#3a2a2a' : c.accent}"/>`;
    } else if (type === 'panda') {
      extra = `<ellipse cx="0" cy="-47.5" rx="2.6" ry="1.9" fill="#2b2b33"/>`;
    } else if (type === 'chick') {
      mouth = '';
      extra = `<path d="M-5,-47 L5,-47 L0,-41.5 Z" fill="${c.accent}" stroke="${c.dark}" stroke-width="1" stroke-linejoin="round"/>`;
    }
    const open = type === 'chick'
      ? `<path class="p-mouth-open" d="M-5,-47 L5,-47 L0,-39 Z" fill="${c.accent}"/>`
      : `<path class="p-mouth-open" d="M-4.5,-45.5 q4.5,8 9,0 z" fill="#8a2f45"/>`;
    const frown = type === 'chick' ? '' : `<path class="p-mouth-sad" d="M-4,-42 q4,-3.5 8,0" stroke="#2a1f2d" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    // .p-eyes is moved by JS (looking at the cursor); the inner .p-blink carries the CSS blink.
    return `<g class="p-face">${cheeks}<g class="p-eyes"><g class="p-blink">${eyes}</g></g><g class="p-eyes-happy">${happy}</g>` +
      `<g class="p-eyes-sleep">${sleep}</g><g class="p-eyes-dizzy">${dizzy}</g><g class="p-eyes-sad">${sad}</g>${extra}${mouth}${open}${frown}</g>`;
  }

  function accessorySVG(acc, type) {
    if (!acc || acc === 'none') return '';
    const top = type === 'slime' ? 10 : 0;   // the slime's "head" is lower
    const eyes = type === 'slime' ? 16 : 0;
    const svg = {
      bow: `<g transform="translate(15 ${-71 + top}) rotate(20)"><path d="M0,0 L-10,-6 L-10,6 Z" fill="#ff5c8a" stroke="#be185d" stroke-width="1"/><path d="M0,0 L10,-6 L10,6 Z" fill="#ff5c8a" stroke="#be185d" stroke-width="1"/><circle r="2.8" fill="#ff8fab"/></g>`,
      glasses: `<g transform="translate(0 ${eyes})" fill="rgba(180,220,255,0.28)" stroke="#1f1f2b" stroke-width="2"><circle cx="-9" cy="-52" r="6.5"/><circle cx="9" cy="-52" r="6.5"/><path d="M-2.5,-52 h5" fill="none"/></g>`,
      scarf: type === 'slime'
        ? `<path d="M-30,-18 Q0,-8 30,-18 L31,-11 Q0,0 -31,-11 Z" fill="#ef4444"/><path d="M12,-11 l4,13 l6,-2 l-4,-13 z" fill="#dc2626"/>`
        : `<path d="M-19,-34 Q0,-26 19,-34 L19,-28 Q0,-20 -19,-28 Z" fill="#ef4444"/><path d="M8,-28 l4,14 l6,-2 l-3,-13 z" fill="#dc2626"/><path d="M-12,-31 v5 M-4,-29 v5 M4,-29 v5 M12,-31 v5" stroke="#fff" stroke-width="1.4" opacity="0.7"/>`,
      partyhat: `<g transform="translate(0 ${top})"><path d="M-10,-73 L10,-73 L1,-98 Z" fill="#60a5fa" stroke="#1e3a8a" stroke-width="1.2" stroke-linejoin="round"/><path d="M-6,-80 L7,-80 M-3,-88 L5,-88" stroke="#fde047" stroke-width="2.5"/><circle cx="1" cy="-99" r="3.6" fill="#f472b6"/></g>`,
      flower: `<g transform="translate(-16 ${-69 + top})">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos(a * Math.PI / 180) * 4).toFixed(2)}" cy="${(Math.sin(a * Math.PI / 180) * 4).toFixed(2)}" r="3.4" fill="#fbcfe8" stroke="#f472b6" stroke-width="0.8"/>`).join('')}<circle r="2.4" fill="#fde047"/></g>`,
      headphones: `<g transform="translate(0 ${top})"><path d="M-25,-52 A25,25 0 0 1 25,-52" fill="none" stroke="#334155" stroke-width="4"/><rect x="-31" y="-59" width="9" height="14" rx="3.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1"/><rect x="22" y="-59" width="9" height="14" rx="3.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1"/></g>`,
      peci: `<g transform="translate(0 ${top})"><path d="M-17,-70 Q-17,-82 0,-82 Q17,-82 17,-70 Z" fill="#1f2937" stroke="#000" stroke-width="1"/><path d="M-17,-71 h34" stroke="#374151" stroke-width="2"/></g>`,
      santa: `<g transform="translate(0 ${top})"><path d="M-18,-70 Q-6,-100 16,-88 L10,-72 Z" fill="#dc2626"/><rect x="-20" y="-74" width="36" height="7" rx="3.5" fill="#fff"/><circle cx="17" cy="-88" r="4" fill="#fff"/></g>`,
      bandana: `<g transform="translate(0 ${top})"><path d="M-23,-66 Q0,-80 23,-66 L23,-62 Q0,-75 -23,-62 Z" fill="#dc2626"/><path d="M-23,-62 Q0,-75 23,-62 L23,-58 Q0,-70 -23,-58 Z" fill="#fff"/></g>`,
      crown: `<g transform="translate(0 ${top})"><path d="M-13,-72 L-13,-85 L-6,-78 L0,-90 L6,-78 L13,-85 L13,-72 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.2" stroke-linejoin="round"/><circle cx="0" cy="-80" r="2" fill="#ef4444"/><circle cx="-8" cy="-77" r="1.4" fill="#60a5fa"/><circle cx="8" cy="-77" r="1.4" fill="#60a5fa"/></g>`,
    }[acc];
    return svg ? `<g class="p-acc">${svg}</g>` : '';
  }

  function petSVG(type, acc) {
    const { c } = TYPES[type] || TYPES.cat;
    const stroke = `stroke="${c.dark}" stroke-width="2"`;
    if (type === 'slime') {
      return `<svg viewBox="-50 -100 100 104" aria-hidden="true">
        <ellipse class="p-shadow" cx="0" cy="1" rx="30" ry="4"/>
        <g class="p-bodywrap">
          <path d="M-31,0 C-36,-30 -22,-66 0,-66 C22,-66 36,-30 31,0 Z" fill="${c.body}" ${stroke} opacity="0.95"/>
          <ellipse cx="-12" cy="-50" rx="6" ry="9" fill="#fff" opacity="0.45" transform="rotate(25 -12 -50)"/>
          <g transform="translate(0 16)">${face(type, c)}</g>
          ${accessorySVG(acc, type)}
        </g></svg>`;
    }
    const ears = {
      cat: mirror(`<path d="M-21,-66 L-25,-91 L-5,-74 Z" fill="${c.body}" ${stroke} stroke-linejoin="round"/><path d="M-19,-72 L-21,-84 L-11,-75 Z" fill="${c.accent}"/>`),
      dog: mirror(`<ellipse cx="-24" cy="-57" rx="8" ry="16" transform="rotate(18 -24 -57)" fill="${c.dark}"/>`),
      bunny: mirror(`<ellipse cx="-10" cy="-88" rx="7" ry="22" transform="rotate(-10 -10 -88)" fill="${c.body}" ${stroke}/><ellipse cx="-10" cy="-87" rx="3.4" ry="15" transform="rotate(-10 -10 -87)" fill="${c.accent}"/>`),
      panda: mirror(`<circle cx="-18" cy="-72" r="8.5" fill="${c.dark}"/>`),
      chick: `<path d="M-1,-75 q-5,-11 2,-13 q-2,6 4,4 q-1,7 -6,9z" fill="${c.dark}"/>`,
    }[type];
    const tail = {
      cat: `<path class="p-tail" d="M17,-17 C36,-18 40,-42 30,-52" stroke="${c.body}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M33,-47 C36,-50 33,-54 30,-52" stroke="${c.dark}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
      dog: `<path class="p-tail" d="M17,-22 q14,-4 17,-18" stroke="${c.dark}" stroke-width="6.5" fill="none" stroke-linecap="round"/>`,
      bunny: `<circle class="p-tail" cx="20" cy="-17" r="7" fill="#fff" ${stroke}/>`,
      panda: `<circle class="p-tail" cx="19" cy="-17" r="5" fill="${c.dark}"/>`,
      chick: `<path class="p-tail" d="M17,-24 l11,-6 l-3,10 z" fill="${c.dark}"/>`,
    }[type];
    const patches = type === 'panda' ? mirror(`<ellipse cx="-9.5" cy="-52" rx="7" ry="8.5" transform="rotate(25 -9.5 -52)" fill="${c.dark}"/>`) : '';
    const arms = type === 'chick'
      ? mirror(`<ellipse class="p-arm" cx="-20" cy="-23" rx="6" ry="10" transform="rotate(25 -20 -23)" fill="${c.dark}"/>`)
      : mirror(`<ellipse class="p-arm" cx="-18" cy="-24" rx="5" ry="7" fill="${type === 'panda' ? c.dark : c.body}" ${stroke}/>`);
    const footFill = type === 'chick' ? c.accent : type === 'panda' ? c.dark : c.body;
    return `<svg viewBox="-50 -100 100 104" aria-hidden="true">
      <ellipse class="p-shadow" cx="0" cy="1" rx="24" ry="4"/>
      <g class="p-bodywrap">
        ${tail}
        <ellipse class="p-foot p-foot-l" cx="-9" cy="-3.5" rx="7" ry="4.5" fill="${footFill}" ${stroke}/>
        <ellipse class="p-foot p-foot-r" cx="9" cy="-3.5" rx="7" ry="4.5" fill="${footFill}" ${stroke}/>
        <ellipse cx="0" cy="-20" rx="21" ry="17" fill="${c.body}" ${stroke}/>
        <ellipse cx="0" cy="-17" rx="13" ry="10" fill="${c.belly}"/>
        ${arms}
        ${acc === 'scarf' ? accessorySVG('scarf', type) : ''}
        <g class="p-head">
          <g class="p-ears">${ears}</g>
          <circle cx="0" cy="-52" r="24" fill="${c.body}" ${stroke}/>
          ${patches}
          ${face(type, c)}
          ${acc !== 'scarf' ? accessorySVG(acc, type) : ''}
        </g>
      </g></svg>`;
  }

  const BALL_SVG = `<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="11" fill="#d9f240" stroke="#8aa318" stroke-width="1.2"/><path d="M-8,-7.5 C-2,-3 -2,3 -8,7.5 M8,-7.5 C2,-3 2,3 8,7.5" stroke="#fff" stroke-width="1.6" fill="none"/></svg>`;

  /* ---------------- Settings / saved state ---------------- */
  const petCfg = () => D.settings.pet;
  // Per-pet look: slot p1 = main pet, p2 = second pet.
  function look(slot) {
    const p = petCfg();
    // A seasonal costume (Ramadan peci, Christmas hat, …) is worn when no accessory is chosen.
    const costume = window.QAX?.seasonCostume?.() || null;
    const acc = (a) => (a && a !== 'none' ? a : costume || 'none');
    if (slot === 'p1') return { type: p.type, name: p.name || 'Mochi', accessory: acc(p.accessory) };
    const s = p.second || {};
    return { type: s.type || 'dog', name: s.name || 'Kopi', accessory: acc(s.accessory) };
  }
  const size = () => SIZES[petCfg().size] || SIZES.m;
  const speed = () => SPEED[petCfg().activity] || SPEED.normal;

  // Needs + XP, stored in their own entry (they change often).
  let saved = { p1: null, p2: null };
  const freshStats = () => ({ hunger: 80, happy: 80, energy: 90, xp: 0, at: Date.now(), visit: '' });
  let saveTimer = 0;
  function persist(now) {
    clearTimeout(saveTimer);
    const write = () => { for (const p of pets) saved[p.slot] = { ...p.stats, at: Date.now() }; Store.set('qa-pet-state', saved); };
    if (now) write(); else saveTimer = setTimeout(write, 4000);
  }

  /* ---------------- World ---------------- */
  let surfCache = null;
  let surfFrame = -1;
  let frameNo = 0;
  function surfaces() {
    if (surfFrame === frameNo && surfCache) return surfCache;
    const list = [{ top: window.innerHeight - 4, left: -1e5, right: 1e5, el: 'floor' }];
    document.querySelectorAll('#board .blk:not([hidden]):not(.bare) > .blk-inner').forEach((n) => {
      const r = n.getBoundingClientRect();
      if (r.width < 60 || r.top < 30 || r.top > window.innerHeight - 30) return;
      list.push({ top: r.top + 1, left: r.left + 4, right: r.right - 4, el: n });
    });
    surfCache = list;
    surfFrame = frameNo;
    return list;
  }
  const surfaceOf = (el) => (el === 'floor' ? surfaces()[0] : surfaces().find((s) => s.el === el) || null);
  function landOn(prevY, y, cx) {
    return surfaces().filter((p) => p.top >= prevY - 1 && p.top <= y && cx >= p.left && cx <= p.right).sort((a, b) => a.top - b.top)[0];
  }

  function musicPlaying() {
    try { const t = typeof currentTrack === 'function' && currentTrack(); return !!(t && !t.paused); } catch { return false; }
  }
  function boop(kind = 'pet') {
    if (!petCfg().sound || D.settings.sound === false || typeof playChime !== 'function') return;
    playChime(kind, ((D.settings.volume ?? 80) / 100) * 0.7);
  }

  /* ---------------- Ball ---------------- */
  const ball = { el: null, active: false, x: 0, y: 0, vx: 0, vy: 0, ground: null, held: null, origin: 0, idleSince: 0, press: null };
  const BALL_R = 12;
  function ballEl() {
    if (ball.el) return ball.el;
    const b = document.createElement('div');
    b.className = 'pet-ball';
    b.innerHTML = BALL_SVG;
    b.title = 'Seret & lempar bolanya';
    document.body.append(b);
    ball.el = b;
    bindBallPointer(b);
    return b;
  }
  function throwBall(x, y, vx, vy, origin) {
    ballEl().hidden = false;
    Object.assign(ball, { active: true, x, y, vx, vy, ground: null, held: null, origin: origin ?? x, idleSince: performance.now() });
    pets.forEach((p) => p.noticeBall());
  }
  function throwBallFromCorner() {
    const fromRight = Math.random() < 0.5;
    const x = fromRight ? window.innerWidth - 60 : 60;
    throwBall(x, window.innerHeight * 0.35, (fromRight ? -1 : 1) * rand(420, 700), -rand(300, 600), window.innerWidth / 2);
  }
  function hideBall() {
    ball.active = false;
    ball.held = null;
    if (ball.el) ball.el.hidden = true;
  }
  function stepBall(dt) {
    if (!ball.active) return;
    const W = window.innerWidth;
    if (ball.held) {
      const p = ball.held;
      const s = size();
      ball.x = p.st.x + s / 2 + p.st.dir * s * 0.18;
      ball.y = p.st.y - s * 0.42;
    } else if (ball.press && ball.press.moved) {
      // dragged by the pointer
    } else if (!ball.ground) {
      const prevY = ball.y;
      ball.vy += GRAVITY * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = -ball.vx * 0.6; }
      if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -ball.vx * 0.6; }
      if (ball.vy > 0) {
        const land = landOn(prevY, ball.y, ball.x);
        if (land) {
          ball.y = land.top;
          if (ball.vy > 260) { ball.vy = -ball.vy * 0.55; }
          else { ball.vy = 0; ball.ground = land.el; }
        }
      }
    } else {
      const surf = surfaceOf(ball.ground);
      if (!surf) { ball.ground = null; }
      else {
        ball.y = surf.top;
        ball.x += ball.vx * dt;
        ball.vx *= Math.max(0, 1 - 2.2 * dt);
        if (Math.abs(ball.vx) < 6) ball.vx = 0;
        if (ball.x < BALL_R || ball.x > W - BALL_R) { ball.vx = -ball.vx * 0.6; ball.x = clamp(ball.x, BALL_R, W - BALL_R); }
        if (surf.el !== 'floor' && (ball.x < surf.left || ball.x > surf.right)) ball.ground = null;
      }
    }
    // Nobody played for a while → the ball goes away.
    if (!ball.held && performance.now() - ball.idleSince > 25000) hideBall();
    const roll = ball.ground ? (ball.x / BALL_R) * (180 / Math.PI) : 0;
    ball.el.style.transform = `translate(${ball.x - BALL_R}px, ${ball.y - BALL_R * 2}px) rotate(${roll}deg)`;
  }
  function bindBallPointer(b) {
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      try { b.setPointerCapture(e.pointerId); } catch {}
      if (ball.held) { ball.held.dropBall(false); }
      ball.press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, samples: [] };
    });
    b.addEventListener('pointermove', (e) => {
      const p = ball.press;
      if (!p || e.pointerId !== p.id) return;
      if (!p.moved && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 4) { p.moved = true; ball.ground = null; }
      if (p.moved) {
        ball.x = e.clientX;
        ball.y = e.clientY + BALL_R;
        p.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        if (p.samples.length > 8) p.samples.shift();
      }
    });
    const end = (e) => {
      const p = ball.press;
      if (!p || e.pointerId !== p.id) return;
      ball.press = null;
      const now = performance.now();
      const recent = p.samples.filter((s) => now - s.t < 100);
      let vx = 0, vy = 0;
      if (recent.length >= 2) {
        const a = recent[0], z = recent[recent.length - 1];
        const dt = Math.max(16, z.t - a.t) / 1000;
        vx = clamp((z.x - a.x) / dt, -2000, 2000);
        vy = clamp((z.y - a.y) / dt, -2000, 1500);
      } else if (!p.moved) {
        vx = rand(-300, 300); vy = -500; // a tap just bounces it
      }
      throwBall(ball.x, ball.y, vx, vy, e.clientX);
    };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
  }

  /* ---------------- Pet ---------------- */
  class Pet {
    constructor(slot) {
      this.slot = slot;
      this.built = '';
      this.root = document.createElement('div');
      this.root.className = 'pet';
      this.root.dataset.slot = slot;
      this.bubble = document.createElement('div');
      this.bubble.className = 'pet-bubble';
      this.bubble.hidden = true;
      this.bars = document.createElement('div');
      this.bars.className = 'pet-bars';
      this.sprite = document.createElement('div');
      this.sprite.className = 'pet-sprite';
      this.root.append(this.bars, this.bubble, this.sprite);
      document.body.append(this.root);
      this.stats = { ...freshStats(), ...(saved[slot] || {}) };
      this.catchUp();
      this.level = levelFor(this.stats.xp);
      this.press = null;
      this.taps = [];
      this.bindPointer();
      this.build();
      this.spawn();
    }

    get look() { return look(this.slot); }
    get other() { return pets.find((p) => p !== this) || null; }

    build() {
      const lk = this.look;
      const key = `${lk.type}|${petCfg().size}|${lk.accessory}`;
      if (this.built !== key) {
        this.sprite.innerHTML = petSVG(lk.type, lk.accessory);
        this.built = key;
      }
      const s = size();
      this.root.style.width = `${s}px`;
      this.root.style.height = `${s * 1.04}px`;
      this.root.dataset.type = lk.type;
      this.sprite.setAttribute('aria-label', `${lk.name} (${(TYPES[lk.type] || TYPES.cat).name})`);
      this.renderBars();
    }

    // Time passed while the page was closed (capped at 2 days).
    catchUp() {
      const hrs = clamp((Date.now() - (this.stats.at || Date.now())) / 3600000, 0, 48);
      this.stats.hunger = clamp(this.stats.hunger - hrs * 10, 0, 100);
      this.stats.happy = clamp(this.stats.happy - hrs * 6, 0, 100);
      this.stats.energy = clamp(this.stats.energy + hrs * 12, 0, 100); // it slept while you were away
      const today = new Date().toDateString();
      if (this.stats.visit !== today) { this.stats.visit = today; this.addXp(10, true); }
    }

    spawn() {
      const s = size();
      this.st = {
        x: Math.max(20, window.innerWidth * rand(0.15, 0.8)), y: -s, vx: rand(-80, 80), vy: 0,
        dir: Math.random() < 0.5 ? -1 : 1, ground: null, state: 'fall', until: 0,
        lastTouch: performance.now(), nextChat: performance.now() + rand(30000, 70000),
        nextSocial: performance.now() + rand(15000, 30000), edgeTurned: false, entering: true, target: null,
      };
      this.setState('fall');
      this.place();
    }

    setState(name, secs = 0) {
      this.st.state = name;
      this.st.until = performance.now() + secs * 1000;
      this.root.className = `pet ${name}${this.warn ? ' warn' : ''}`;
    }

    say(text, ms = 2600, force = false) {
      if (!petCfg().bubbles && !force) return;
      this.bubble.textContent = text;
      this.bubble.hidden = false;
      this.bubble.classList.remove('pop');
      void this.bubble.offsetWidth;
      this.bubble.classList.add('pop');
      clearTimeout(this.sayT);
      this.sayT = setTimeout(() => { this.bubble.hidden = true; }, ms);
    }

    burst(chars, n = 4) {
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'pet-fx';
        s.textContent = Array.isArray(chars) ? pick(chars) : chars;
        s.style.left = `${rand(15, 85)}%`;
        s.style.animationDelay = `${i * 0.08}s`;
        s.style.setProperty('--dx', `${rand(-22, 22)}px`);
        this.root.append(s);
        setTimeout(() => s.remove(), 1600);
      }
    }

    /* --- needs & level --- */
    change(stat, by) { this.stats[stat] = clamp(this.stats[stat] + by, 0, 100); this.renderBars(); persist(); }
    addXp(n, quiet) {
      this.stats.xp += n;
      const lv = levelFor(this.stats.xp);
      if (this.level && lv > this.level && !quiet) {
        const unlocked = ACCESSORIES.find((a) => a.lv === lv);
        this.burst(['🎉', '⭐', '✨'], 6);
        this.say(`Naik ke Level ${lv}! 🎉${unlocked ? ` Aksesori baru: ${unlocked.icon} ${unlocked.name}` : ''}`, 4200, true);
        boop('pomo');
        if (typeof toast === 'function') toast(`${this.look.name} naik ke Level ${lv}!${unlocked ? ` ${unlocked.icon} ${unlocked.name} terbuka` : ''}`);
      }
      this.level = lv;
      this.renderBars();
      persist();
      if ($('#drawer')?.classList.contains('open')) fillSettings();
    }
    get warn() { return this.stats.hunger < 25 || this.stats.happy < 25 || this.stats.energy < 15; }
    renderBars() {
      const s = this.stats;
      const lv = levelFor(s.xp);
      const next = xpForLevel(lv + 1), cur = xpForLevel(lv);
      const row = (icon, v, cls) => `<div class="pb-row ${cls}${v < 25 ? ' low' : ''}"><span>${icon}</span><b><i style="width:${Math.round(v)}%"></i></b></div>`;
      this.bars.innerHTML = `<div class="pb-head">${this.look.name} · Lv ${lv}<small>${s.xp - cur}/${next - cur} XP</small></div>` +
        row('🍖', s.hunger, 'hunger') + row('💗', s.happy, 'happy') + row('⚡', s.energy, 'energy');
      this.root.classList.toggle('warn', this.warn);
    }

    /* --- brain --- */
    decide() {
      const st = this.st;
      const act = petCfg().activity || 'normal';
      const h = new Date().getHours();
      const night = h >= 22 || h < 5;
      const idleFor = performance.now() - st.lastTouch;
      if (ball.active && !ball.held && this.stats.energy > 10 && Math.random() < 0.8) { this.chase(); return; }
      if (this.stats.energy < 15 || (this.stats.energy < 35 && Math.random() < 0.4)) {
        this.setState('sleep', rand(15, 35));
        if (Math.random() < 0.4) this.say(pick(['Ngantuk… 😪', 'Hoaam~ 💤']));
        return;
      }
      if (this.stats.hunger < 25 && Math.random() < 0.6) {
        this.setState('sad', rand(4, 8));
        this.say(pick([`Aku lapar… 🥺 ${TYPES[this.look.type].snack}`, 'Perutku bunyi… 🍽️', 'Kasih camilan dong 🥺 (klik kanan aku)']), 3200);
        return;
      }
      if (this.stats.happy < 25 && Math.random() < 0.5) {
        this.setState('sad', rand(4, 8));
        this.say(pick(['Aku kesepian… 🥺', 'Ajak aku main dong 😢']), 3000);
        return;
      }
      if (musicPlaying() && Math.random() < 0.55) {
        this.setState('dance', rand(4, 9));
        if (Math.random() < 0.3) this.say(pick(['🎵 Lagunya enak!', 'Goyang dikit~ 🎶', '♪ ♫ ♪']));
        return;
      }
      if ((night && Math.random() < 0.5) || (idleFor > 90000 && Math.random() < 0.3)) { this.setState('sleep', rand(12, 30)); return; }
      // Visit the other pet now and then.
      const o = this.other;
      if (o && st.ground && o.st.ground && performance.now() > st.nextSocial && !['sleep', 'drag', 'petting'].includes(o.st.state) && Math.random() < 0.35) {
        st.nextSocial = performance.now() + rand(35000, 70000);
        st.target = { kind: 'pet', pet: o };
        this.setState('walk', 10);
        return;
      }
      const pWalk = reduceMotion ? 0.15 : { calm: 0.3, normal: 0.5, hyper: 0.68 }[act];
      const r = Math.random();
      st.target = null;
      if (r < pWalk) {
        if (Math.random() < 0.5) st.dir = -st.dir;
        this.setState('walk', rand(2, act === 'hyper' ? 5 : 7));
      } else if (r < pWalk + 0.2) {
        this.setState('sit', rand(3, 8));
      } else if (act === 'hyper' && r > 0.9 && st.ground) {
        this.hop(360);
      } else {
        this.setState('idle', rand(2, 5));
      }
    }

    noticeBall() {
      if (['drag', 'petting'].includes(this.st.state)) return;
      if (this.st.state === 'sleep' && this.stats.energy < 30) return; // too tired
      if (this.stats.energy <= 10) { this.say('Capek… nanti ya 😪', 2000); return; }
      setTimeout(() => this.chase(), rand(150, 600));
    }
    chase() {
      if (!ball.active || ball.held) return;
      this.st.target = { kind: 'ball' };
      this.setState('run', 12);
      if (Math.random() < 0.5) this.say(pick(['Bola! 🎾', 'Aku tangkap! 💨', 'Tunggu akuuu~']), 1400);
    }
    pickBall() {
      ball.held = this;
      ball.ground = null;
      this.st.target = { kind: 'home', x: clamp(ball.origin, 40, window.innerWidth - 40) };
      this.setState('fetch', 14);
      this.say(pick(['Dapet! 🎾', 'Hap! 😆', 'Punyaku! 🎾']), 1600);
      const o = this.other;
      if (o && o.st.target?.kind === 'ball') { o.st.target = null; o.setState('sit', 3); o.say(pick(['Yah… 😿', 'Curaaang!', 'Lain kali aku menang 😤']), 1800); }
    }
    dropBall(celebrate = true) {
      if (ball.held !== this) return;
      ball.held = null;
      ball.vx = this.st.dir * 80;
      ball.vy = -180;
      ball.ground = null;
      ball.idleSince = performance.now();
      this.st.target = null;
      if (celebrate) {
        this.setState('happy', 1.6);
        this.burst(['🎾', '✨', '💗'], 4);
        this.say(pick(['Ini bolanya! 🎾', 'Lagi! Lempar lagi! 😆', 'Aku hebat kan? ✨']), 2200);
        this.change('happy', 15);
        this.change('energy', -6);
        this.addXp(10);
        boop('pet');
      }
    }

    hop(power = 420) {
      const st = this.st;
      st.vy = -power;
      st.vx = ['walk', 'run', 'fetch'].includes(st.state) ? st.dir * speed() : 0;
      st.ground = null;
      this.setState('jump');
    }

    chatterLine() {
      const name = (D.settings.name || '').trim();
      const lines = [
        'Hehe~ ✨', 'Mau main sama aku? 🧶', 'Jangan lupa minum air ya 💧', 'Semangat! 💪',
        `${name ? name + ', ' : ''}istirahat sebentar yuk ☕`, 'Elus aku dong 🥺', 'Lempar bola dong 🎾',
      ];
      try {
        if (typeof prayerTimes !== 'undefined' && prayerTimes) {
          const now = new Date();
          const next = prayerTimes.filter((p) => !p.minor).find((p) => p.date > now);
          if (next && next.date - now < 15 * 60000) {
            const min = Math.ceil((next.date - now) / 60000);
            lines.push(`${min} menit lagi ${next.name} 🕌`, `Siap-siap ${next.name} ya 🕌`);
          }
        }
      } catch {}
      try { if (typeof pomo !== 'undefined' && pomo && pomo.running && pomo.mode === 'work') lines.push('Fokus dulu ya, aku jagain 👀'); } catch {}
      try {
        const t = typeof currentTrack === 'function' && currentTrack();
        if (t && !t.paused) lines.push(`🎵 ${t.title.length > 26 ? t.title.slice(0, 26) + '…' : t.title}`);
      } catch {}
      if (this.stats.hunger < 40) lines.push(`Ada ${TYPES[this.look.type].snack} nggak? 🥺`);
      return pick(lines);
    }

    /* --- physics + behaviour each frame --- */
    step(dt) {
      const st = this.st;
      const s = size();
      const W = window.innerWidth;
      const now = performance.now();
      // Needs change slowly over time (per hour: hunger −10, happy −6, energy −8 awake / +45 asleep).
      const sleeping = st.state === 'sleep';
      this.stats.hunger = clamp(this.stats.hunger - dt * 10 / 3600, 0, 100);
      this.stats.happy = clamp(this.stats.happy - dt * 6 / 3600, 0, 100);
      this.stats.energy = clamp(this.stats.energy + dt * (sleeping ? 45 : -8) / 3600, 0, 100);
      if (Math.random() < dt / 5) { this.renderBars(); persist(); }

      if (st.state === 'drag' || st.state === 'petting') {
        // driven by the pointer
      } else if (!st.ground) {
        const prevY = st.y;
        st.vy += GRAVITY * dt;
        st.x += st.vx * dt;
        st.y += st.vy * dt;
        if (st.x < 0) { st.x = 0; st.vx = -st.vx * 0.5; }
        if (st.x > W - s) { st.x = W - s; st.vx = -st.vx * 0.5; }
        if (st.vy > 0) {
          const land = landOn(prevY, st.y, st.x + s / 2);
          if (land) {
            const impact = st.vy;
            st.y = land.top;
            st.ground = land.el;
            st.vx = 0;
            st.vy = 0;
            this.squash();
            if (impact > 2000 && !st.entering) {
              this.setState('dizzy', 1.8);
              this.burst('💫', 3);
              this.say(pick(['Aduh… 😵', 'Pusiiing~', 'Pelan-pelan dong!']));
              this.change('happy', -3);
            } else if (st.target) {
              this.setState(st.target.kind === 'home' ? 'fetch' : st.target.kind === 'ball' ? 'run' : 'walk', 10);
            } else {
              this.setState('idle', rand(0.6, 1.6));
            }
            st.entering = false;
          }
        }
      } else {
        const surf = surfaceOf(st.ground);
        if (!surf) { st.ground = null; st.vx = 0; st.vy = 0; this.setState('fall'); }
        else {
          st.y = surf.top;
          const moving = ['walk', 'run', 'fetch'].includes(st.state);
          if (moving) this.move(dt, surf);
          if (st.ground && now > st.until && !['drag', 'petting'].includes(st.state)) {
            if (st.state === 'fetch' && ball.held === this) this.dropBall(true);
            this.decide();
          }
          if (st.ground && now > st.nextChat && !['sleep', 'drag', 'run', 'fetch'].includes(st.state)) {
            st.nextChat = now + rand(45000, 120000);
            this.say(this.chatterLine(), 3400);
          }
          if (st.state === 'sleep' && Math.random() < dt * 0.6) this.burst('💤', 1);
          if (st.state === 'dance' && Math.random() < dt * 0.8) this.burst(['🎵', '🎶'], 1);
        }
      }
      this.place();
      this.lookAt();
    }

    move(dt, surf) {
      const st = this.st;
      const s = size();
      const W = window.innerWidth;
      const cx = st.x + s / 2;
      let sp = speed();
      const t = st.target;
      let allowFall = false;
      if (t && t.kind === 'ball') {
        if (!ball.active || ball.held) { st.target = null; this.setState('idle', 1); return; }
        sp *= 2.4;
        allowFall = true;
        const dx = ball.x - cx;
        if (Math.abs(dx) > 4) st.dir = Math.sign(dx);
        const dy = ball.y - st.y;
        if (Math.abs(dx) < s * 0.35 && Math.abs(dy) < s * 0.6) { this.pickBall(); return; }
        // Ball is up on a card right above: jump for it.
        if (ball.ground && dy < -20 && Math.abs(dx) < 140) {
          this.hop(Math.min(1150, Math.sqrt(2 * GRAVITY * (-dy + 30))));
          st.vx = clamp(dx * 2.2, -380, 380);
          return;
        }
        if (Math.abs(dx) < 6) return; // waiting under it
      } else if (t && t.kind === 'home') {
        sp *= 1.6;
        allowFall = true;
        const dx = t.x - cx;
        if (Math.abs(dx) < 24) { this.dropBall(true); return; }
        st.dir = Math.sign(dx);
      } else if (t && t.kind === 'pet') {
        const o = t.pet;
        if (!o || !pets.includes(o)) { st.target = null; return; }
        const dx = o.st.x - st.x;
        st.dir = Math.sign(dx) || st.dir;
        if (Math.abs(dx) < s * 1.05 && Math.abs(o.st.y - st.y) < 20) { this.meet(o); return; }
        allowFall = true;
      }
      let nx = st.x + st.dir * sp * dt;
      const ncx = nx + s / 2;
      if (nx < 0 || nx > W - s) {
        if (t) { nx = clamp(nx, 0, W - s); }
        else { st.dir = -st.dir; nx = clamp(nx, 0, W - s); }
      } else if (surf.el !== 'floor' && (ncx < surf.left || ncx > surf.right)) {
        if (allowFall || (!st.edgeTurned && Math.random() < 0.4)) {
          st.edgeTurned = !allowFall;
          st.x = nx;
          st.ground = null;
          st.vx = st.dir * sp * 0.6;
          st.vy = 0;
          this.root.className = `pet fall${this.warn ? ' warn' : ''}`;
          st.state = 'fall';
          return;
        }
        st.dir = -st.dir;
        st.edgeTurned = false;
        nx = st.x;
      }
      st.x = nx;
    }

    meet(o) {
      this.st.target = null;
      this.setState('happy', 1.8);
      o.setState('happy', 1.8);
      o.st.dir = Math.sign(this.st.x - o.st.x) || 1;
      this.burst('💕', 3);
      const pairs = [
        ['Main yuk! 🎾', 'Ayo! 😆'], ['Halo teman! 👋', 'Haloo~ 💕'], ['Kamu lucu deh 🥰', 'Kamu juga! 😳'],
        ['Lapar nggak? 🍪', 'Banget! 🤤'], ['Dengar lagunya? 🎶', 'Goyang yuk! 💃'],
      ];
      const [a, b] = pick(pairs);
      this.say(a, 2200);
      setTimeout(() => o.say(b, 2200), 900);
      this.change('happy', 6);
      o.change('happy', 6);
      this.addXp(3);
      o.addXp(3);
      if (musicPlaying()) setTimeout(() => { this.setState('dance', 5); o.setState('dance', 5); }, 1900);
    }

    place() {
      const s = size();
      this.root.style.transform = `translate(${this.st.x}px, ${this.st.y - s * 1.04}px)`;
      this.sprite.style.setProperty('--dir', this.st.dir);
    }
    squash() {
      this.sprite.classList.remove('squash');
      void this.sprite.offsetWidth;
      this.sprite.classList.add('squash');
    }
    lookAt() {
      const eyes = this.sprite.querySelector('.p-eyes');
      if (!eyes || ptr.x < 0) return;
      const s = size();
      const hx = this.st.x + s / 2, hy = this.st.y - s * 0.55;
      // Look at the ball while chasing, otherwise at the cursor.
      const tx = ball.active && ['run', 'fetch'].includes(this.st.state) ? ball.x : ptr.x;
      const ty = ball.active && ['run', 'fetch'].includes(this.st.state) ? ball.y : ptr.y;
      const dx = tx - hx, dy = ty - hy;
      const d = Math.hypot(dx, dy) || 1;
      const k = d < 420 ? Math.min(1, 120 / d + 0.4) : 0;
      const ex = (dx / d) * 2.4 * k * this.st.dir, ey = (dy / d) * 2 * k;
      eyes.setAttribute('transform', `translate(${ex.toFixed(2)} ${ey.toFixed(2)})`);
    }

    /* --- interaction --- */
    bindPointer() {
      const sp = this.sprite;
      sp.addEventListener('pointerenter', () => this.root.classList.add('show-bars'));
      sp.addEventListener('pointerleave', () => this.root.classList.remove('show-bars'));
      sp.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        try { sp.setPointerCapture(e.pointerId); } catch {}
        this.press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, samples: [] };
        this.st.lastTouch = performance.now();
        this.press.petTimer = setTimeout(() => {
          const p = this.press;
          if (!p || p.moved) return;
          if (this.st.state === 'sleep') this.say('…mmh? 😴', 1600);
          if (ball.held === this) this.dropBall(false);
          this.setState('petting');
          p.petting = true;
          p.hearts = setInterval(() => { this.burst('💗', 1); this.change('happy', 2); this.addXp(1); }, 340);
          this.say(pick(['Hehehe~ 💕', 'Enak dielus 🥰', 'Purrr~', 'Lagi dong 💗']), 2200);
          boop('pet');
        }, 450);
      });
      sp.addEventListener('pointermove', (e) => {
        const p = this.press;
        if (!p || e.pointerId !== p.id) return;
        const s = size();
        if (!p.moved && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 6) {
          p.moved = true;
          clearTimeout(p.petTimer);
          clearInterval(p.hearts);
          if (ball.held === this) this.dropBall(false);
          p.offX = p.x0 - this.st.x;
          p.offY = p.y0 - (this.st.y - s * 1.04);
          this.st.ground = null;
          this.st.target = null;
          this.setState('drag');
          this.say(pick(['Waaah! 😳', 'Mau dibawa ke mana?', 'Hihi, terbang~']), 1800);
        }
        if (p.moved) {
          this.st.x = clamp(e.clientX - p.offX, -s * 0.3, window.innerWidth - s * 0.7);
          this.st.y = e.clientY - p.offY + s * 1.04;
          p.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
          if (p.samples.length > 8) p.samples.shift();
          const n = p.samples.length;
          const lean = n > 1 ? p.samples[n - 1].x - p.samples[n - 2].x : 0;
          sp.style.setProperty('--lean', `${clamp(lean * 1.5, -25, 25)}deg`);
        }
      });
      const end = (e) => {
        const p = this.press;
        if (!p || e.pointerId !== p.id) return;
        clearTimeout(p.petTimer);
        clearInterval(p.hearts);
        this.press = null;
        sp.style.setProperty('--lean', '0deg');
        if (p.moved) {
          const now = performance.now();
          const recent = p.samples.filter((smp) => now - smp.t < 100);
          const ok = recent.length >= 2;
          const a = recent[0], b = recent[recent.length - 1];
          const dt = ok ? Math.max(16, b.t - a.t) / 1000 : 1;
          this.st.vx = ok ? clamp((b.x - a.x) / dt, -1800, 1800) : 0;
          this.st.vy = ok ? clamp((b.y - a.y) / dt, -1800, 1400) : 0;
          if (Math.abs(this.st.vx) > 30) this.st.dir = Math.sign(this.st.vx);
          this.st.ground = null;
          this.setState('fall');
          if (Math.hypot(this.st.vx, this.st.vy) > 1200) this.say(pick(['Wiiiih! 🌀', 'Aaaaa~!', 'Terbaaang! 🚀']), 1500);
        } else if (p.petting) {
          this.setState('happy', 1.2);
          this.burst('💗', 3);
        } else {
          this.onTap();
        }
      };
      sp.addEventListener('pointerup', end);
      sp.addEventListener('pointercancel', end);
      sp.addEventListener('dblclick', (e) => {
        e.preventDefault();
        sp.classList.remove('spin');
        void sp.offsetWidth;
        sp.classList.add('spin');
        this.burst('✨', 4);
        this.say(pick(['Ta-da! ✨', 'Keren kan? 😎', 'Salto! 🤸']), 1800);
        this.addXp(2);
      });
      sp.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (typeof showMenu !== 'function') { this.feed(); return; }
        showMenu(sp, [
          [`${TYPES[this.look.type].snack} Beri camilan`, () => this.feed()],
          ['🎾 Main bola', () => throwBallFromCorner()],
          [this.st.state === 'sleep' ? '☀️ Bangunkan' : '😴 Suruh tidur', () => (this.st.state === 'sleep' ? this.onTap() : (this.setState('sleep', 30), this.say('Selamat tidur… 💤', 1800)))],
          ['⚙️ Pengaturan peliharaan', () => { if (typeof openDrawer === 'function') { openDrawer(); setTimeout(() => $('#set-pet-on')?.scrollIntoView({ block: 'center' }), 350); } }],
        ]);
      });
      sp.addEventListener('animationend', (e) => {
        if (e.animationName === 'pet-spin') sp.classList.remove('spin');
        if (e.animationName === 'pet-squash') sp.classList.remove('squash');
      });
    }

    onTap() {
      const now = performance.now();
      this.taps = this.taps.filter((t) => now - t < 2500);
      this.taps.push(now);
      this.st.lastTouch = now;
      if (this.st.state === 'sleep') {
        this.setState('surprised', 1);
        this.burst('❗', 1);
        this.say(pick(['Eh?! Aku bangun kok! 😳', 'Hoaaam… ada apa? 🥱']), 2200);
        return;
      }
      if (this.taps.length >= 5) {
        this.taps = [];
        this.setState('dizzy', 1.8);
        this.burst('💫', 3);
        this.say(pick(['Geli tauuu! 😵', 'Udah, udah! 🙈', 'Ampun~ 😆']), 2000);
        return;
      }
      boop('pet');
      this.burst(['💗', '💖', '✨'], 4);
      this.change('happy', 4);
      this.addXp(2);
      const name = (D.settings.name || '').trim();
      this.say(pick(['Hihi! 💕', `Halo${name ? ' ' + name : ''}! 👋`, 'Main yuk! 🎾', 'Aku sayang kamu 💗', 'Yeay! ✨']), 2200);
      if (this.st.ground) this.hop(['walk', 'run'].includes(this.st.state) ? 380 : 440);
      setTimeout(() => { if (this.st.ground && this.st.state !== 'drag') this.setState('happy', 1.1); }, 520);
    }

    feed() {
      this.st.lastTouch = performance.now();
      const snack = TYPES[this.look.type].snack;
      this.burst(snack, 3);
      boop('pet');
      if (this.stats.hunger > 95) {
        this.setState('happy', 1.2);
        this.say(pick(['Kenyang banget~ 😌', 'Udah penuh perutku 🫃', 'Nanti aja ya 😋']), 2200, true);
        return;
      }
      this.change('hunger', 35);
      this.change('happy', 5);
      this.addXp(5);
      this.setState('happy', 2);
      this.say(pick(['Nyam nyam! 😋', 'Enaaak! Makasih 💕', 'Lagi dong 🥺', 'Kenyang~ 😌']), 2200, true);
    }

    callHere() {
      const s = size();
      Object.assign(this.st, { x: window.innerWidth / 2 - s / 2 + (this.slot === 'p2' ? s : 0), y: -s, vx: 0, vy: 0, ground: null, entering: true, target: null });
      this.setState('fall');
      setTimeout(() => this.say('Aku datang! ✨', 2000, true), 500);
    }

    react(event, data) {
      if (['drag', 'petting'].includes(this.st.state)) return;
      if (event === 'todos-done') {
        this.setState('happy', 2.5);
        this.burst(['🎉', '👏', '✨'], 6);
        this.say(this.slot === 'p1' ? 'Hebat! Semua tugas selesai 👏🎉' : 'Kereeen! 🥳', 3000, true);
        this.change('happy', 8);
        this.addXp(5);
      } else if (event === 'mood') {
        const m = data.mood;
        const happy = ['😄', '🙂'].includes(m);
        const lines = {
          '😄': ['Yeay, aku ikut senang! 🥳', 'Asyik! 💃'], '🙂': ['Syukurlah 😊', 'Mantap! ✨'], '😐': ['Semoga harimu makin baik ya 🌤️', 'Mau main bola biar seru? 🎾'],
          '😴': ['Istirahat dulu yuk 😴', 'Jangan lupa tidur cukup ya 🌙'], '😔': ['Peluk dulu sini 🤗', 'Aku temenin ya 💗'], '😡': ['Tarik napas dulu… 🫶', 'Mau elus aku biar tenang? 🥺'],
        }[m] || ['💗'];
        this.setState(happy ? 'happy' : 'sit', 2.5);
        this.burst(happy ? ['✨', '💗'] : ['💗', '🤗'], 4);
        if (this.slot === 'p1' || happy) this.say(lines[this.slot === 'p1' ? 0 : 1] || lines[0], 3000, true);
        this.change('happy', 3);
      } else if (event === 'pomo') {
        if (data.running && data.mode === 'work') {
          this.setState('sit', 6);
          this.say(this.slot === 'p1' ? 'Ayo fokus! Aku temenin 💪' : 'Semangat! 📚', 2600);
        } else if (data.mode !== 'work') {
          // Break time: the pets take a nap too.
          const secs = data.running ? Math.min(300, Math.max(30, (data.remaining || 300))) : 60;
          this.setState('sleep', secs);
          if (this.slot === 'p1') this.say('Istirahat dulu~ aku tidur ya 😴', 2600);
        }
      }
    }

    destroy() {
      if (ball.held === this) this.dropBall(false);
      this.root.remove();
    }
  }

  /* ---------------- Loop ---------------- */
  let pets = [];
  let raf = 0;
  let lastT = 0;
  let ptr = { x: -1, y: -1 };
  window.addEventListener('pointermove', (e) => { ptr = { x: e.clientX, y: e.clientY }; }, { passive: true });

  function frame(dt) {
    frameNo++;
    stepBall(dt);
    pets.forEach((p) => p.step(dt));
  }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - (lastT || t)) / 1000);
    lastT = t;
    if (document.hidden || !pets.length) return;
    frame(dt);
  }

  /* ---------------- Public API ---------------- */
  function syncPets() {
    const want = [];
    if (petCfg().enabled) {
      want.push('p1');
      if (petCfg().second?.enabled) want.push('p2');
    }
    pets = pets.filter((p) => { if (want.includes(p.slot)) return true; p.destroy(); return false; });
    for (const slot of want) if (!pets.find((p) => p.slot === slot)) pets.push(new Pet(slot));
    pets.sort((a, b) => (a.slot > b.slot ? 1 : -1));
    pets.forEach((p) => p.build());
    if (!pets.length) hideBall();
  }

  let ready = false;
  async function apply() {
    if (!D || !D.settings.pet) return;
    if (!ready) return;
    syncPets();
    if (pets.length && !raf) { lastT = 0; raf = requestAnimationFrame(tick); }
    if (!pets.length && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  /* ---------------- Settings panel ---------------- */
  function accPicker(boxId, slot) {
    const box = $(boxId);
    if (!box) return;
    const p = pets.find((x) => x.slot === slot);
    const xp = p ? p.stats.xp : (saved[slot]?.xp || 0);
    const lv = levelFor(xp);
    const cur = look(slot).accessory;
    box.innerHTML = '';
    ACCESSORIES.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      const locked = lv < a.lv;
      b.className = 'acc-pick' + (cur === a.id ? ' on' : '') + (locked ? ' locked' : '');
      b.innerHTML = `<span class="ai"></span><span class="an"></span>`;
      b.querySelector('.ai').textContent = locked ? '🔒' : a.icon;
      b.querySelector('.an').textContent = locked ? `Lv ${a.lv}` : a.name;
      b.title = locked ? `Terbuka di level ${a.lv}` : a.name;
      b.disabled = locked;
      b.onclick = () => {
        if (slot === 'p1') petCfg().accessory = a.id;
        else petCfg().second = { ...(petCfg().second || {}), accessory: a.id };
        save();
        apply();
        fillSettings();
        const pet = pets.find((x) => x.slot === slot);
        if (pet && a.id !== 'none') { pet.burst('✨', 3); pet.say(`${a.icon} Cocok nggak? 😊`, 2000, true); }
      };
      box.append(b);
    });
  }
  function statsBox(boxId, levelId, slot) {
    const p = pets.find((x) => x.slot === slot);
    const s = p ? p.stats : { ...freshStats(), ...(saved[slot] || {}) };
    const lv = levelFor(s.xp);
    const lvEl = $(levelId);
    if (lvEl) lvEl.textContent = `· Level ${lv} (${s.xp - xpForLevel(lv)}/${xpForLevel(lv + 1) - xpForLevel(lv)} XP)`;
    const box = $(boxId);
    if (!box) return;
    const row = (icon, label, v) => `<div class="ps-row${v < 25 ? ' low' : ''}"><span>${icon} ${label}</span><b><i style="width:${Math.round(v)}%"></i></b><em>${Math.round(v)}%</em></div>`;
    box.innerHTML = row('🍖', 'Kenyang', s.hunger) + row('💗', 'Senang', s.happy) + row('⚡', 'Energi', s.energy);
  }
  function typePicker(boxId, slot) {
    const box = $(boxId);
    if (!box) return;
    if (!box.childElementCount) {
      Object.entries(TYPES).forEach(([k, t]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pet-pick';
        b.dataset.v = k;
        b.innerHTML = `${petSVG(k, 'none')}<span></span>`;
        b.querySelector('span').textContent = t.name;
        b.onclick = () => {
          if (slot === 'p1') petCfg().type = k;
          else petCfg().second = { ...(petCfg().second || {}), type: k };
          save();
          apply();
          fillSettings();
          const pet = pets.find((x) => x.slot === slot);
          if (pet) { pet.burst('✨', 3); pet.say(`Aku sekarang ${t.name.toLowerCase()}! ✨`, 2000, true); }
        };
        box.append(b);
      });
    }
    box.querySelectorAll('.pet-pick').forEach((b) => b.classList.toggle('on', b.dataset.v === look(slot).type));
  }

  function fillSettings() {
    if (!$('#set-pet-on')) return;
    const p = petCfg();
    $('#set-pet-on').checked = !!p.enabled;
    if (document.activeElement !== $('#set-pet-name')) $('#set-pet-name').value = p.name || '';
    $('#set-pet-bubbles').checked = !!p.bubbles;
    $('#set-pet-sound').checked = !!p.sound;
    document.querySelectorAll('#set-pet-size button').forEach((b) => b.classList.toggle('on', b.dataset.v === p.size));
    document.querySelectorAll('#set-pet-activity button').forEach((b) => b.classList.toggle('on', b.dataset.v === p.activity));
    typePicker('#set-pet-type', 'p1');
    statsBox('#set-pet-stats', '#set-pet-level', 'p1');
    accPicker('#set-pet-acc', 'p1');
    const second = p.second || {};
    $('#set-pet2-on').checked = !!second.enabled;
    $('#set-pet2').hidden = !second.enabled;
    if (document.activeElement !== $('#set-pet2-name')) $('#set-pet2-name').value = second.name || '';
    typePicker('#set-pet2-type', 'p2');
    statsBox('#set-pet2-stats', '#set-pet2-level', 'p2');
    accPicker('#set-pet2-acc', 'p2');
  }

  function bindSettings() {
    const p = petCfg;
    $('#set-pet-on').addEventListener('change', (e) => { p().enabled = e.target.checked; save(); apply(); fillSettings(); });
    $('#set-pet-name').addEventListener('input', (e) => { p().name = e.target.value.trim().slice(0, 16); save(); pets[0]?.renderBars(); });
    $('#set-pet-name').addEventListener('change', () => pets.find((x) => x.slot === 'p1')?.say(`Namaku ${p().name || '…'}! 💕`, 2000, true));
    $('#set-pet-bubbles').addEventListener('change', (e) => { p().bubbles = e.target.checked; save(); });
    $('#set-pet-sound').addEventListener('change', (e) => { p().sound = e.target.checked; save(); });
    document.querySelectorAll('#set-pet-size button').forEach((b) => b.addEventListener('click', () => { p().size = b.dataset.v; save(); apply(); fillSettings(); }));
    document.querySelectorAll('#set-pet-activity button').forEach((b) => b.addEventListener('click', () => { p().activity = b.dataset.v; save(); fillSettings(); }));
    $('#set-pet2-on').addEventListener('change', (e) => {
      p().second = { ...(p().second || {}), enabled: e.target.checked };
      if (e.target.checked && !p().enabled) p().enabled = true;
      save();
      apply();
      fillSettings();
    });
    $('#set-pet2-name').addEventListener('input', (e) => { p().second = { ...(p().second || {}), name: e.target.value.trim().slice(0, 16) }; save(); pets.find((x) => x.slot === 'p2')?.renderBars(); });
    $('#set-pet-call').addEventListener('click', () => {
      if (!p().enabled) { p().enabled = true; save(); apply(); fillSettings(); }
      pets.forEach((x) => x.callHere());
    });
    $('#set-pet-feed').addEventListener('click', () => pets.forEach((x) => x.feed()));
    $('#set-pet-ball').addEventListener('click', () => { if (!pets.length) return; throwBallFromCorner(); });
  }

  let inited = false;
  window.QAPet = {
    async init() {
      if (inited) return;
      inited = true;
      try { saved = { p1: null, p2: null, ...((await Store.get('qa-pet-state')) || {}) }; } catch {}
      bindSettings();
      ready = true;
      apply();
      // Greet once.
      setTimeout(() => {
        const p = pets[0];
        if (!p) return;
        const h = new Date().getHours();
        const greet = h < 4 ? 'Malam' : h < 11 ? 'Pagi' : h < 15 ? 'Siang' : h < 18 ? 'Sore' : 'Malam';
        const name = (D.settings.name || '').trim();
        p.say(p.stats.hunger < 30 ? `${greet}${name ? ', ' + name : ''}… aku lapar 🥺` : `${greet}${name ? ', ' + name : ''}! Aku ${p.look.name} ✨`, 3200);
        if (pets[1]) setTimeout(() => pets[1].say(`Aku ${pets[1].look.name}! 👋`, 2400), 1400);
      }, 1100);
      window.addEventListener('pagehide', () => persist(true));
      document.addEventListener('visibilitychange', () => { if (document.hidden) persist(true); });
    },
    apply,
    fillSettings,
    say: (t) => pets[0]?.say(t, 2600, true),
    event: (name, data) => pets.forEach((p, i) => setTimeout(() => p.react(name, data || {}), i * 500)),
    throwBall: throwBallFromCorner,
    // Runs physics frames by hand (handy when the page is in a background tab).
    _step(frames = 60) { for (let i = 0; i < frames; i++) frame(1 / 60); return pets.map((p) => ({ slot: p.slot, x: Math.round(p.st.x), y: Math.round(p.st.y), state: p.st.state, ground: p.st.ground === 'floor' ? 'floor' : p.st.ground ? 'card' : null })); },
    _pets: () => pets,
    _ball: () => ball,
  };
})();
