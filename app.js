/* ==========================================================
   Комфортік — затишний щоденник справ на весь рік
   Усі дані зберігаються на телефоні (localStorage).
   ========================================================== */
'use strict';

/* ---------- Константи ---------- */

const STORE_KEY = 'komfortik:v1';
const APP_VERSION = '1.0';

const PALETTE = ['apricot', 'rose', 'lilac', 'sky', 'sage', 'honey', 'mint', 'plum'];

const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const MONTHS_SHORT = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
const WD_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WD_FULL = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'];

const MOODS = [
  { v: 1, e: '😣', t: 'Важко' },
  { v: 2, e: '😕', t: 'Так собі' },
  { v: 3, e: '😌', t: 'Спокійно' },
  { v: 4, e: '🙂', t: 'Добре' },
  { v: 5, e: '🥰', t: 'Чудово' }
];

const REPEATS = [
  { v: 'none', t: 'Один раз' },
  { v: 'daily', t: 'Щодня' },
  { v: 'weekdays', t: 'По буднях' },
  { v: 'weekly', t: 'Щотижня' },
  { v: 'monthly', t: 'Щомісяця' },
  { v: 'yearly', t: 'Щороку' }
];

const CHEERS = [
  'Усе виконано. Ти молодець 🌿',
  'День закрито на всі 100 ✨',
  'Можна видихнути і зробити чай ☕',
  'Подушечка задоволена 🥰'
];

const ICON = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M17 3l3 3-3 3"/><path d="M20 6H9a5 5 0 0 0-5 5v1"/><path d="M7 21l-3-3 3-3"/><path d="M4 18h11a5 5 0 0 0 5-5v-1"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>'
};

/* ---------- Допоміжні функції ---------- */

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
const todayKey = () => keyOf(new Date());
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b === 1) return forms[0];
  if (b >= 2 && b <= 4) return forms[1];
  return forms[2];
}

