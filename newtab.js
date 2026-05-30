/* ── Storage ─────────────────────────────────────── */
const storage = {
  load() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
        chrome.storage.sync.get('cfg', d => resolve(d.cfg || {}));
      } else {
        try { resolve(JSON.parse(localStorage.getItem('cfg') || '{}')); }
        catch { resolve({}); }
      }
    });
  },
  save(data) {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
        chrome.storage.sync.set({ cfg: data }, resolve);
      } else {
        localStorage.setItem('cfg', JSON.stringify(data));
        resolve();
      }
    });
  }
};

/* ── Accent presets ──────────────────────────────── */
const ACCENT_PRESETS = [
  { label: 'Red', value: '#D71921' },
  { label: 'Orange', value: '#EA580C' },
  { label: 'Amber', value: '#D97706' },
  { label: 'Green', value: '#16A34A' },
  { label: 'Teal', value: '#0D9488' },
  { label: 'Cyan', value: '#0891B2' },
  { label: 'Blue', value: '#2563EB' },
  { label: 'Purple', value: '#9333EA' },
  { label: 'Pink', value: '#DB2777' },
];

/* ── Default config ──────────────────────────────── */
const CONFIG = {
  NAME: 'Aryan',
  FONT: '',
  ACCENT_COLOR: '',
  WEATHER_API_KEY: '',
  WEATHER_LOCATION: 'Meerut',
  WEATHER_UNITS: 'metric',
  THEME: 'system',
  SEARCH_ENGINE: 'google',
  LINKS: [
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'Gmail', url: 'https://mail.google.com' },
    { label: 'YouTube', url: 'https://youtube.com' },
    { label: 'Reddit', url: 'https://reddit.com' },
    { label: 'Maps', url: 'https://maps.google.com' },
    { label: 'Wikipedia', url: 'https://wikipedia.org' },
    { label: 'HN', url: 'https://news.ycombinator.com' },
    { label: 'Claude', url: 'https://claude.ai' },
  ],
};

/* ── Search engines ──────────────────────────────── */
const SEARCH_ENGINES = [
  { key: 'google', label: 'GOOGLE', url: 'https://www.google.com/search?q=', domain: 'google.com' },
  { key: 'ddg', label: 'DDG', url: 'https://duckduckgo.com/?q=', domain: 'duckduckgo.com' },
  { key: 'kagi', label: 'KAGI', url: 'https://kagi.com/search?q=', domain: 'kagi.com' },
  { key: 'brave', label: 'BRAVE', url: 'https://search.brave.com/search?q=', domain: 'search.brave.com' },
  { key: 'bing', label: 'BING', url: 'https://www.bing.com/search?q=', domain: 'bing.com' },
];

/* ── Search suggestions ──────────────────────────── */
const SUGGESTION_APIS = {
  google: q => `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
  ddg: q => `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
};

let _suggTimer = null;
let _suggFocusIdx = -1;
let _suggItems = [];

async function fetchSuggestions(query) {
  const key = getCurrentEngine().key;
  const api = SUGGESTION_APIS[key];
  if (!api || !query.trim()) { hideSuggestions(); return; }
  try {
    const res = await fetch(api(query));
    const data = await res.json();
    _suggItems = (data[1] || []).slice(0, 8);
    renderSuggestions(_suggItems);
  } catch {
    hideSuggestions();
  }
}

function renderSuggestions(items) {
  const list = document.getElementById('search-suggestions');
  if (!items.length) { hideSuggestions(); return; }
  list.innerHTML = items.map((s, i) =>
    `<li class="search-suggestion-item" role="option" data-idx="${i}">${esc(s)}</li>`
  ).join('');
  list.classList.add('open');
  _suggFocusIdx = -1;
  list.querySelectorAll('.search-suggestion-item').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      document.getElementById('search-input').value = _suggItems[+el.dataset.idx];
      hideSuggestions();
      performSearch();
    });
  });
}

function hideSuggestions() {
  const list = document.getElementById('search-suggestions');
  list.classList.remove('open');
  list.innerHTML = '';
  _suggItems = [];
  _suggFocusIdx = -1;
}

