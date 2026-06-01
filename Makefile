EXTENSION_NAME := lifetab
VERSION        := 1.0.0

CHROME_ZIP  := $(EXTENSION_NAME)-$(VERSION)-chrome.zip
FIREFOX_XPI := $(EXTENSION_NAME)-$(VERSION)-firefox.zip

SRC := new-tab.html newtab.js newtab.css favicon.svg icons fonts

# Detect Chrome binary (chrome:// can't be opened by xdg-open)
UNAME := $(shell uname 2>/dev/null || echo Windows)
ifeq ($(UNAME), Darwin)
  OPEN_CHROME := open -a "Google Chrome"
else ifeq ($(UNAME), Windows_NT)
  OPEN_CHROME := start chrome
else
  OPEN_CHROME := $(shell command -v google-chrome 2>/dev/null || command -v google-chrome-stable 2>/dev/null || command -v chromium 2>/dev/null || command -v chromium-browser 2>/dev/null || echo "")
endif

.PHONY: all help pack-chrome pack-firefox install-chrome run-firefox clean

all: help

help:
	@echo "Lifetab — browser extension build targets"
	@echo ""
	@echo "  make pack-chrome      Build $(CHROME_ZIP) for Chrome / Edge"
	@echo "  make pack-firefox     Build $(FIREFOX_XPI) for Firefox"
	@echo "  make install-chrome   Pack + open chrome://extensions (load unpacked)"
	@echo "  make run-firefox      Run in Firefox via web-ext (requires: npm i -g web-ext)"
	@echo "  make clean            Remove built zips"

# ── Chrome ────────────────────────────────────────────────────────────────────

pack-chrome: $(CHROME_ZIP)

$(CHROME_ZIP): manifest.json $(SRC)
	@echo "Packing Chrome extension..."
	zip -r $@ manifest.json $(SRC)
	@echo "Done → $@"

install-chrome: pack-chrome
	@echo ""
	@echo "Load unpacked steps:"
	@echo "  1. Enable Developer mode (top-right toggle)"
	@echo "  2. Click 'Load unpacked' → select THIS folder"
	@echo "  Or drag-drop $(CHROME_ZIP) onto the page."
	@echo ""
	@if [ -n "$(OPEN_CHROME)" ]; then \
		echo "Opening chrome://extensions..."; \
		$(OPEN_CHROME) "chrome://extensions" 2>/dev/null & \
	else \
		echo "Chrome not found. Open chrome://extensions manually."; \
	fi

# ── Firefox ───────────────────────────────────────────────────────────────────

pack-firefox: $(FIREFOX_XPI)

$(FIREFOX_XPI): manifest.firefox.json $(SRC)
	@echo "Packing Firefox extension..."
	@cp manifest.json manifest.json.bak
	@cp manifest.firefox.json manifest.json
	zip -r $@ manifest.json $(SRC)
	@mv manifest.json.bak manifest.json
	@echo "Done → $@"
	@echo ""
	@echo "Install in Firefox:"
	@echo "  1. Go to about:addons"
	@echo "  2. Click the gear icon → 'Install Add-on From File...'"
	@echo "  3. Select $(FIREFOX_XPI)"
	@echo ""
	@echo "  Or for temporary load (dev): about:debugging → 'Load Temporary Add-on'"
	@echo "  and select any file in this folder."

run-firefox:
	@command -v web-ext >/dev/null 2>&1 || { \
		echo "web-ext not found. Install it with:"; \
		echo "  npm install -g web-ext"; \
		exit 1; \
	}
	web-ext run \
		--source-dir=. \
		--overwrite-dest \
		--start-url="about:newtab"

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	rm -f $(CHROME_ZIP) $(FIREFOX_XPI) manifest.json.bak
	@echo "Cleaned."
