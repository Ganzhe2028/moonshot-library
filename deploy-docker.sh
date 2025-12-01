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
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Always run from repo root so relative paths are stable
cd "$ROOT_DIR"

log() { echo -e "${GREEN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
err() { echo -e "${RED}$*${NC}" >&2; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "缺少命令: $1"; exit 1; }
}

# 检查端口是否被占用
check_port() {
  local port=$1
  local service=$2
  
  # 使用lsof检查端口
  if command -v lsof >/dev/null 2>&1; then
    if lsof -i ":${port}" -sTCP:LISTEN >/dev/null 2>&1; then
      err "端口 ${port} 已被占用（${service}），请先释放该端口或修改配置。"
      return 1
    fi
    return 0
  fi
  
  # 使用netstat检查端口
  if command -v netstat >/dev/null 2>&1; then
    if netstat -tuln | grep -q ":${port} " >/dev/null 2>&1; then
      err "端口 ${port} 已被占用（${service}），请先释放该端口或修改配置。"
      return 1
    fi
    return 0
  fi
  
  # 使用ss检查端口
  if command -v ss >/dev/null 2>&1; then
    if ss -tuln | grep -q ":${port} " >/dev/null 2>&1; then
      err "端口 ${port} 已被占用（${service}），请先释放该端口或修改配置。"
      return 1
    fi
    return 0
  fi
  
  # 如果没有可用的端口检查命令，跳过检查
  warn "无法检查端口 ${port}，缺少lsof/netstat/ss命令"
  return 0
}

# 检查Docker服务状态
check_docker_status() {
  if ! docker info >/dev/null 2>&1; then
    err "Docker服务未运行或无法访问，请先启动Docker服务。"
    return 1
  fi
  return 0
}

# 检查网络连接
check_network() {
  if ! ping -c 1 -W 5 registry.docker.com >/dev/null 2>&1; then
    warn "无法连接到Docker Hub，可能会影响镜像拉取速度"
  fi
  return 0
}

# 检查磁盘空间
check_disk_space() {
  local required_space=10 # GB
  local available_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
  
  if [ -z "$available_space" ] || [ "$available_space" -lt "$required_space" ]; then
    warn "可用磁盘空间不足（需要${required_space}GB，可用${available_space}GB），可能会导致构建失败"
  fi
  return 0
}

# 检查内存
check_memory() {
  local required_memory=2 # GB
  local available_memory=$(free -g | grep Mem | awk '{print $7}')
  
  if [ -z "$available_memory" ] || [ "$available_memory" -lt "$required_memory" ]; then
    warn "可用内存不足（需要${required_memory}GB，可用${available_memory}GB），可能会导致构建失败"
  fi
  return 0
}

# 检查用户权限
check_docker_permission() {
  if ! docker ps >/dev/null 2>&1; then
    err "当前用户没有Docker权限，请使用sudo或将用户添加到docker组。"
    return 1
  fi
  return 0
}

check_prereqs() {
  require_cmd docker
  
  # 检查Docker服务状态
  check_docker_status || exit 1
  
  # 检查用户权限
  check_docker_permission || exit 1
  
  # 检查端口占用
  check_port 3000 "后端服务" || exit 1
  check_port 80 "前端服务" || exit 1
  
  # 检查网络连接
  check_network
  
  # 检查磁盘空间
  check_disk_space
  
  # 检查内存
  check_memory
  
  # 首先检查是否安装了docker-compose命令
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_BIN="docker-compose"
    log "使用 docker-compose 命令"
    return
  fi
  
  # 然后尝试检查docker compose子命令
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_BIN="docker compose"
    log "使用 docker compose 子命令"
    return
  fi
  
  # 如果都不可用，提示错误
  err "Docker Compose 未安装或不可用，请先安装。"
  exit 1
}

ensure_env() {
  # 加载.env文件
  if [ -f ".env" ]; then
    set -a
    . ./.env
    set +a
    log "已加载.env文件"
  fi
  
  # 确保.env.production文件存在
  if [ ! -f ".env.production" ]; then
    warn ".env.production文件不存在，正在创建默认配置..."
    cat > .env.production << EOF
# 生产环境配置
VITE_API_URL=/api
NODE_ENV=production
EOF
    log "已创建默认.env.production文件"
  fi
  
  # 检查API URL配置
  if [ -z "${VITE_API_URL:-}" ]; then
    export VITE_API_URL="/api"
    log "已设置默认API URL: $VITE_API_URL"
  fi
  
  # 显示当前配置
  log "当前环境配置:"
  log "  NODE_ENV: ${NODE_ENV:-production}"
  log "  NODE_IMAGE: ${NODE_IMAGE:-node:20-alpine}"
  log "  VITE_API_URL: ${VITE_API_URL}"
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
  local db_dir="./backend/database"
  if [ -d "$db_dir" ] && [ -f "$db_dir/library.db" ]; then
    warn "备份数据库..."
    local backup_dir="$db_dir/backups"
    mkdir -p "$backup_dir"
    local backup_file="$backup_dir/library_db_backup_$(date +%Y%m%d_%H%M%S).db"
    cp "$db_dir/library.db" "$backup_file"
    log "✅ 数据库已备份到: $backup_file"
    find "$backup_dir" -name "library_db_backup_*.db" -mtime +30 -delete
  else
    warn "未找到数据库文件，跳过备份"
  fi
}

create_database_directory() {
  mkdir -p ./backend/database
  chmod -R 755 ./backend/database
}

# 清理构建缓存
clean_build_cache() {
  warn "清理Docker构建缓存..."
  docker builder prune -f --filter "until=24h" 2>/dev/null || true
  docker image prune -f --filter "dangling=true" 2>/dev/null || true
  return 0
}

