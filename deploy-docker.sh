#!/usr/bin/env bash
#
# Moonshot Library 线上部署脚本（非交互优先，可选自动备份/清缓存）

set -euo pipefail

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

# Flags
NON_INTERACTIVE=${NON_INTERACTIVE:-false}
CLEAN_VOLUMES=${CLEAN_VOLUMES:-false}
PROJECT_NAME=${COMPOSE_PROJECT_NAME:-moonshot-library}
COMPOSE_BIN=${COMPOSE_BIN:-docker-compose}

log() { echo -e "${GREEN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
err() { echo -e "${RED}$*${NC}" >&2; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "缺少命令: $1"; exit 1; }
}

check_prereqs() {
  require_cmd docker
  if ! command -v docker-compose >/dev/null 2>&1 && ! command -v docker compose >/dev/null 2>&1; then
    err "Docker Compose 未安装，请先安装。"
    exit 1
  fi
  if command -v docker compose >/dev/null 2>&1; then
    COMPOSE_BIN="docker compose"
  fi
}

ensure_env() {
  if [ -f ".env" ]; then
    set -a
    . ./.env
    set +a
  fi
}

ensure_jwt() {
  if [ -n "${JWT_SECRET:-}" ]; then
    return
  fi
  if $NON_INTERACTIVE; then
    err "JWT_SECRET 未设置且处于非交互模式，退出。"
    exit 1
  fi
  warn "请配置 JWT_SECRET（生产环境请使用强密钥）"
  read -r -p "输入JWT密钥（回车将生成随机密钥）: " input_secret
  if [ -z "$input_secret" ]; then
    input_secret=$(openssl rand -hex 32)
    warn "已生成随机JWT密钥: $input_secret"
  fi
  export JWT_SECRET="$input_secret"
}

backup_database() {
  if [ -d "./server/database" ] && [ -f "./server/database/library.db" ]; then
    warn "备份数据库..."
    local backup_dir="./server/database/backups"
    mkdir -p "$backup_dir"
    local backup_file="$backup_dir/library_db_backup_$(date +%Y%m%d_%H%M%S).db"
    cp ./server/database/library.db "$backup_file"
    log "✅ 数据库已备份到: $backup_file"
    find "$backup_dir" -name "library_db_backup_*.db" -mtime +30 -delete
  else
    warn "未找到数据库文件，跳过备份"
  fi
}

create_database_directory() {
  mkdir -p ./server/database
  chmod -R 755 ./server/database
}

stop_services() {
  if [ -f "docker-compose.yml" ]; then
    warn "停止现有服务（如果存在）..."
    $COMPOSE_BIN down ${CLEAN_VOLUMES:+-v} --remove-orphans || true
  fi
}

deploy_services() {
  warn "开始构建和启动服务..."

  export NODE_ENV=production
  export NODE_IMAGE=${NODE_IMAGE:-node:20-alpine}
  export LOG_LEVEL=${LOG_LEVEL:-warn}
  export HEALTH_CHECK_PATH=${HEALTH_CHECK_PATH:-/health}
  export ALLOWED_DOMAINS=${ALLOWED_DOMAINS:-}
  export TRUST_PROXY=${TRUST_PROXY:-1}
  export COMPOSE_HTTP_TIMEOUT=${COMPOSE_HTTP_TIMEOUT:-1200}

  $COMPOSE_BIN up --build -d

  log "✅ 构建/启动指令已下发，等待健康检查..."
}

check_services() {
  warn "等待服务启动并检查状态..."
  sleep 20
  log "服务状态："
  $COMPOSE_BIN ps

  local backend="${PROJECT_NAME}-backend"
  local frontend="${PROJECT_NAME}-frontend"

  local backend_healthy
  backend_healthy=$(docker inspect --format='{{.State.Health.Status}}' "$backend" 2>/dev/null || echo "unknown")
  local frontend_healthy
  frontend_healthy=$(docker inspect --format='{{.State.Health.Status}}' "$frontend" 2>/dev/null || echo "unknown")

  echo "后端服务状态: $backend_healthy"
  echo "前端服务状态: $frontend_healthy"
}

show_summary() {
  log "🚀 部署完成"
  echo "前端: http://localhost"
  echo "后端: http://localhost:3000"
  if $CLEAN_VOLUMES; then
    warn "本次使用了卷清理选项，请确认数据已备份。"
  fi
}

main() {
  check_prereqs
  ensure_env
  ensure_jwt
  create_database_directory
  backup_database
  stop_services
  deploy_services
  check_services
  show_summary
}

main "$@"