function formatLong(k) {
  const d = fromKey(k);
  const year = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}${year}, ${WD_FULL[d.getDay()]}`;
}

function formatShort(k) {
  const d = fromKey(k);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

function dayTitle(k) {
  const t = todayKey();
  if (k === t) return 'Сьогодні';
  if (k === addDays(t, 1)) return 'Завтра';
  if (k === addDays(t, -1)) return 'Вчора';
  const w = WD_FULL[fromKey(k).getDay()];
  return w[0].toUpperCase() + w.slice(1);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Доброї ночі 🌙';
  if (h < 12) return 'Доброго ранку ☀️';
  if (h < 18) return 'Гарного дня 🌿';
  return 'Доброго вечора 🕯️';
}

/* ---------- Дані ---------- */

function freshState(withSamples) {
  const t = todayKey();
  const s = {
    version: 1,
    tasks: [],
    days: {},
    categories: [
      { id: 'personal', name: 'Особисте', color: 'rose' },
      { id: 'work', name: 'Робота', color: 'sky' },
      { id: 'home', name: 'Дім', color: 'apricot' },
      { id: 'health', name: 'Здоровʼя', color: 'sage' },
      { id: 'study', name: 'Навчання', color: 'lilac' }
    ],
    settings: { theme: 'auto' }
  };
  if (withSamples) {
    const now = Date.now();
    s.tasks = [
      { id: uid(), title: 'Натисни на квадратик, щоб виконати справу', cat: 'personal', date: t, time: '', repeat: 'none', done: {}, skip: {}, created: now },
      { id: uid(), title: 'Склянка води зранку 💧', cat: 'health', date: t, time: '08:00', repeat: 'daily', done: {}, skip: {}, created: now + 1 },
      { id: uid(), title: 'Додати свою першу справу кнопкою +', cat: 'personal', date: t, time: '', repeat: 'none', done: {}, skip: {}, created: now + 2 },
      { id: uid(), title: 'Зазирнути у вкладку «Рік»', cat: 'study', date: t, time: '', repeat: 'none', done: {}, skip: {}, created: now + 3 }
    ];
  }
  return s;
}

function normalize(s) {
  const base = freshState(false);
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...(s.settings || {}) },
    categories: Array.isArray(s.categories) && s.categories.length ? s.categories : base.categories,
    tasks: Array.isArray(s.tasks)
      ? s.tasks.filter((t) => t && t.id && t.title && t.date)
        .map((t) => ({ time: '', repeat: 'none', ...t, done: t.done || {}, skip: t.skip || {} }))
      : [],
    days: s.days && typeof s.days === 'object' ? s.days : {}
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { /* сховище недоступне або пошкоджене */ }
  return null;
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('Не вдалося зберегти. Звільни місце на телефоні');
  }
}

let state = load();
if (!state) { state = freshState(true); save(); }

/* Стан інтерфейсу (не зберігається) */
const now0 = new Date();
const ui = {
  tab: 'today',
  date: todayKey(),
  calY: now0.getFullYear(),
  calM: now0.getMonth(),
  calSel: todayKey(),
  year: now0.getFullYear(),
  yearMode: 'tasks',
  lastProgress: 0,
  lastCat: null,
  today: todayKey()
};

/* ---------- Логіка справ ---------- */

function occursOn(t, k) {
  if (k < t.date) return false;
  if (t.until && k > t.until) return false;
  if (t.skip && t.skip[k]) return false;
  const rep = t.repeat || 'none';
  if (rep === 'none') return k === t.date;
  const d = fromKey(k), s = fromKey(t.date);
  switch (rep) {
    case 'daily': return true;
    case 'weekdays': { const w = d.getDay(); return w > 0 && w < 6; }
    case 'weekly': return d.getDay() === s.getDay();
    case 'monthly': return d.getDate() === Math.min(s.getDate(), daysInMonth(d.getFullYear(), d.getMonth()));
    case 'yearly': return d.getMonth() === s.getMonth()
      && d.getDate() === Math.min(s.getDate(), daysInMonth(d.getFullYear(), d.getMonth()));
    default: return false;
  }
}

const isDone = (t, k) => !!(t.done && t.done[k]);

function tasksOn(k) {
  return state.tasks
    .filter((t) => occursOn(t, k))
    .sort((a, b) => {
      const d = isDone(a, k) - isDone(b, k);
      if (d) return d;
      const ta = a.time || '99:99', tb = b.time || '99:99';
      if (ta !== tb) return ta < tb ? -1 : 1;
      return (a.created || 0) - (b.created || 0);
    });
}

function statsOn(k) {
  let total = 0, done = 0;
  for (const t of state.tasks) {
    if (occursOn(t, k)) { total++; if (isDone(t, k)) done++; }
  }
  return { total, done };
}

function catById(id) {
  return state.categories.find((c) => c.id === id) || { id: '', name: 'Без категорії', color: 'plum' };
}

const repeatLabel = (v) => (REPEATS.find((r) => r.v === v) || REPEATS[0]).t;

/* ---------- Шматочки інтерфейсу ---------- */

function cushionSVG(p, total) {
  const fillY = 14 + (1 - p) * 92;
  const happy = total > 0 && p >= 1;
  const curve = 72 + 12 * p;
  const eyes = happy
    ? '<path d="M39 60q5-7 10 0M71 60q5-7 10 0" fill="none" stroke="#2D2A3E" stroke-width="3.6" stroke-linecap="round"/>'
    : total === 0
      ? '<path d="M39 59h10M71 59h10" fill="none" stroke="#2D2A3E" stroke-width="3.6" stroke-linecap="round"/>'
      : '<circle cx="44" cy="58" r="4.6" fill="#2D2A3E"/><circle cx="76" cy="58" r="4.6" fill="#2D2A3E"/>';
  const shape = 'M60 14.6c25.1 0 34.3 1.8 39.3 6.7s6.7 14.1 6.7 38.7-1.8 33.7-6.7 38.7-14.1 6.7-39.3 6.7-34.3-1.8-39.3-6.7-6.7-14.1-6.7-38.7 1.8-33.7 6.7-38.7 14.1-6.7 39.3-6.7z';
  return `
  <svg viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <clipPath id="cushion-clip"><path d="${shape}"/></clipPath>
      <linearGradient id="cushion-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFC09A"/><stop offset="1" stop-color="#FF9466"/>
      </linearGradient>
    </defs>
    <path d="${shape}" fill="var(--cushion-empty)"/>
    <g clip-path="url(#cushion-clip)">
      <rect class="c-fill" x="0" y="0" width="120" height="120" fill="url(#cushion-grad)"
        style="transform: translateY(${(14 + (1 - ui.lastProgress) * 92).toFixed(1)}px)" data-y="${fillY.toFixed(1)}"/>
    </g>
    ${eyes}
    <path class="c-mouth" d="M48 73Q60 ${curve.toFixed(1)} 72 73" fill="none" stroke="#2D2A3E" stroke-width="3.6" stroke-linecap="round"/>
    <circle cx="35" cy="70" r="5" fill="#FF7A8A" opacity="${(0.15 + 0.4 * p).toFixed(2)}"/>
    <circle cx="85" cy="70" r="5" fill="#FF7A8A" opacity="${(0.15 + 0.4 * p).toFixed(2)}"/>
  </svg>`;
}

function taskHTML(t, k) {
  const c = catById(t.cat);
  const done = isDone(t, k);
  const tags = [`<span class="tag cat">${esc(c.name)}</span>`];
  if (t.time) tags.push(`<span class="tag">${ICON.clock}${t.time}</span>`);
  if (t.repeat && t.repeat !== 'none') tags.push(`<span class="tag">${ICON.repeat}${repeatLabel(t.repeat).toLowerCase()}</span>`);
  return `
  <div class="task${done ? ' done' : ''}" data-id="${t.id}" data-date="${k}" style="--cat: var(--c-${c.color})">
    <button class="check" data-act="toggle" aria-label="${done ? 'Позначити як невиконану' : 'Позначити як виконану'}"><span>${ICON.check}</span></button>
    <button class="task-body" data-act="edit">
      <span class="task-title">${esc(t.title)}</span>
      <span class="task-tags">${tags.join('')}</span>
    </button>
  </div>`;
}

function emptyHTML(k) {
  const past = k < todayKey();
  return `
  <div class="empty">
    <div class="empty-emoji">${past ? '🍃' : '☁️'}</div>
    <p>${past ? 'Цього дня справ не було' : 'Тут поки порожньо і спокійно'}</p>
    <button class="btn soft" data-act="add">Додати справу</button>
  </div>`;
}

/* ---------- Вкладка «Сьогодні» ---------- */

function viewToday() {
  const k = ui.date;
  const t = todayKey();
  const list = tasksOn(k);
  const st = statsOn(k);
  const p = st.total ? st.done / st.total : 0;
  const day = state.days[k] || {};

  const d = fromKey(k);
  const monday = addDays(k, -((d.getDay() + 6) % 7));
  let week = '';
  for (let i = 0; i < 7; i++) {
    const dk = addDays(monday, i);
    const s = statsOn(dk);
    const dot = s.total === 0 ? '' : s.done === s.total ? 'full' : 'some';
    week += `
      <button class="wd${dk === k ? ' is-sel' : ''}${dk === t ? ' is-today' : ''}" data-act="pick-day" data-k="${dk}">
        <small>${WD_SHORT[fromKey(dk).getDay()]}</small><b>${fromKey(dk).getDate()}</b><i class="${dot}"></i>
      </button>`;
  }

  const sub = k === t ? greeting() : k < t ? 'Минулий день' : 'Попереду';

  return `
  <header class="hero">
    <div>
      <p class="hero-greet">${sub}</p>
      <h1>${dayTitle(k)}</h1>
      <p class="hero-date">${formatLong(k)}</p>
    </div>
    <div class="cushion" id="cushion">
      ${cushionSVG(p, st.total)}
      <div class="cushion-label">${st.total ? `${st.done} з ${st.total}` : 'Вільний день'}</div>
    </div>
  </header>

  <div class="week" id="week">
    <button class="icon-btn" data-act="week-prev" aria-label="Попередній тиждень">${ICON.left}</button>
    <div class="week-days">${week}</div>
    <button class="icon-btn" data-act="week-next" aria-label="Наступний тиждень">${ICON.right}</button>
  </div>
  ${k !== t ? '<button class="back-today" data-act="go-today">Повернутися до сьогодні</button>' : ''}

  <section class="section">
    <div class="section-head">
      <h2>Справи</h2>
      ${st.total ? `<span class="count">${st.total} ${plural(st.total, ['справа', 'справи', 'справ'])}</span>` : ''}
    </div>
    <div class="task-list">${list.length ? list.map((x) => taskHTML(x, k)).join('') : emptyHTML(k)}</div>
  </section>

  <section class="soft-block">
    <h3>${k === t ? 'Як ти сьогодні?' : 'Настрій дня'}</h3>
    <div class="moods">
      ${MOODS.map((m) => `
        <button class="mood${day.mood === m.v ? ' on' : ''}" data-act="mood" data-v="${m.v}" aria-pressed="${day.mood === m.v}">
          <span>${m.e}</span><small>${m.t}</small>
        </button>`).join('')}
    </div>
  </section>

  <section class="soft-block">
    <h3>Нотатка дня</h3>
    <textarea class="note" id="note" rows="3" placeholder="Що запамʼяталося, за що вдячний, думки на завтра">${esc(day.note || '')}</textarea>
  </section>`;
}

/* ---------- Вкладка «Календар» ---------- */

function viewCalendar() {
  const y = ui.calY, m = ui.calM;
  const t = todayKey();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const dim = daysInMonth(y, m);
  let cells = '';
  for (let i = 0; i < offset; i++) cells += '<span></span>';
  for (let day = 1; day <= dim; day++) {
    const k = `${y}-${pad(m + 1)}-${pad(day)}`;
    const list = tasksOn(k);
    const done = list.filter((x) => isDone(x, k)).length;
    const colors = [...new Set(list.map((x) => catById(x.cat).color))].slice(0, 3);
    const cls = [
      'cal-day',
      k === t ? 'is-today' : '',
      k === ui.calSel ? 'is-sel' : '',
      list.length && done === list.length ? 'full' : '',
      k < t ? 'past' : ''
    ].filter(Boolean).join(' ');
    cells += `
      <button class="${cls}" data-act="cal-pick" data-k="${k}" aria-label="${formatShort(k)}">
        <span class="num">${day}</span>
        <span class="dots">${colors.map((c) => `<i style="background: var(--c-${c})"></i>`).join('')}</span>
      </button>`;
  }

  const sel = ui.calSel;
  const list = tasksOn(sel);

  return `
  <h1 class="page-title">Календар</h1>
  <div class="cal">
    <div class="cal-nav">
      <button class="icon-btn" data-act="cal-prev" aria-label="Попередній місяць">${ICON.left}</button>
      <h2>${MONTHS[m]} <span>${y}</span></h2>
      <button class="icon-btn" data-act="cal-next" aria-label="Наступний місяць">${ICON.right}</button>
    </div>
    <div class="cal-wd">${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((w) => `<span>${w}</span>`).join('')}</div>
    <div class="cal-grid">${cells}</div>
  </div>

  <section class="section">
    <div class="section-head">
      <h2>${sel === t ? 'Сьогодні' : formatShort(sel)}</h2>
      <button class="link-btn" data-act="open-day" data-k="${sel}">Відкрити день</button>
    </div>
    <div class="task-list">${list.length ? list.map((x) => taskHTML(x, sel)).join('') : emptyHTML(sel)}</div>
  </section>`;
}

/* ---------- Вкладка «Рік» ---------- */

function viewYear() {
  const y = ui.year;
  const t = todayKey();
  const mode = ui.yearMode;

  let doneTotal = 0, perfect = 0, run = 0, best = 0;
  const moodCount = [0, 0, 0, 0, 0, 0];
  const monthDone = new Array(12).fill(0);
  const cell = {};

  for (let m = 0; m < 12; m++) {
    const dim = daysInMonth(y, m);
    for (let d = 1; d <= dim; d++) {
      const k = `${y}-${pad(m + 1)}-${pad(d)}`;
      const s = statsOn(k);
      const mood = state.days[k]?.mood || 0;
      if (mood) moodCount[mood]++;
      doneTotal += s.done;
      monthDone[m] += s.done;
      if (k <= t && s.total > 0) {
        if (s.done === s.total) { perfect++; run++; best = Math.max(best, run); } else run = 0;
      }
      let lvl = '';
      if (mode === 'mood') {
        lvl = mood ? `m${mood}` : '';
      } else if (k <= t && s.total > 0) {
        const r = s.done / s.total;
        lvl = r === 0 ? 'l1' : r < 0.5 ? 'l2' : r < 1 ? 'l3' : 'l4';
      }
      cell[k] = lvl;
    }
  }

  let grid = '<span></span>' + MONTHS_SHORT.map((m) => `<span class="mh">${m}</span>`).join('');
  for (let d = 1; d <= 31; d++) {
    grid += `<span class="dl">${d % 5 === 0 || d === 1 ? d : ''}</span>`;
    for (let m = 0; m < 12; m++) {
      if (d > daysInMonth(y, m)) { grid += '<span class="px void"></span>'; continue; }
      const k = `${y}-${pad(m + 1)}-${pad(d)}`;
      grid += `<button class="px ${cell[k]}${k === t ? ' is-today' : ''}" data-act="year-pick" data-k="${k}" aria-label="${formatShort(k)}"></button>`;
    }
  }

  const bestMonth = Math.max(...monthDone) > 0 ? MONTHS[monthDone.indexOf(Math.max(...monthDone))] : 'ще попереду';
  const moodTotal = moodCount.reduce((a, b) => a + b, 0);

  const legend = mode === 'mood'
    ? MOODS.map((m) => `<span><i class="px m${m.v}"></i>${m.t}</span>`).join('')
    : `<span><i class="px l1"></i>Не виконано</span>
       <span><i class="px l2"></i>Трохи</span>
       <span><i class="px l3"></i>Більшість</span>
       <span><i class="px l4"></i>Усе</span>`;

  const extra = mode === 'mood'
    ? `<div class="mood-bars">
        ${MOODS.slice().reverse().map((m) => {
          const n = moodCount[m.v];
          const w = moodTotal ? Math.round((n / moodTotal) * 100) : 0;
          return `<div class="mood-bar"><span>${m.e}</span><span class="track"><i style="width:${w}%; background: var(--m${m.v})"></i></span><em>${n}</em></div>`;
        }).join('')}
      </div>`
    : `<div class="stats">
        <div class="stat"><b>${doneTotal}</b><span>${plural(doneTotal, ['справу виконано', 'справи виконано', 'справ виконано'])}</span></div>
        <div class="stat"><b>${perfect}</b><span>${plural(perfect, ['ідеальний день', 'ідеальні дні', 'ідеальних днів'])}</span></div>
        <div class="stat"><b>${best}</b><span>найдовша серія</span></div>
        <div class="stat"><b style="font-size:19px; padding:5px 0 4px">${bestMonth}</b><span>найпродуктивніший місяць</span></div>
      </div>`;

  return `
  <div class="year-head">
    <h1>${y}</h1>
    <div class="arrows">
      <button class="icon-btn" data-act="year-prev" aria-label="Попередній рік">${ICON.left}</button>
      <button class="icon-btn" data-act="year-next" aria-label="Наступний рік">${ICON.right}</button>
    </div>
  </div>
  <div class="segmented">
    <button class="${mode === 'tasks' ? 'on' : ''}" data-act="year-mode" data-v="tasks">Справи</button>
    <button class="${mode === 'mood' ? 'on' : ''}" data-act="year-mode" data-v="mood">Настрій</button>
  </div>
  <div class="pixels-wrap">
    <div class="pixels">${grid}</div>
    <div class="legend">${legend}</div>
  </div>
  ${extra}`;
}

/* ---------- Вкладка «Налаштування» ---------- */

function viewSettings() {
  const th = state.settings.theme;
  const cats = state.categories.map((c) => {
    const n = state.tasks.filter((t) => t.cat === c.id).length;
    return `
      <button class="row" data-act="cat-edit" data-id="${c.id}">
        <span class="swatch" style="background: var(--c-${c.color})"></span>
        <span class="grow">${esc(c.name)}<small>${n} ${plural(n, ['справа', 'справи', 'справ'])}</small></span>
        ${ICON.chev}
      </button>`;
  }).join('');

  return `
  <h1 class="page-title">Налаштування</h1>

  <p class="group-title">Тема</p>
  <div class="segmented" style="margin-bottom: 26px">
    <button class="${th === 'auto' ? 'on' : ''}" data-act="theme" data-v="auto">Авто</button>
    <button class="${th === 'light' ? 'on' : ''}" data-act="theme" data-v="light">Світла</button>
    <button class="${th === 'dark' ? 'on' : ''}" data-act="theme" data-v="dark">Темна</button>
  </div>

  <p class="group-title">Категорії</p>
  <div class="group">
    ${cats}
    <button class="row" data-act="cat-add">
      <span class="swatch plus">+</span>
      <span class="grow">Додати категорію</span>
    </button>
  </div>

  <p class="group-title">Мої дані</p>
  <div class="group">
    <button class="row" data-act="export">
      <span class="grow">Зберегти резервну копію<small>Файл можна покласти у «Файли» або iCloud</small></span>
      ${ICON.chev}
    </button>
    <button class="row" data-act="import">
      <span class="grow">Відновити з копії<small>Замінить усі поточні справи</small></span>
      ${ICON.chev}
    </button>
    <button class="row danger" data-act="clear-all">
      <span class="grow">Стерти всі дані</span>
    </button>
  </div>

  <div class="about">
    <img src="icons/icon-192.png" alt="">
    <b>Комфортік</b>
    <p>Версія ${APP_VERSION}. Усі записи зберігаються тільки на цьому телефоні.</p>
  </div>`;
}

/* ---------- Відмальовування ---------- */

const VIEWS = { today: viewToday, calendar: viewCalendar, year: viewYear, settings: viewSettings };

function render(animate = false) {
  const v = $('#view');
  v.innerHTML = VIEWS[ui.tab]();
  if (animate) {
    v.classList.remove('view-enter');
    void v.offsetWidth;
    v.classList.add('view-enter');
  }
  $$('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  $('#fab').classList.toggle('hidden', !(ui.tab === 'today' || ui.tab === 'calendar'));

  // плавно наповнюємо подушечку
  const fill = $('.c-fill');
  if (fill) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transform = `translateY(${fill.dataset.y}px)`;
    }));
    const st = statsOn(ui.date);
    ui.lastProgress = st.total ? st.done / st.total : 0;
  }
}

function applyTheme() {
  const th = state.settings.theme;
  const root = document.documentElement;
  if (th === 'auto') delete root.dataset.theme; else root.dataset.theme = th;
  const dark = th === 'dark' || (th === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#1B1926' : '#F1EEF8');
}

/* ---------- Шторка знизу ---------- */

let closeTimer = null;
let sheetOptions = [];

function openSheet(html, onMount) {
  clearTimeout(closeTimer);
  const root = $('#sheet-root');
  root.innerHTML = `
    <div class="sheet-backdrop" data-act="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div>${html}</div>`;
  root.classList.add('open');
  document.body.classList.add('noscroll');
  void root.offsetWidth;
  root.classList.add('show');
  if (onMount) onMount($('.sheet', root));
}

