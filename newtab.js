/* ══════════════════════════════════════════════════
   CONFIG  —  edit this block to personalise
══════════════════════════════════════════════════ */
const CONFIG = {

  // Your first name for the greeting
  NAME: 'Aryan',

  // Weather ─────────────────────────────────────────
  // Free key from https://openweathermap.org/api
  WEATHER_API_KEY: '6e3e9ed88022d08b7c0981cf25caabc3',

  // ungoogled-chromium blocks the geolocation network provider,
  // so 'auto' won't work — set a city name e.g. 'Meerut' / 'New Delhi'
  WEATHER_LOCATION: 'Meerut',

  // 'metric' = °C  |  'imperial' = °F
  WEATHER_UNITS: 'metric',

  // Quick links ──────────────────────────────────────
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
/* ══════════════════════════════════════════════════
   End of CONFIG
══════════════════════════════════════════════════ */


/* ── Clock ──────────────────────────────────────── */
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
    `${pad(n.getHours())}<span class="sep">:</span>${pad(n.getMinutes())}<span class="sep">:</span><span class="sec">${pad(n.getSeconds())}</span>`;
  document.getElementById('dateline').textContent =
    `${DAYS[n.getDay()]}, ${MONTHS[n.getMonth()]} ${n.getDate()}`;
}

tick();
setInterval(tick, 1000);


/* ── Quick links ────────────────────────────────── */
const linksGrid = document.getElementById('links-grid');

CONFIG.LINKS.forEach(({ label, url }) => {
  let domain = '';
  try { domain = new URL(url).hostname; } catch {}
  const faviconSrc = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  const a = document.createElement('a');
  a.href = url;
  a.className = 'link-tile';

  const wrap = document.createElement('div');
  wrap.className = 'link-favicon';

  const img = document.createElement('img');
  img.src = faviconSrc;
  img.alt = '';
  img.onerror = () => img.remove();
  wrap.appendChild(img);

  const lbl = document.createElement('span');
  lbl.className = 'link-name';
  lbl.textContent = label;

  a.appendChild(wrap);
  a.appendChild(lbl);
  linksGrid.appendChild(a);
});


/* ── Weather ────────────────────────────────────── */
const W_ICONS = {
  '01d':'☀️','01n':'🌙',
  '02d':'⛅','02n':'⛅',
  '03d':'🌥️','03n':'🌥️',
  '04d':'☁️','04n':'☁️',
  '09d':'🌦️','09n':'🌦️',
  '10d':'🌧️','10n':'🌧️',
  '11d':'⛈️','11n':'⛈️',
  '13d':'❄️','13n':'❄️',
  '50d':'🌫️','50n':'🌫️',
};

const unitSym = CONFIG.WEATHER_UNITS === 'imperial' ? '°F' : '°C';

function renderWeather(d) {
  const icon   = W_ICONS[d.weather[0].icon] || '🌡️';
  const temp   = Math.round(d.main.temp);
  const feels  = Math.round(d.main.feels_like);
  const hum    = d.main.humidity;
  const desc   = d.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());
  const city   = d.name;

  document.getElementById('weather-body').innerHTML = `
    <div class="w-main">
      <div class="w-icon">${icon}</div>
      <div class="w-temp">${temp}<span class="w-unit">${unitSym}</span></div>
    </div>
    <div class="w-desc">${desc}</div>
    <div class="w-city">${city}</div>
    <div class="w-meta">
      <div class="w-meta-item">
        <span class="w-meta-label">Feels like</span>
        <span class="w-meta-val">${feels}${unitSym}</span>
      </div>
      <div class="w-meta-item">
        <span class="w-meta-label">Humidity</span>
        <span class="w-meta-val">${hum}%</span>
      </div>
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
  if (!key || key === 'YOUR_API_KEY_HERE') {
    renderWeatherMsg(
      `To enable weather, add a free API key from
       <a href="https://openweathermap.org/api" target="_blank">openweathermap.org</a>
       to the <code>WEATHER_API_KEY</code> field in the CONFIG block at the top of this file.`
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
    if (err.code === 1 /* PERMISSION_DENIED */) {
      renderWeatherMsg(
        `Location access denied.<br>Set <code>WEATHER_LOCATION: 'Meerut'</code> (or your city) in the CONFIG.`
      );
    } else {
      renderWeatherMsg(`Couldn't load weather. Check your API key and connection.`);
    }
  }
}

loadWeather();