function navigateSuggestions(dir) {
  const items = document.querySelectorAll('.search-suggestion-item');
  if (!items.length) return false;
  items[_suggFocusIdx]?.classList.remove('focused');
  _suggFocusIdx = Math.max(-1, Math.min(items.length - 1, _suggFocusIdx + dir));
  if (_suggFocusIdx >= 0) {
    items[_suggFocusIdx].classList.add('focused');
    document.getElementById('search-input').value = _suggItems[_suggFocusIdx];
  }
  return true;
}

/* ── Clock ───────────────────────────────────────── */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const pad = n => String(n).padStart(2, '0');

function greet() {
  const h = new Date().getHours();
  const name = CONFIG.NAME ? `, ${CONFIG.NAME}` : '';
  if (h < 5) return `Good night${name}`;
  if (h < 12) return `Good morning${name}`;
  if (h < 17) return `Good afternoon${name}`;
  if (h < 21) return `Good evening${name}`;
  return `Good night${name}`;
}

function tick() {
  const n = new Date();
  document.getElementById('greeting').textContent = greet();
  document.getElementById('time-display').innerHTML =
    `${pad(n.getHours())}<span class="sep">:</span>${pad(n.getMinutes())}<span class="sec">${pad(n.getSeconds())}</span>`;
  document.getElementById('dateline').textContent =
    `${DAYS[n.getDay()]} · ${MONTHS[n.getMonth()]} ${n.getDate()}`;
}


/* ── Quick links ─────────────────────────────────── */
function renderLinks() {
  const linksGrid = document.getElementById('links-grid');
  linksGrid.innerHTML = '';
  CONFIG.LINKS.forEach(({ label, url }, i) => {
    let domain = '';
    try { domain = new URL(url).hostname; } catch { }

    const a = document.createElement('a');
    a.href = url;
    a.className = 'link';

    const idx = document.createElement('span');
    idx.className = 'link-idx';
    idx.textContent = pad(i + 1);

    const img = document.createElement('img');
    img.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    img.className = 'link-favicon';
    img.alt = '';
    img.onerror = () => img.style.display = 'none';

    const lbl = document.createElement('span');
    lbl.className = 'link-name';
    lbl.textContent = label;

    const arrow = document.createElement('span');
    arrow.className = 'link-arrow';
    arrow.textContent = '→';

    a.append(idx, img, lbl, arrow);
    linksGrid.appendChild(a);
  });
}


/* ── Weather icon ────────────────────────────────── */
function weatherIconName(id) {
  if (id === 800) return 'clear';
  if (id === 801) return 'partly-cloudy';
  if (id >= 802 && id <= 804) return 'cloudy';
  if (id >= 200 && id <= 232) return 'thunderstorm';
  if (id >= 300 && id <= 321) return 'drizzle';
  if (id >= 500 && id <= 531) return 'rain';
  if (id >= 600 && id <= 622) return 'snow';
  if (id >= 700 && id <= 781) return 'fog';
  return 'cloudy';
}

const _iconCache = {};

async function fetchIcon(name) {
  if (_iconCache[name] !== undefined) return _iconCache[name];
  try {
    const res = await fetch(`icons/${name}.svg`);
    if (!res.ok) throw new Error();
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (svg) {
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.classList.add('w-icon-svg');
      _iconCache[name] = svg.outerHTML;
      return svg.outerHTML;
    }
  } catch { }
  _iconCache[name] = '';
  return '';
}

/* ── Weather ─────────────────────────────────────── */
function renderWeather(d) {
  const sym = CONFIG.WEATHER_UNITS === 'imperial' ? '°F' : '°C';
  const temp = Math.round(d.main.temp);
  const feels = Math.round(d.main.feels_like);
  const hum = d.main.humidity;
  const desc = d.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());
  const city = d.name;

  document.getElementById('weather-body').innerHTML = `
    <div class="w-temp-row">
      <div class="w-temp">${temp}<span class="w-unit">${sym}</span></div>
      <div id="w-icon-container"></div>
    </div>
    <div class="w-desc">${desc}</div>
    <div class="stat-rows">
      <div class="stat"><span class="label">Feels like</span><span class="stat-val">${feels}${sym}</span></div>
      <div class="stat"><span class="label">Humidity</span><span class="stat-val">${hum}%</span></div>
      <div class="stat"><span class="label">Location</span><span class="stat-val">${city}</span></div>
    </div>
  `;

  fetchIcon(weatherIconName(d.weather[0].id)).then(svg => {
    const container = document.getElementById('w-icon-container');
    if (container) container.innerHTML = svg;
  });
}