function closeSheet() {
  const root = $('#sheet-root');
  root.classList.remove('show');
  document.body.classList.remove('noscroll');
  closeTimer = setTimeout(() => { root.classList.remove('open'); root.innerHTML = ''; }, 300);
}

function actionSheet(title, text, options) {
  sheetOptions = options;
  openSheet(`
    <h2 class="sheet-title">${esc(title)}</h2>
    ${text ? `<p class="sheet-text">${esc(text)}</p>` : ''}
    <div class="action-list">
      ${options.map((o, i) => `<button class="btn${o.danger ? ' danger' : ''}" data-act="as-opt" data-i="${i}">${esc(o.label)}</button>`).join('')}
      <button class="btn cancel" data-act="sheet-close">Скасувати</button>
    </div>`);
}

/* ---------- Форма справи ---------- */

function openTaskSheet(id, dateK) {
  const t = id ? state.tasks.find((x) => x.id === id) : null;
  const catId = t ? t.cat : (ui.lastCat && catById(ui.lastCat).id ? ui.lastCat : state.categories[0].id);
  const rep = t ? t.repeat : 'none';

  openSheet(`
    <h2 class="sheet-title">${t ? 'Редагувати справу' : 'Нова справа'}</h2>
    <input id="f-title" class="input big" placeholder="Що потрібно зробити?" maxlength="140"
      autocomplete="off" enterkeyhint="done" value="${esc(t ? t.title : '')}">

    <label class="label">Категорія</label>
    <div class="chips" data-group="cat">
      ${state.categories.map((c) => `
        <button type="button" class="chip${c.id === catId ? ' on' : ''}" data-act="chip" data-v="${c.id}" style="--cat: var(--c-${c.color})">
          <span class="dot"></span>${esc(c.name)}
        </button>`).join('')}
    </div>

    <div class="row2">
      <div>
        <label class="label" for="f-date">${rep !== 'none' ? 'Починаючи з' : 'Дата'}</label>
        <input type="date" id="f-date" class="input" value="${t ? t.date : dateK}">
      </div>
      <div>
        <div class="label-row label"><label for="f-time">Час</label><button type="button" data-act="clear-time">без часу</button></div>
        <input type="time" id="f-time" class="input" value="${t ? t.time : ''}">
      </div>
    </div>

    <label class="label">Повторювати</label>
    <div class="chips" data-group="rep">
      ${REPEATS.map((r) => `<button type="button" class="chip${r.v === rep ? ' on' : ''}" data-act="chip" data-v="${r.v}">${r.t}</button>`).join('')}
    </div>

    <div class="sheet-actions">
      ${t ? `<button class="btn ghost danger" data-act="task-delete" data-id="${t.id}" data-k="${dateK}">Видалити</button>` : ''}
      <button class="btn primary" data-act="task-save" data-id="${t ? t.id : ''}" data-k="${dateK}">${t ? 'Зберегти' : 'Додати справу'}</button>
    </div>`, (sheet) => {
    if (!t) $('#f-title', sheet).focus();
  });
}

