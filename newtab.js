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

/* ── Default config ──────────────────────────────── */
const CONFIG = {
  NAME: 'Aryan',
  WEATHER_API_KEY: '',
  WEATHER_LOCATION: 'Meerut',
  WEATHER_UNITS: 'metric',
  LINKS: [
    { label: 'GitHub',    url: 'https://github.com' },
    { label: 'Gmail',     url: 'https://mail.google.com' },
    { label: 'YouTube',   url: 'https://youtube.com' },
    { label: 'Reddit',    url: 'https://reddit.com' },
    { label: 'Maps',      url: 'https://maps.google.com' },
    { label: 'Wikipedia', url: 'https://wikipedia.org' },
    { label: 'HN',        url: 'https://news.ycombinator.com' },
    { label: 'Claude',    url: 'https://claude.ai' },
  ],
};

/* ── Clock ───────────────────────────────────────── */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const pad = n => String(n).padStart(2, '0');

function greet() {
  const h = new Date().getHours();
  const name = CONFIG.NAME ? `, ${CONFIG.NAME}` : '';
  if (h < 5)  return `Good night${name}`;
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
    try { domain = new URL(url).hostname; } catch {}

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


/* ── Weather ─────────────────────────────────────── */
function renderWeather(d) {
  const sym  = CONFIG.WEATHER_UNITS === 'imperial' ? '°F' : '°C';
  const temp  = Math.round(d.main.temp);
  const feels = Math.round(d.main.feels_like);
  const hum   = d.main.humidity;
  const desc  = d.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());
  const city  = d.name;

  document.getElementById('weather-body').innerHTML = `
    <div class="w-temp">${temp}<span class="w-unit">${sym}</span></div>
    <div class="w-desc">${desc}</div>
    <div class="stat-rows">
      <div class="stat"><span class="label">Feels like</span><span class="stat-val">${feels}${sym}</span></div>
      <div class="stat"><span class="label">Humidity</span><span class="stat-val">${hum}%</span></div>
      <div class="stat"><span class="label">Location</span><span class="stat-val">${city}</span></div>
    </div>
  `;
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
  const qs   = `&appid=${key}&units=${CONFIG.WEATHER_UNITS}`;

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


/* ── Settings ────────────────────────────────────── */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let _settingsLinks = [];

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

function openSettings() {
  document.getElementById('s-name').value           = CONFIG.NAME;
  document.getElementById('s-weather-key').value    = CONFIG.WEATHER_API_KEY;
  document.getElementById('s-weather-loc').value    = CONFIG.WEATHER_LOCATION;
  document.getElementById('s-weather-units').value  = CONFIG.WEATHER_UNITS;
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
      _settingsLinks[i].url   = row.querySelector('.s-link-url').value;
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
    name:            document.getElementById('s-name').value.trim(),
    weatherApiKey:   document.getElementById('s-weather-key').value.trim(),
    weatherLocation: document.getElementById('s-weather-loc').value.trim(),
    weatherUnits:    document.getElementById('s-weather-units').value,
    links:           _settingsLinks.filter(l => l.label.trim() || l.url.trim()),
  });

  location.reload();
}


/* ── Init ────────────────────────────────────────── */
async function init() {
  const saved = await storage.load();
  if (saved.name            !== undefined) CONFIG.NAME             = saved.name;
  if (saved.weatherApiKey   !== undefined) CONFIG.WEATHER_API_KEY  = saved.weatherApiKey;
  if (saved.weatherLocation !== undefined) CONFIG.WEATHER_LOCATION = saved.weatherLocation;
  if (saved.weatherUnits    !== undefined) CONFIG.WEATHER_UNITS    = saved.weatherUnits;
  if (saved.links           !== undefined) CONFIG.LINKS            = saved.links;

  tick();
  setInterval(tick, 1000);
  renderLinks();
  loadWeather();
  initSettings();
}

init();
