# jebi — Codebase Guide

## Architecture

- `core/` — Go PTY server (term-core binary). Manages shell sessions over WebSocket, streams output, runs AI via llama-server.
- `app/` — Electron app (electron-vite + React). Renderer = xterm.js + React UI. Main = IPC handlers, AI config, model downloads.
- `core/bin/` — Pre-built llama.cpp binaries (not committed — fetched via `make deps`).

## Key commands

```bash
make deps    # download llama.cpp binaries for current arch (arm64/x86_64)
make dev     # build Go core + npm install + electron-vite dev
make build   # full release build (DMG + ZIP)
make install # copy .app to /Applications
```

## Important files

| File | Purpose |
|---|---|
| `core/session/session.go` | PTY session, WebSocket, AI dispatch |
| `core/session/detect.go` | Shell env detection (git, node, go…), context banner |
| `app/src/main/index.js` | Electron main — IPC, model registry, AI config |
| `app/src/renderer/src/addons/PromptAddon.jsx` | xterm decoration system (prompt, status bar) |
| `app/src/renderer/src/components/OutputArea/index.jsx` | xterm init, PTY output handling, overlay rendering |
| `app/src/renderer/src/components/TerminalPane/index.jsx` | Per-pane state, AI suggestions, input bar |
| `app/src/renderer/src/commands/registry.js` | Slash command definitions (/ls, /ports, /run…) |
| `scripts/download-deps.sh` | Fetches llama binaries from jebi-sh/llama-deps release |
| `.github/workflows/release.yml` | Manual release workflow — bump version, build, publish |

## AI model registry

Defined in `app/src/main/index.js` → `MODEL_REGISTRY`. Three models:
- Qwen2.5 1.5B (Recommended)
- Phi-3 Mini 3.8B (Best quality)
- Gemma 2 2B (Balanced)

## Release process

Trigger manually via GitHub Actions → Release → Run workflow → enter version (e.g. `0.1.4`).  
Workflow: bumps package.json → builds → publishes GitHub Release → updates `jebi-sh/homebrew-tap`.

## llama deps

Binaries live in `jebi-sh/llama-deps` releases as `llama-deps-arm64.tar.gz` / `llama-deps-x86_64.tar.gz`.  
`make deps` fetches the right one via curl (no auth needed — public repo).

## Known issues

See `KNOWN_BUGS.md` (local only, not committed).