function saveTask(el) {
  const titleEl = $('#f-title');
  const title = titleEl.value.trim();
  if (!title) {
    titleEl.classList.remove('shake');
    void titleEl.offsetWidth;
    titleEl.classList.add('shake');
    titleEl.focus();
    return;
  }
  const date = $('#f-date').value || el.dataset.k || todayKey();
  const time = $('#f-time').value || '';
  const cat = $('[data-group="cat"] .chip.on')?.dataset.v || state.categories[0].id;
  const repeat = $('[data-group="rep"] .chip.on')?.dataset.v || 'none';

  const id = el.dataset.id;
  if (id) {
    const t = state.tasks.find((x) => x.id === id);
    if (t) Object.assign(t, { title, date, time, cat, repeat });
  } else {
    state.tasks.push({ id: uid(), title, cat, date, time, repeat, done: {}, skip: {}, created: Date.now() });
  }
  ui.lastCat = cat;
  save();
  closeSheet();

  const shownDate = ui.tab === 'calendar' ? ui.calSel : ui.date;
  if (!id && repeat === 'none' && date !== shownDate) toast(`Додано на ${formatShort(date)}`);
  else if (!id) toast('Справу додано');
  render();
}

function deleteTask(el) {
  const id = el.dataset.id, k = el.dataset.k;
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  const snapshot = JSON.stringify(state.tasks);
  const undo = { label: 'Повернути', fn: () => { state.tasks = JSON.parse(snapshot); save(); render(); } };
  const removeAll = () => { state.tasks = state.tasks.filter((x) => x.id !== id); };

  if (!t.repeat || t.repeat === 'none') {
    removeAll(); save(); closeSheet(); render();
    toast('Справу видалено', undo);
    return;
  }

  actionSheet('Видалити повторювану справу?', `«${t.title}»`, [
    { label: 'Тільки цього дня', fn: () => { t.skip[k] = true; save(); render(); toast('Прибрано з цього дня', undo); } },
    {
      label: 'Цього і наступних днів', fn: () => {
        const until = addDays(k, -1);
        if (until < t.date) removeAll(); else t.until = until;
        save(); render(); toast('Повтори зупинено', undo);
      }
    },
    { label: 'Усі повтори', danger: true, fn: () => { removeAll(); save(); render(); toast('Справу видалено', undo); } }
  ]);
}

