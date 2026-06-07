#!/bin/bash
# Downloads pre-built llama.cpp binaries for the current architecture.
# No authentication required — llama-deps is a public repo.

set -e

ARCH=$(uname -m)   # arm64 or x86_64
DEST="core/bin"
URL="https://github.com/jebi-sh/llama-deps/releases/latest/download/llama-deps-${ARCH}.tar.gz"

# Skip if already populated (local rebuild / CI cache)
if [ "$(ls -A "$DEST" 2>/dev/null | grep -v '.gitkeep' | wc -l)" -gt 0 ]; then
  echo "[deps] core/bin already populated, skipping download."
  exit 0
fi

echo "[deps] Downloading llama-deps-${ARCH}.tar.gz..."
mkdir -p "$DEST"
curl -fL "$URL" -o /tmp/llama-deps.tar.gz
tar -xzf /tmp/llama-deps.tar.gz -C "$DEST"
echo "[deps] Done — binaries installed to $DEST"
