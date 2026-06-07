#!/bin/bash
# Downloads pre-built llama.cpp binaries for the current architecture.
# Usage: ./scripts/download-deps.sh [version]
# If version is omitted, downloads the latest release.

set -e

ARCH=$(uname -m)   # arm64 or x86_64
DEST="core/bin"
REPO="jebi-sh/llama-deps"
TAG="${1:-latest}"

# Skip if already populated (CI caching / local rebuild)
if [ "$(ls -A "$DEST" 2>/dev/null | grep -v '.gitkeep' | wc -l)" -gt 0 ]; then
  echo "[deps] core/bin already populated, skipping download."
  exit 0
fi

echo "[deps] Downloading llama-deps-${ARCH}.tar.gz from ${REPO}@${TAG}..."

mkdir -p "$DEST"
gh release download "$TAG" \
  --repo "$REPO" \
  --pattern "llama-deps-${ARCH}.tar.gz" \
  --output /tmp/llama-deps.tar.gz \
  --clobber

tar -xzf /tmp/llama-deps.tar.gz -C "$DEST"
echo "[deps] Done — binaries installed to $DEST"