function renderWeatherMsg(html) {
  document.getElementById('weather-body').innerHTML =
    `<div class="w-placeholder">${html}</div>`;
}

async function fetchWeather(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

async function loadWeather() {
  const key = CONFIG.WEATHER_API_KEY;
  if (!key) {
    renderWeatherMsg(
      `Add a free API key from <a href="https://openweathermap.org/api" target="_blank">openweathermap.org</a>
       via <code style="cursor:pointer;text-decoration:underline" onclick="openSettings()">Settings</code>.`
    );
    return;
  }

  const base = `https://api.openweathermap.org/data/2.5/weather`;
  const qs = `&appid=${key}&units=${CONFIG.WEATHER_UNITS}`;

  try {
    let data;
    if (CONFIG.WEATHER_LOCATION === 'auto') {
      const pos = await new Promise((ok, fail) =>
        navigator.geolocation.getCurrentPosition(ok, fail, { timeout: 7000 })
      );
      data = await fetchWeather(`${base}?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}${qs}`);
    } else {
      data = await fetchWeather(`${base}?q=${encodeURIComponent(CONFIG.WEATHER_LOCATION)}${qs}`);
    }
    renderWeather(data);
  } catch (err) {
    if (err.code === 1) {
      renderWeatherMsg(`Location access denied. Set a city in <code style="cursor:pointer;text-decoration:underline" onclick="openSettings()">Settings</code>.`);
    } else {
      renderWeatherMsg(`Couldn't load weather. Check API key and connection.`);
    }
  }
}


/* ── Accent color ────────────────────────────────── */
function applyAccent(color) {
  if (color && /^#[0-9a-fA-F]{3,6}$/.test(color)) {
    document.documentElement.style.setProperty('--accent', color);
  } else {
    document.documentElement.style.removeProperty('--accent');
  }
}

/* ── Font ────────────────────────────────────────── */
function applyFont(font) {
  const root = document.documentElement;
  if (font && font.trim()) {
    const f = font.trim();
    root.style.setProperty('--font-sans', `'${f}', 'Space Grotesk', system-ui, sans-serif`);
    root.style.setProperty('--font-mono', `'${f}', 'Space Mono', monospace`);
    root.style.setProperty('--font-display', `'${f}', 'Doto', 'Space Mono', monospace`);
  } else {
    root.style.removeProperty('--font-sans');
    root.style.removeProperty('--font-mono');
    root.style.removeProperty('--font-display');
  }
}

/* ── Theme ───────────────────────────────────────── */
const THEME_ICONS = {
  system: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>`,
  light: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
    <line x1="19.07" y1="4.93" x2="17.66" y2="6.34"/><line x1="6.34" y1="17.66" x2="4.93" y2="19.07"/>
  </svg>`,
  dark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`,
};

const THEME_CYCLE = ['system', 'light', 'dark'];

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const btn = document.getElementById('theme-btn');
  if (btn) {
    btn.innerHTML = THEME_ICONS[theme] || THEME_ICONS.system;
    btn.setAttribute('aria-label', `Theme: ${theme}`);
  }
}

function initTheme() {
  applyTheme(CONFIG.THEME);
  document.getElementById('theme-btn').addEventListener('click', async () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(CONFIG.THEME) + 1) % THEME_CYCLE.length];
    CONFIG.THEME = next;
    applyTheme(next);
    const saved = await storage.load();
    await storage.save({ ...saved, theme: next });
  });
}

/* ── Search ──────────────────────────────────────── */
function getCurrentEngine() {
  return SEARCH_ENGINES.find(e => e.key === CONFIG.SEARCH_ENGINE) || SEARCH_ENGINES[0];
}

function faviconUrl(domain) {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

function renderSearchEngine() {
  const engine = getCurrentEngine();
  const favicon = document.getElementById('search-engine-favicon');
  const label = document.getElementById('search-engine-label');
  if (favicon) {
    favicon.src = faviconUrl(engine.domain);
    favicon.style.display = '';
    favicon.onerror = () => { favicon.style.display = 'none'; };
  }
  if (label) label.textContent = engine.label;
}

function renderEngineDropdown() {
  const dropdown = document.getElementById('search-engine-dropdown');
  if (!dropdown) return;
  dropdown.innerHTML = '';
  SEARCH_ENGINES.forEach(engine => {
    const btn = document.createElement('button');
    btn.className = 'search-engine-option' + (engine.key === CONFIG.SEARCH_ENGINE ? ' active' : '');
    const img = document.createElement('img');
    img.src = faviconUrl(engine.domain);
    img.alt = '';
    img.onerror = () => { img.style.display = 'none'; };
    const span = document.createElement('span');
    span.textContent = engine.label;
    btn.append(img, span);
    btn.addEventListener('click', () => selectEngine(engine.key));
    dropdown.appendChild(btn);
  });
}

function toggleEngineDropdown() {
  const dropdown = document.getElementById('search-engine-dropdown');
  if (dropdown.classList.contains('open')) {
    closeEngineDropdown();
  } else {
    renderEngineDropdown();
    dropdown.classList.add('open');
    document.getElementById('search-engine-tag').classList.add('open');
    document.getElementById('search-engine-tag').setAttribute('aria-expanded', 'true');
  }
}

function closeEngineDropdown() {
  document.getElementById('search-engine-dropdown').classList.remove('open');
  document.getElementById('search-engine-tag').classList.remove('open');
  document.getElementById('search-engine-tag').setAttribute('aria-expanded', 'false');
}

async function selectEngine(key) {
  CONFIG.SEARCH_ENGINE = key;
  closeEngineDropdown();
  hideSuggestions();
  renderSearchEngine();
  const saved = await storage.load();
  await storage.save({ ...saved, searchEngine: key });
}

function performSearch() {
  const input = document.getElementById('search-input');
  const query = input.value.trim();
  if (!query) return;
  window.location.href = getCurrentEngine().url + encodeURIComponent(query);
}

function initSearch() {
  document.getElementById('search-engine-tag').addEventListener('click', toggleEngineDropdown);
  document.getElementById('search-submit').addEventListener('click', () => { hideSuggestions(); performSearch(); });

  const input = document.getElementById('search-input');

  input.addEventListener('input', e => {
    clearTimeout(_suggTimer);
    const q = e.target.value.trim();
    if (!q) { hideSuggestions(); return; }
    _suggTimer = setTimeout(() => fetchSuggestions(q), 200);
  });

  input.addEventListener('blur', () => setTimeout(hideSuggestions, 150));

  input.addEventListener('keydown', e => {
    const suggOpen = document.getElementById('search-suggestions').classList.contains('open');
    if (e.key === 'ArrowDown' && suggOpen) { e.preventDefault(); navigateSuggestions(1); return; }
    if (e.key === 'ArrowUp' && suggOpen) { e.preventDefault(); navigateSuggestions(-1); return; }
    if (e.key === 'Enter') { hideSuggestions(); performSearch(); return; }
    if (e.key === 'Escape') {
      if (suggOpen) { hideSuggestions(); return; }
      const dropdown = document.getElementById('search-engine-dropdown');
      if (dropdown.classList.contains('open')) closeEngineDropdown();
      else e.target.blur();
    }
  });

  document.addEventListener('click', e => {
    const selector = document.getElementById('search-engine-selector');
    if (selector && !selector.contains(e.target)) closeEngineDropdown();
  });
  renderSearchEngine();
}

/* ── Settings ────────────────────────────────────── */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let _settingsLinks = [];

/* ── Keyboard shortcuts ──────────────────────────── */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (document.getElementById('settings-overlay').classList.contains('open')) return;
    if (document.activeElement === document.getElementById('search-input')) return;
    const n = parseInt(e.key);
    if (n >= 1 && n <= 9 && CONFIG.LINKS[n - 1]) {
      window.location.href = CONFIG.LINKS[n - 1].url;
    }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      document.getElementById('search-input').focus();
    }
  });
}

function initSettings() {
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSettings();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('settings-overlay').classList.contains('open'))
      closeSettings();
  });
  document.getElementById('settings-save').addEventListener('click', saveSettings);
  document.getElementById('s-add-link').addEventListener('click', addSettingsLink);
}

function renderAccentPresets(current) {
  const container = document.getElementById('s-accent-presets');
  if (!container) return;
  container.innerHTML = '';
  ACCENT_PRESETS.forEach(({ label, value }) => {
    const swatch = document.createElement('button');
    const isActive = current && value.toLowerCase() === current.toLowerCase();
    swatch.className = 's-accent-swatch' + (isActive ? ' active' : '');
    swatch.style.background = value;
    swatch.title = label;
    swatch.setAttribute('aria-label', label);
    swatch.type = 'button';
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.s-accent-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      document.getElementById('s-accent-custom').value = value;
    });
    container.appendChild(swatch);
  });

  document.getElementById('s-accent-custom').addEventListener('input', e => {
    const val = e.target.value.trim().toLowerCase();
    container.querySelectorAll('.s-accent-swatch').forEach(s => {
      const preset = ACCENT_PRESETS.find(p => p.label === s.title);
      s.classList.toggle('active', !!preset && preset.value.toLowerCase() === val);
    });
  });
}

function openSettings() {
  document.getElementById('s-name').value = CONFIG.NAME;
  document.getElementById('s-font').value = CONFIG.FONT;
  renderAccentPresets(CONFIG.ACCENT_COLOR);
  document.getElementById('s-accent-custom').value = CONFIG.ACCENT_COLOR;
  document.getElementById('s-weather-key').value = CONFIG.WEATHER_API_KEY;
  document.getElementById('s-weather-loc').value = CONFIG.WEATHER_LOCATION;
  document.getElementById('s-weather-units').value = CONFIG.WEATHER_UNITS;
  document.getElementById('s-search-engine').value = CONFIG.SEARCH_ENGINE;
  _settingsLinks = CONFIG.LINKS.map(l => ({ ...l }));
  renderSettingsLinks();
  document.getElementById('settings-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSettings() {
  document.getElementById('settings-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderSettingsLinks() {
  const container = document.getElementById('s-links-list');
  container.innerHTML = '';
  _settingsLinks.forEach((link, i) => {
    const row = document.createElement('div');
    row.className = 's-link-row';
    row.innerHTML = `
      <span class="label s-idx">${pad(i + 1)}</span>
      <input type="text" class="settings-input s-link-label" value="${esc(link.label)}" placeholder="Label" spellcheck="false">
      <input type="text" class="settings-input s-link-url" value="${esc(link.url)}" placeholder="https://…" spellcheck="false">
      <div class="s-link-btns">
        <button class="s-btn" data-action="up" data-i="${i}"${i === 0 ? ' disabled' : ''}>↑</button>
        <button class="s-btn" data-action="down" data-i="${i}"${i === _settingsLinks.length - 1 ? ' disabled' : ''}>↓</button>
        <button class="s-btn s-btn-del" data-action="del" data-i="${i}">✕</button>
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      syncSettingsLinks();
      const i = +btn.dataset.i;
      const action = btn.dataset.action;
      if (action === 'up' && i > 0)
        [_settingsLinks[i - 1], _settingsLinks[i]] = [_settingsLinks[i], _settingsLinks[i - 1]];
      else if (action === 'down' && i < _settingsLinks.length - 1)
        [_settingsLinks[i], _settingsLinks[i + 1]] = [_settingsLinks[i + 1], _settingsLinks[i]];
      else if (action === 'del')
        _settingsLinks.splice(i, 1);
      renderSettingsLinks();
    });
  });
}

