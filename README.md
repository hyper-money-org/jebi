<p align="center">
  <img src="assets/banner.svg" alt="jebi — The terminal that thinks with you" width="700"/>
</p>

<p align="center">
  <a href="https://github.com/jebi-sh/jebi/releases/latest"><img src="https://img.shields.io/github/v/release/jebi-sh/jebi?style=flat-square&color=3b82f6&label=Download" alt="Latest release"/></a>
  <img src="https://img.shields.io/badge/macOS-12%2B-flat-square?style=flat-square&color=1d4ed8" alt="macOS 12+"/>
  <img src="https://img.shields.io/badge/license-MIT-flat-square?style=flat-square&color=475569" alt="MIT"/>
</p>

---

<!-- Drop a demo.mp4 into assets/ and uncomment:
<p align="center">
  <video src="assets/demo.mp4" width="700" autoplay loop muted playsinline></video>
</p>
-->

## Features

**AI Intelligence**
- Automatic error analysis when a command fails
- 3 smart next-command suggestions after every run
- `/ask` to chat with AI about your current session
- Local AI — no API key, no subscription, runs entirely on your Mac

**Slash Commands**
- `/ls` — file explorer with preview
- `/ports` — live network port inspector
- `/run` — Makefile & npm scripts picker
- Define your own custom `/commands` in Preferences

**Workspace**
- Multiple tabs with per-tab accent colors
- Split panes horizontally or vertically (`⌘D` / `⌘⇧D`)
- Smart command history with prefix filtering

**Shell Integration**
- Git branch, Node, Go, Python, Docker, K8s status pills in the prompt
- Click any pill to copy its value
- WebGL-accelerated rendering

**Themes**
- Catppuccin Mocha, Tokyo Night, Dracula, Nord, Gruvbox, One Dark, Monokai

---

## Install

```bash
brew install --cask jebi-sh/tap/jebi
```

Or download the latest DMG from the [releases page](https://github.com/jebi-sh/jebi/releases).

---

## Build from source

**Prerequisites:** Node.js 18+, Go 1.21+, Make

```bash
git clone https://github.com/jebi-sh/jebi.git
cd jebi
make deps   # download llama.cpp binaries
make dev    # run in development mode
make build  # package the app
```

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘T` | New tab |
| `⌘W` | Close tab / pane |
| `⌘D` | Split pane horizontally |
| `⌘⇧D` | Split pane vertically |
| `⌘K` | Clear screen |
| `⌘F` | Search scrollback |
| `⌘,` | Open Preferences |
| `/` | Open command palette |

---

## License

MIT
