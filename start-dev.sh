#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

copy_env_if_missing() {
  local src="$1"
  local dest="$2"

  if [[ ! -f "$dest" && -f "$src" ]]; then
    cp "$src" "$dest"
    echo "Created $(basename "$dest") from example."
  fi
}

copy_env_if_missing "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
copy_env_if_missing "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"

if [[ ! -d "$ROOT_DIR/backend/node_modules" ]]; then
  npm --prefix "$ROOT_DIR/backend" install
fi

if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  npm --prefix "$ROOT_DIR/frontend" install
fi

open_browser() {
  local url="$1"

  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 && return
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 && return
  fi

  echo "Please open $url manually."
}

npm --prefix "$ROOT_DIR/frontend" run dev:all &
DEV_PID=$!

trap 'kill "$DEV_PID" 2>/dev/null || true' EXIT

sleep 2
open_browser "http://localhost:5173/"

wait "$DEV_PID"