function syncSettingsLinks() {
  document.querySelectorAll('#s-links-list .s-link-row').forEach((row, i) => {
    if (_settingsLinks[i]) {
      _settingsLinks[i].label = row.querySelector('.s-link-label').value;
      _settingsLinks[i].url = row.querySelector('.s-link-url').value;
    }
  });
}

function addSettingsLink() {
  syncSettingsLinks();
  _settingsLinks.push({ label: '', url: '' });
  renderSettingsLinks();
  const rows = document.querySelectorAll('#s-links-list .s-link-row');
  if (rows.length) rows[rows.length - 1].querySelector('.s-link-label').focus();
}

async function saveSettings() {
  syncSettingsLinks();
  const btn = document.getElementById('settings-save');
  btn.textContent = 'SAVING…';
  btn.disabled = true;

  await storage.save({
    name: document.getElementById('s-name').value.trim(),
    font: document.getElementById('s-font').value.trim(),
    accentColor: document.getElementById('s-accent-custom').value.trim(),
    weatherApiKey: document.getElementById('s-weather-key').value.trim(),
    weatherLocation: document.getElementById('s-weather-loc').value.trim(),
    weatherUnits: document.getElementById('s-weather-units').value,
    searchEngine: document.getElementById('s-search-engine').value,
    links: _settingsLinks.filter(l => l.label.trim() || l.url.trim()),
  });

  location.reload();
}