# 清理日志
clean_logs() {
  warn "清理Docker日志..."
  docker container prune -f 2>/dev/null || true
  return 0
}

# 停止并清理服务
stop_services() {
  if [ -f "docker-compose.yml" ]; then
    warn "停止现有服务（如果存在）..."
    
    # 停止所有相关容器
    $COMPOSE_BIN down ${CLEAN_VOLUMES:+-v} --remove-orphans || true
    
    # 额外删除可能存在的孤立容器
    if command -v docker >/dev/null 2>&1; then
      # 删除所有与项目相关的容器
      docker rm $(docker ps -aq -f "label=com.docker.compose.project=$PROJECT_NAME") 2>/dev/null || true
      
      # 删除所有与项目相关的网络
      docker network rm $(docker network ls -q -f "name=$PROJECT_NAME") 2>/dev/null || true
      
      # 删除所有与项目相关的卷（如果需要）
      if $CLEAN_VOLUMES; then
        docker volume rm $(docker volume ls -q -f "name=$PROJECT_NAME") 2>/dev/null || true
      fi
    fi
    
    # 清理构建缓存
    clean_build_cache
    
    # 清理日志
    clean_logs
  fi
}

# 等待服务健康
wait_for_health() {
  local service=$1
  local max_retries=${2:-10}
  local delay=${3:-5}
  local retry=0
  
  while [ $retry -lt $max_retries ]; do
    local status=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "unknown")
    if [ "$status" = "healthy" ]; then
      return 0
    fi
    
    retry=$((retry + 1))
    warn "服务 $service 健康检查中... (${retry}/${max_retries}) - 当前状态: $status"
    sleep $delay
  done
  
  err "服务 $service 健康检查失败，当前状态: $status"
  return 1
}

deploy_services() {
  warn "开始构建和启动服务..."

  # 设置构建环境变量
  export NODE_ENV=production
  export NODE_IMAGE=${NODE_IMAGE:-node:20-alpine}
  export LOG_LEVEL=${LOG_LEVEL:-warn}
  export HEALTH_CHECK_PATH=${HEALTH_CHECK_PATH:-/health}
  export ALLOWED_DOMAINS=${ALLOWED_DOMAINS:-}
  export TRUST_PROXY=${TRUST_PROXY:-1}
  export COMPOSE_HTTP_TIMEOUT=${COMPOSE_HTTP_TIMEOUT:-1200}
  export DOCKER_BUILDKIT=1 # 启用BuildKit加速构建
  export VITE_API_URL=${VITE_API_URL:-/api} # 确保API URL配置正确
  
  # 显示构建配置
  log "构建配置:"
  log "  NODE_ENV: $NODE_ENV"
  log "  NODE_IMAGE: $NODE_IMAGE"
  log "  VITE_API_URL: $VITE_API_URL"
  log "  DOCKER_BUILDKIT: $DOCKER_BUILDKIT"
  
  # 构建并启动服务，总是重新构建镜像
  local max_retries=3
  local retry=0
  local success=false
  
  while [ $retry -lt $max_retries ]; do
    retry=$((retry + 1))
    warn "构建尝试 ${retry}/${max_retries}..."
    
    # 分步执行：先构建，后启动（更可靠）
    if $COMPOSE_BIN build --no-cache && $COMPOSE_BIN up -d --timeout 300; then
      success=true
      break
    else
      local remaining_retries=$((max_retries - retry))
      warn "构建失败，${remaining_retries}次重试机会"
      if [ $retry -lt $max_retries ]; then
        warn "清理失败的构建..."
        $COMPOSE_BIN down -v --remove-orphans || true
        sleep 10
      fi
    fi
  done
  
  if ! $success; then
    err "构建失败，已尝试${max_retries}次"
    exit 1
  fi

  log "✅ 构建/启动指令已下发，等待健康检查..."
}

check_services() {
  warn "等待服务启动并检查状态..."
  
  local backend="${PROJECT_NAME}-backend"
  local frontend="${PROJECT_NAME}-frontend"
  
  # 显示服务状态
  log "服务状态："
  $COMPOSE_BIN ps
  
  # 等待后端服务健康
  if wait_for_health "$backend" 15 5; then
    log "✅ 后端服务健康检查通过"
  else
    warn "⚠️  后端服务健康检查失败，可能需要手动检查"
  fi
  
  # 等待前端服务健康
  if wait_for_health "$frontend" 15 5; then
    log "✅ 前端服务健康检查通过"
  else
    warn "⚠️  前端服务健康检查失败，可能需要手动检查"
  fi
  
  # 显示最终状态
  log "最终服务状态："
  $COMPOSE_BIN ps
  
  local backend_healthy=$(docker inspect --format='{{.State.Health.Status}}' "$backend" 2>/dev/null || echo "unknown")
  local frontend_healthy=$(docker inspect --format='{{.State.Health.Status}}' "$frontend" 2>/dev/null || echo "unknown")
  
  echo "后端服务状态: $backend_healthy"
  echo "前端服务状态: $frontend_healthy"
  
  # 测试服务访问
  if command -v curl >/dev/null 2>&1; then
    log "测试服务访问..."
    
    # 测试后端健康检查
    local backend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
    if [ "$backend_response" = "200" ]; then
      log "✅ 后端健康检查访问成功"
    else
      warn "⚠️  后端健康检查访问失败，状态码: $backend_response"
    fi
    
    # 测试前端访问
    local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
    if [ "$frontend_response" = "200" ]; then
      log "✅ 前端访问成功"
    else
      warn "⚠️  前端访问失败，状态码: $frontend_response"
    fi
  fi
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
