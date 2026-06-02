# Lifetab

A minimal, highly customizable new tab page for Chrome. Live clock, weather, multi-engine search with suggestions, quick links, and an interactive pixel grid — all in vanilla HTML/CSS/JS with no dependencies.

## Screenshot
<img width="2880" height="1663" alt="Screenshot From 2026-06-01 13-00-55" src="https://github.com/user-attachments/assets/d9fa4774-2966-4165-adca-d6be15da1db9" />


## Features

### Clock & Greeting
- Live clock updating every second (HH:MM:SS)
- Time-aware greeting: Good morning / afternoon / evening / night
- Personalized with your name (optional)
- Full date display (day, month, date)

### Weather
- Powered by [OpenWeatherMap](https://openweathermap.org/api) (free tier works)
- Shows temperature, feels-like, humidity, weather description, and icon
- Auto-detect location via geolocation, or specify any city by name
- Metric (°C) or Imperial (°F) units
- Toggle location label visibility

### Search
- Engines: Google, DuckDuckGo, Kagi, Brave, Bing
- Live autocomplete suggestions (debounced 200ms)
- Click the engine badge to switch engines inline — persists across tabs
- Keyboard navigation through suggestions (↑ / ↓ / Enter / Escape)
- Press `/` anywhere on the page to jump to the search bar

### Quick Links
- Up to 9 links with custom labels and URLs
- Favicons auto-fetched via DuckDuckGo
- Press `1`–`9` to navigate directly from keyboard
- Reorder or delete links in settings

### Pixel Fidget Grid
- Interactive grid next to the clock running Conway's Game of Life
- Hover to paint cells with a shifting rainbow hue trail
- Click to trigger an expanding colorful ripple + seed a burst of live cells into the simulation
- Respects `prefers-reduced-motion`
- Pauses when the tab is not visible

### Appearance
- Light / Dark / System theme with one-click cycling
- 9 accent color presets + custom hex input
- Custom font: any locally installed font by name
- Background image: URL or local file upload, with brightness and blur controls
- Pixel grid show/hide toggle

---

## Installation

Clone or download this repository, then use `make` to build and install.

### Chrome / Edge

```bash
make install-chrome
```

This builds `lifetab-1.0.0-chrome.zip` and opens `chrome://extensions`. Then:

1. Enable **Developer mode** (top right toggle)
2. Click **Load unpacked** and select this folder  
   *(or drag-drop the zip onto the page)*
3. Open a new tab

### Firefox

**Run temporarily (dev mode):**
```bash
make run-firefox   # requires: npm install -g web-ext
```

**Build `.zip` for permanent install:**
```bash
make pack-firefox
```

Then in Firefox: `about:addons` → gear icon → **Install Add-on From File** → select the built zip.

> Firefox temp-load (without signing): `about:debugging` → **This Firefox** → **Load Temporary Add-on** → select any file in this folder.

### All targets

| Command | Description |
|---|---|
| `make pack-chrome` | Build `lifetab-*-chrome.zip` |
| `make pack-firefox` | Build `lifetab-*-firefox.zip` (swaps in Firefox manifest) |
| `make install-chrome` | Pack + open Chrome extensions page |
| `make run-firefox` | Launch Firefox with extension via `web-ext` |
| `make clean` | Remove built zips |

---

## Configuration

Click the settings icon (bottom-left) or open the panel via the gear button.

| Section     | Options                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| General     | Name, custom font                                                          |
| Appearance  | Accent color, pixel grid, background image (URL or file), brightness, blur |
| Weather     | API key, location (city name or `auto`), units, show/hide location label   |
| Search      | Default search engine                                                      |
| Quick Links | Add, edit, reorder, delete links                                           |

Settings sync across devices via `chrome.storage.sync`. Background images are stored locally via `chrome.storage.local`.

### Weather Setup

1. Sign up at [openweathermap.org](https://openweathermap.org/api) (free)
2. Copy your API key
3. Open Settings → Weather → paste the key
4. Set location to a city name (e.g. `London`) or `auto` for geolocation

---

## Keyboard Shortcuts

| Key       | Action                                  |
| --------- | --------------------------------------- |
| `/`       | Focus search bar                        |
| `1` – `9` | Open quick link by index                |
| `↑` / `↓` | Navigate search suggestions             |
| `Enter`   | Submit search                           |
| `Escape`  | Close suggestions / dropdown / settings |

---

## Permissions

| Permission                  | Reason                                            |
| --------------------------- | ------------------------------------------------- |
| `storage`                   | Save settings and background image                |
| `api.openweathermap.org`    | Fetch weather data                                |
| `icons.duckduckgo.com`      | Fetch favicons for quick links and search engines |
| `suggestqueries.google.com` | Google search suggestions                         |
| `duckduckgo.com`            | DuckDuckGo search suggestions                     |

---

## Tech

- Manifest V3
- Vanilla HTML / CSS / JavaScript — zero dependencies, zero build step
- `chrome.storage.sync` for config, `chrome.storage.local` for images
- Fonts: [Inter](https://fonts.google.com/specimen/Inter) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts

---

## License

MIT
