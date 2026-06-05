# jebi

**The AI-native terminal for Mac.**

jebi is a terminal emulator that understands what you're doing. It explains failed commands instantly, suggests what to run next, and puts useful context one keystroke away — so you stay in flow.

> Currently in beta. macOS Apple Silicon only.

---

## Features

**AI Intelligence**
- Automatic error analysis when a command fails
- 3 smart next-command suggestions after every run
- `/ask` to chat with AI about your current session

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

Download the latest release from the [releases page](https://github.com/jawahars16/jebi/releases) and drag jebi to your Applications folder.

---

## Build from source

**Prerequisites:** Node.js 18+, Go 1.21+, Make

```bash
git clone https://github.com/jawahars16/jebi.git
cd jebi
make dev       # run in development mode
make build     # package the app
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