function toggleTask(el) {
  const row = el.closest('.task');
  const id = row.dataset.id, k = row.dataset.date;
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  const before = statsOn(k);
  if (t.done[k]) delete t.done[k]; else t.done[k] = true;
  save();
  render();
  const nowDone = isDone(t, k);
  const fresh = $(`.task[data-id="${id}"][data-date="${k}"]`);
  if (fresh && nowDone) fresh.classList.add('pop');
  const after = statsOn(k);
  if (nowDone && after.total > 0 && after.done === after.total && before.done !== before.total) celebrate();
  const cushion = $('#cushion');
  if (cushion && nowDone) { cushion.classList.remove('bounce'); void cushion.offsetWidth; cushion.classList.add('bounce'); }
}

/* ---------- Категорії ---------- */

function openCategorySheet(id) {
  const c = id ? state.categories.find((x) => x.id === id) : null;
  const used = new Set(state.categories.map((x) => x.color));
  const color = c ? c.color : (PALETTE.find((p) => !used.has(p)) || PALETTE[0]);
  openSheet(`
    <h2 class="sheet-title">${c ? 'Категорія' : 'Нова категорія'}</h2>
    <input id="f-cat" class="input big" placeholder="Назва, наприклад «Спорт»" maxlength="24" autocomplete="off" value="${esc(c ? c.name : '')}">
    <label class="label">Колір</label>
    <div class="swatches" data-group="color">
      ${PALETTE.map((p) => `<button type="button" class="${p === color ? 'on' : ''}" data-act="chip" data-v="${p}" style="background: var(--c-${p})" aria-label="${p}"></button>`).join('')}
    </div>
    <div class="sheet-actions">
      ${c && state.categories.length > 1 ? `<button class="btn ghost danger" data-act="cat-delete" data-id="${c.id}">Видалити</button>` : ''}
      <button class="btn primary" data-act="cat-save" data-id="${c ? c.id : ''}">Зберегти</button>
    </div>`, (sheet) => { if (!c) $('#f-cat', sheet).focus(); });
}