/* ── Fidget grid ─────────────────────────────────── */
function initFidget() {
  const grid = document.getElementById('fidget');
  const clock = document.querySelector('.clock');
  if (!grid || !clock) return;

  const CELL = 18;       // target px per cell (incl. 1px grid line)
  const HUE_STEP = 23;   // deg of hue rotation per new cell → rainbow trail

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let cols = 0, rows = 0, cells = [];
  let raf = 0, pending = null;
  let hue = Math.random() * 360, lastIdx = -1;
  let life = null, lifeTimer = 0, lifePaused = false;

  function pauseLife() {                       // hover → freeze sim, pure hue mode
    if (lifePaused) return;
    lifePaused = true;
    clearTimeout(lifeTimer);
    for (const c of cells) c.classList.remove('gol');
  }

  function resumeLife() {                       // leave → sim breathes again
    lifePaused = false;
    if (reduceMotion || !cells.length) return;
    clearTimeout(lifeTimer);
    lifeRender();
    lifeTimer = setTimeout(lifeLoop, LIFE_MS);
  }

  // pop instantly with hue h, then fade back over the CSS transition → trail
  function litPop(cell, h) {
    cell.style.setProperty('--h', h.toFixed(0));
    cell.classList.remove('fading');
    cell.classList.add('lit');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        cell.classList.add('fading');
        cell.classList.remove('lit');
        setTimeout(() => cell.classList.remove('fading'), 650);
      }));
  }

  function build() {
    const h = clock.offsetHeight;
    const w = grid.clientWidth;
    if (w < 8 || h < 8) return;
    clearTimeout(lifeTimer);
    grid.style.height = h + 'px';
    cols = Math.max(1, Math.floor((w + 1) / CELL));
    rows = Math.max(1, Math.floor((h + 1) / CELL));
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < cols * rows; i++) {
      const c = document.createElement('div');
      c.className = 'fidget-cell';
      frag.appendChild(c);
    }
    grid.innerHTML = '';
    grid.appendChild(frag);
    cells = Array.from(grid.children);
    lastIdx = -1;
    seedLife(0.18);
    if (!reduceMotion) { lifeRender(); lifeTimer = setTimeout(lifeLoop, LIFE_MS); }
  }

  function cellAt(clientX, clientY) {
    const rect = grid.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / (rect.width / cols));
    const y = Math.floor((clientY - rect.top) / (rect.height / rows));
    return { x, y };
  }

  function flush() {
    raf = 0;
    if (!pending) return;
    const { x, y } = pending;
    pending = null;
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    const idx = y * cols + x;
    if (idx === lastIdx) return;          // same cell → don't re-trigger
    lastIdx = idx;
    hue = (hue + HUE_STEP) % 360;          // shift hue each new cell → rainbow
    litPop(cells[idx], hue);
    if (life) life[idx] = 1;               // hover plants live cells into the sim
  }

  grid.addEventListener('mouseenter', pauseLife);

  grid.addEventListener('mousemove', e => {
    pauseLife();
    pending = cellAt(e.clientX, e.clientY);
    if (!raf) raf = requestAnimationFrame(flush);
  });

  grid.addEventListener('mouseleave', () => { lastIdx = -1; resumeLife(); });

  // Click — colorful ripple expanding outward across the whole grid
  grid.addEventListener('mousedown', e => {
    const { x: cx, y: cy } = cellAt(e.clientX, e.clientY);
    const base = Math.random() * 360;
    const rings = new Map();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const d = Math.round(Math.hypot(x - cx, y - cy));
        if (!rings.has(d)) rings.set(d, []);
        rings.get(d).push(y * cols + x);
      }
    }
    rings.forEach((idxs, d) => {
      setTimeout(() => {
        const h = (base + d * 12) % 360;   // each ring its own hue
        idxs.forEach(i => litPop(cells[i], h));
      }, d * 28);
    });
    // seed a burst of life at the click point → it grows + drifts via the sim
    if (life) {
      const R = 3;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const x = cx + dx, y = cy + dy;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          if (Math.hypot(dx, dy) <= R && Math.random() < 0.6) life[y * cols + x] = 1;
        }
      }
    }
  });

  /* ── Conway's Game of Life — ambient living texture ── */
  const LIFE_MS = 800;   // generation interval

  function seedLife(density) {
    life = new Uint8Array(cols * rows);
    for (let i = 0; i < life.length; i++) life[i] = Math.random() < density ? 1 : 0;
  }

  function lifeStep() {
    const next = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = (x + dx + cols) % cols;   // toroidal wrap
            const ny = (y + dy + rows) % rows;
            n += life[ny * cols + nx];
          }
        }
        const i = y * cols + x;
        next[i] = life[i] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      }
    }
    life = next;
  }

  function lifeRender() {
    for (let i = 0; i < cells.length; i++) cells[i].classList.toggle('gol', life[i] === 1);
  }

  function lifeLoop() {
    lifeStep();
    lifeRender();
    lifeTimer = setTimeout(lifeLoop, LIFE_MS);
  }

  build();
  document.fonts?.ready.then(build);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(lifeTimer);
      lifeTimer = 0;
    } else if (!lifePaused && !reduceMotion && cells.length) {
      lifeRender();
      lifeTimer = setTimeout(lifeLoop, LIFE_MS);
    }
  });
}

