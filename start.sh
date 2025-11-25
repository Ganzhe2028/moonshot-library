#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT_DIR="$ROOT_DIR"
BACK_DIR="$ROOT_DIR/server"

AUTO_INSTALL=${AUTO_INSTALL:-true}
FORCE_HOST=${HOST:-}
SKIP_PORT_CHECK=${SKIP_PORT_CHECK:-false}
FRONT_PORT=${FRONT_PORT:-5173}
BACK_PORT=${BACK_PORT:-3000}

info() { echo "ℹ️  $*"; }
warn() { echo "⚠️  $*" >&2; }
error() { echo "❌ $*" >&2; }

check_port() {
  local port=$1
  if $SKIP_PORT_CHECK; then
    return 0
  fi
  if lsof -i ":${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    warn "Port ${port} already in use. Set FRONT_PORT/BACK_PORT or free the port."
  fi
}

ensure_dependencies() {
  if [ ! -d "$FRONT_DIR/node_modules" ]; then
    if $AUTO_INSTALL; then
      info "Frontend deps missing. Installing..."
      (cd "$FRONT_DIR" && npm install)
    else
      error "Frontend dependencies missing. Run 'npm install' in project root."
      exit 1
    fi
  fi

  if [ ! -d "$BACK_DIR/node_modules" ]; then
    if $AUTO_INSTALL; then
      info "Backend deps missing. Installing..."
      (cd "$BACK_DIR" && npm install)
    else
      error "Backend dependencies missing. Run 'cd server && npm install'."
      exit 1
    fi
  fi
}

start_backend() {
  info "Starting backend (server)..."
  local host_env=()
  if [ -n "$FORCE_HOST" ]; then
    host_env=(HOST="$FORCE_HOST")
  fi
  (cd "$BACK_DIR" && "${host_env[@]}" npm run dev -- --host "${FORCE_HOST:-}") &
  BACK_PID=$!
}

start_frontend() {
  info "Starting frontend (Vite)..."
  local host_flag=()
  if [ -n "$FORCE_HOST" ]; then
    host_flag=(--host "$FORCE_HOST")
  fi
  (cd "$FRONT_DIR" && npm run dev -- --port "$FRONT_PORT" "${host_flag[@]}") &
  FRONT_PID=$!
}

cleanup() {
  echo ""
  echo "🛑 Shutting down servers..."
  pkill -P $$ 2>/dev/null || true
}

ensure_dependencies
check_port "$BACK_PORT"
check_port "$FRONT_PORT"

trap cleanup EXIT INT TERM

start_backend
start_frontend

echo ""
echo "✅ Backend running at http://localhost:${BACK_PORT}"
echo "✅ Frontend running at http://localhost:${FRONT_PORT}"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