function saveCategory(el) {
  const input = $('#f-cat');
  const name = input.value.trim();
  if (!name) { input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); return; }
  const color = $('[data-group="color"] .on')?.dataset.v || PALETTE[0];
  const id = el.dataset.id;
  if (id) Object.assign(state.categories.find((x) => x.id === id), { name, color });
  else state.categories.push({ id: uid(), name, color });
  save(); closeSheet(); render();
}

function deleteCategory(el) {
  const id = el.dataset.id;
  const c = state.categories.find((x) => x.id === id);
  const rest = state.categories.filter((x) => x.id !== id);
  const n = state.tasks.filter((t) => t.cat === id).length;
  actionSheet(`Видалити «${c.name}»?`,
    n ? `${n} ${plural(n, ['справа перейде', 'справи перейдуть', 'справ перейдуть'])} у «${rest[0].name}».` : '',
    [{
      label: 'Видалити категорію', danger: true, fn: () => {
        state.tasks.forEach((t) => { if (t.cat === id) t.cat = rest[0].id; });
        state.categories = rest;
        save(); render(); toast('Категорію видалено');
      }
    }]);
}

/* ---------- Резервна копія ---------- */

async function exportData() {
  const json = JSON.stringify(state, null, 2);
  const name = `komfortik-${todayKey()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Комфортік: резервна копія' });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Резервну копію збережено');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.tasks)) throw new Error('bad');
    } catch (e) {
      toast('Це не файл Комфортіка. Обери файл komfortik-….json');
      return;
    }
    const n = data.tasks.length;
    actionSheet('Відновити з копії?', `У файлі ${n} ${plural(n, ['справа', 'справи', 'справ'])}. Поточні дані буде замінено.`, [{
      label: 'Відновити', fn: () => {
        state = normalize(data); save(); applyTheme(); render(); toast('Дані відновлено');
      }
    }]);
  };
  reader.readAsText(file);
}

/* ---------- Сповіщення і святкування ---------- */

let toastTimer = null;
let toastAction = null;

function toast(msg, action) {
  const el = $('#toast');
  toastAction = action || null;
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-act="toast-action">${esc(action.label)}</button>` : ''}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 4500 : 2600);
}

