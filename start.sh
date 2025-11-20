#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT_DIR="$ROOT_DIR"
BACK_DIR="$ROOT_DIR/server"

ensure_dependencies() {
  if [ ! -d "$FRONT_DIR/node_modules" ]; then
    echo "🔧 Frontend dependencies missing. Please run 'npm install' in the project root first."
    exit 1
  fi

  if [ ! -d "$BACK_DIR/node_modules" ]; then
    echo "🔧 Backend dependencies missing. Please run 'cd server && npm install' before using this script."
    exit 1
  fi
}

start_backend() {
  echo "🚀 Starting backend (server)..."
  (cd "$BACK_DIR" && npm run dev) &
  BACK_PID=$!
}

start_frontend() {
  echo "🚀 Starting frontend (Vite)..."
  (cd "$FRONT_DIR" && npm run dev) &
  FRONT_PID=$!
}

cleanup() {
  echo ""
  echo "🛑 Shutting down servers..."
  [[ -n "${FRONT_PID:-}" ]] && kill "$FRONT_PID" 2>/dev/null || true
  [[ -n "${BACK_PID:-}" ]] && kill "$BACK_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}

ensure_dependencies
trap cleanup EXIT

start_backend
start_frontend

echo ""
echo "✅ Backend running at http://localhost:3000"
echo "✅ Frontend running at http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