/* ── Init ────────────────────────────────────────── */
async function init() {
  const saved = await storage.load();
  if (saved.name !== undefined) CONFIG.NAME = saved.name;
  if (saved.font !== undefined) CONFIG.FONT = saved.font;
  if (saved.accentColor !== undefined) CONFIG.ACCENT_COLOR = saved.accentColor;
  if (saved.weatherApiKey !== undefined) CONFIG.WEATHER_API_KEY = saved.weatherApiKey;
  if (saved.weatherLocation !== undefined) CONFIG.WEATHER_LOCATION = saved.weatherLocation;
  if (saved.weatherUnits !== undefined) CONFIG.WEATHER_UNITS = saved.weatherUnits;
  if (saved.searchEngine !== undefined) CONFIG.SEARCH_ENGINE = saved.searchEngine;
  if (saved.links !== undefined) CONFIG.LINKS = saved.links;
  if (saved.theme !== undefined) CONFIG.THEME = saved.theme;

  applyFont(CONFIG.FONT);
  applyAccent(CONFIG.ACCENT_COLOR);
  tick();
  let clockInterval = setInterval(tick, 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(clockInterval);
    } else {
      tick();
      clockInterval = setInterval(tick, 1000);
    }
  });
  renderLinks();
  loadWeather();
  initTheme();
  initSettings();
  initSearch();
  initKeyboardShortcuts();
  initFidget();
}

init();