function celebrate() {
  toast(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = $('#cushion')?.getBoundingClientRect();
  const x = box ? box.left + box.width / 2 : window.innerWidth / 2;
  const y = box ? box.top + box.height / 2 : 160;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  const colors = ['var(--c-apricot)', 'var(--c-rose)', 'var(--c-lilac)', 'var(--c-honey)', 'var(--c-mint)', 'var(--c-sky)'];
  for (let i = 0; i < 26; i++) {
    const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
    const dist = 70 + Math.random() * 110;
    const p = document.createElement('i');
    p.style.cssText = `--x:${x}px; --y:${y}px; --c:${colors[i % colors.length]};
      --dx:${Math.cos(a) * dist}px; --dy:${Math.sin(a) * dist + 60}px; --r:${Math.random() * 540 - 270}deg;
      border-radius:${i % 3 ? '3px' : '50%'}`;
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1300);
}

/* ---------- Обробка натискань ---------- */

const actions = {
  tab: (el) => {
    if (ui.tab === el.dataset.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    ui.tab = el.dataset.tab;
    render(true);
    window.scrollTo(0, 0);
  },
  add: () => openTaskSheet(null, ui.tab === 'calendar' ? ui.calSel : ui.date),
  toggle: toggleTask,
  edit: (el) => { const row = el.closest('.task'); openTaskSheet(row.dataset.id, row.dataset.date); },
  'week-prev': () => { ui.date = addDays(ui.date, -7); render(); },
  'week-next': () => { ui.date = addDays(ui.date, 7); render(); },
  'pick-day': (el) => { ui.date = el.dataset.k; render(); },
  'go-today': () => { ui.date = todayKey(); render(); },
  mood: (el) => {
    const k = ui.date, v = Number(el.dataset.v);
    const day = { ...(state.days[k] || {}) };
    day.mood = day.mood === v ? 0 : v;
    if (!day.mood) delete day.mood;
    if (!day.mood && !day.note) delete state.days[k]; else state.days[k] = day;
    save(); render();
  },
  'cal-prev': () => { ui.calM--; if (ui.calM < 0) { ui.calM = 11; ui.calY--; } render(); },
  'cal-next': () => { ui.calM++; if (ui.calM > 11) { ui.calM = 0; ui.calY++; } render(); },
  'cal-pick': (el) => { ui.calSel = el.dataset.k; render(); },
  'open-day': (el) => { ui.date = el.dataset.k; ui.tab = 'today'; render(true); window.scrollTo(0, 0); },
  'year-prev': () => { ui.year--; render(); },
  'year-next': () => { ui.year++; render(); },
  'year-mode': (el) => { ui.yearMode = el.dataset.v; render(); },
  'year-pick': (el) => { ui.date = el.dataset.k; ui.tab = 'today'; render(true); window.scrollTo(0, 0); },
  theme: (el) => { state.settings.theme = el.dataset.v; save(); applyTheme(); render(); },
  'cat-edit': (el) => openCategorySheet(el.dataset.id),
  'cat-add': () => openCategorySheet(null),
  'cat-save': saveCategory,
  'cat-delete': deleteCategory,
  chip: (el) => {
    const group = el.closest('[data-group]');
    $$('.on', group).forEach((x) => x.classList.remove('on'));
    el.classList.add('on');
    if (group.dataset.group === 'rep') {
      const lbl = $('label[for="f-date"]');
      if (lbl) lbl.textContent = el.dataset.v === 'none' ? 'Дата' : 'Починаючи з';
    }
  },
  'clear-time': () => { $('#f-time').value = ''; },
  'task-save': saveTask,
  'task-delete': deleteTask,
  'as-opt': (el) => { const o = sheetOptions[Number(el.dataset.i)]; closeSheet(); if (o) o.fn(); },
  'sheet-close': closeSheet,
  export: exportData,
  import: () => $('#import-file').click(),
  'clear-all': () => actionSheet('Стерти всі дані?', 'Усі справи, настрої і нотатки зникнуть. Спершу краще зберегти резервну копію.', [{
    label: 'Стерти назавжди', danger: true, fn: () => {
      state = freshState(false); save(); applyTheme(); render(); toast('Дані стерто');
    }
  }]),
  'toast-action': () => {
    const a = toastAction;
    $('#toast').classList.remove('show');
    toastAction = null;
    if (a) a.fn();
  }
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el, e);
});

