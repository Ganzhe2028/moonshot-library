#!/usr/bin/env bash
set -euo pipefail

# Root paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT_DIR="$ROOT_DIR"
BACK_DIR="$ROOT_DIR/server"

# Runtime options
AUTO_INSTALL=${AUTO_INSTALL:-true}
FORCE_HOST=${HOST:-}
SKIP_PORT_CHECK=${SKIP_PORT_CHECK:-false}
FRONT_PORT=${FRONT_PORT:-5173}
BACK_PORT=${BACK_PORT:-${PORT:-3000}}

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
    return 1
  fi
}

ensure_dependencies() {
  if [ ! -d "$FRONT_DIR/node_modules" ]; then
    if $AUTO_INSTALL; then
      info "Installing frontend deps..."
      (cd "$FRONT_DIR" && npm install)
    else
      error "Frontend dependencies missing. Run 'npm install' in project root."
      exit 1
    fi
  fi

  if [ ! -d "$BACK_DIR/node_modules" ]; then
    if $AUTO_INSTALL; then
      info "Installing backend deps..."
      (cd "$BACK_DIR" && npm install)
    else
      error "Backend dependencies missing. Run 'cd server && npm install'."
      exit 1
    fi
  fi
}

start_backend() {
  info "Starting backend (server)..."
  (
    cd "$BACK_DIR"
    PORT="$BACK_PORT" HOST="$FORCE_HOST" npm run dev -- --host "${FORCE_HOST:-}"
  ) &
  BACK_PID=$!
  BACK_PGID=$(ps -o pgid= "$BACK_PID" | tr -d ' ')
  info "Backend PID $BACK_PID (group $BACK_PGID)"
}

start_frontend() {
  info "Starting frontend (Vite)..."
  (
    cd "$FRONT_DIR"
    npm run dev -- --port "$FRONT_PORT" ${FORCE_HOST:+--host "$FORCE_HOST"}
  ) &
  FRONT_PID=$!
  FRONT_PGID=$(ps -o pgid= "$FRONT_PID" | tr -d ' ')
  info "Frontend PID $FRONT_PID (group $FRONT_PGID)"
}

cleanup() {
  echo ""
  echo "🛑 Shutting down servers..."

  # Kill whole process groups to avoid orphaned children
  if [ -n "${BACK_PGID:-}" ]; then
    kill -TERM "-${BACK_PGID}" 2>/dev/null || true
  fi
  if [ -n "${FRONT_PGID:-}" ]; then
    kill -TERM "-${FRONT_PGID}" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
  echo "✅ All services stopped."
}

usage() {
  cat <<EOF
Moonshot Library start script

Environment variables:
  FRONT_PORT     Frontend dev server port (default 5173)
  BACK_PORT      Backend dev server port / PORT (default 3000)
  HOST           Bind host, e.g. 0.0.0.0 to expose externally
  AUTO_INSTALL   Install node_modules automatically (default true)
  SKIP_PORT_CHECK  Skip port availability checks (default false)

Examples:
  FRONT_PORT=5174 BACK_PORT=4000 ./start.sh
  HOST=0.0.0.0 ./start.sh
EOF
  exit 0
}

if [[ "${1:-}" =~ ^(-h|--help)$ ]]; then
  usage
fi

trap cleanup EXIT INT TERM

ensure_dependencies
check_port "$BACK_PORT" || exit 1
check_port "$FRONT_PORT" || exit 1

start_backend
start_frontend

echo ""
echo "✅ Backend running at http://localhost:${BACK_PORT}"
echo "✅ Frontend running at http://localhost:${FRONT_PORT}"
echo "Press Ctrl+C to stop both servers."

wait