// Нотатка зберігається сама, поки пишеш
let noteTimer = null;
document.addEventListener('input', (e) => {
  if (e.target.id !== 'note') return;
  const k = ui.date, text = e.target.value;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    const day = { ...(state.days[k] || {}) };
    if (text.trim()) day.note = text; else delete day.note;
    if (!day.mood && !day.note) delete state.days[k]; else state.days[k] = day;
    save();
  }, 350);
});

// Enter у полі назви = зберегти
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#sheet-root').classList.contains('show')) { closeSheet(); return; }
  if (e.key !== 'Enter') return;
  if (e.target.id === 'f-title') { e.preventDefault(); $('[data-act="task-save"]')?.click(); }
  if (e.target.id === 'f-cat') { e.preventDefault(); $('[data-act="cat-save"]')?.click(); }
});

$('#import-file').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) importData(f);
  e.target.value = '';
});

// Свайп вліво/вправо: інший день або місяць
let touch = null;
$('#view').addEventListener('touchstart', (e) => {
  if (e.target.closest('textarea, input, .pixels-wrap')) { touch = null; return; }
  const p = e.touches[0];
  touch = { x: p.clientX, y: p.clientY };
}, { passive: true });

$('#view').addEventListener('touchend', (e) => {
  if (!touch) return;
  const p = e.changedTouches[0];
  const dx = p.clientX - touch.x, dy = p.clientY - touch.y;
  touch = null;
  if (Math.abs(dx) < 70 || Math.abs(dy) > 45) return;
  const step = dx < 0 ? 1 : -1;
  if (ui.tab === 'today') { ui.date = addDays(ui.date, step); render(); }
  else if (ui.tab === 'calendar') { actions[step > 0 ? 'cal-next' : 'cal-prev'](); }
}, { passive: true });

// Нова доба: якщо застосунок був відкритий опівночі
function checkNewDay() {
  const t = todayKey();
  if (t !== ui.today) {
    if (ui.date === ui.today) ui.date = t;
    if (ui.calSel === ui.today) ui.calSel = t;
    ui.today = t;
    render();
  }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNewDay(); });
setInterval(checkNewDay, 60 * 1000);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

/* ---------- Старт ---------- */

applyTheme();
render(true);

// Робота без інтернету
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* не страшно */ });
  });
}

// Просимо айфон берегти дані Комфортіка
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}
