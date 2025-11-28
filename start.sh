#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT_DIR="$ROOT_DIR"
BACK_DIR="$ROOT_DIR/server"

# 环境变量配置
AUTO_INSTALL=${AUTO_INSTALL:-true}
FORCE_HOST=${HOST:-}
SKIP_PORT_CHECK=${SKIP_PORT_CHECK:-false}
FRONT_PORT=${FRONT_PORT:-5173}
BACK_PORT=${BACK_PORT:-3000}
ENV=${ENV:-development}
USE_NGINX=${USE_NGINX:-false}

# 日志函数
info() { echo "ℹ️  $*"; }
warn() { echo "⚠️  $*" >&2; }
error() { echo "❌ $*" >&2; }

# 检查端口占用
check_port() {
  local port=$1
  if $SKIP_PORT_CHECK; then
    return 0
  fi
  if lsof -i ":${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    warn "Port ${port} already in use. Set FRONT_PORT/BACK_PORT or free the port."
    return 1
  fi
  return 0
}

# 确保依赖安装
ensure_dependencies() {
  info "检查依赖..."
  
  # 前端依赖
  if [ ! -d "$FRONT_DIR/node_modules" ]; then
    if $AUTO_INSTALL; then
      info "安装前端依赖..."
      (cd "$FRONT_DIR" && npm install)
    else
      error "前端依赖缺失。请在项目根目录运行 'npm install'。"
      exit 1
    fi
  fi

  # 后端依赖
  if [ ! -d "$BACK_DIR/node_modules" ]; then
    if $AUTO_INSTALL; then
      info "安装后端依赖..."
      (cd "$BACK_DIR" && npm install)
    else
      error "后端依赖缺失。请运行 'cd server && npm install'。"
      exit 1
    fi
  fi
}

# 构建项目
build_project() {
  info "开始构建项目..."
  
  # 构建后端
  info "构建后端..."
  (cd "$BACK_DIR" && npm run build)
  
  # 构建前端
  info "构建前端..."
  (cd "$FRONT_DIR" && npm run build)
  
  info "构建完成！"
}

# 启动后端服务
start_backend() {
  info "启动后端服务..."
  local host_env=()
  if [ -n "$FORCE_HOST" ]; then
    host_env=(HOST="$FORCE_HOST")
  fi
  
  if [ "$ENV" = "development" ]; then
    # 开发环境使用 dev 模式
    if [ ${#host_env[@]} -gt 0 ]; then
      (cd "$BACK_DIR" && "${host_env[@]}" npm run dev -- --host "${FORCE_HOST:-}") &
    else
      (cd "$BACK_DIR" && npm run dev -- --host "${FORCE_HOST:-}") &
    fi
  else
    # 生产环境使用 build 后的代码
    if [ ${#host_env[@]} -gt 0 ]; then
      (cd "$BACK_DIR" && "${host_env[@]}" npm start) &
    else
      (cd "$BACK_DIR" && npm start) &
    fi
  fi
  
  BACK_PID=$!
  info "后端服务已启动，PID: $BACK_PID"
}

# 启动前端开发服务器
start_frontend_dev() {
  info "启动前端开发服务器..."
  local host_flag=()
  if [ -n "$FORCE_HOST" ]; then
    host_flag=(--host "$FORCE_HOST")
  fi
  
  if [ ${#host_flag[@]} -gt 0 ]; then
    (cd "$FRONT_DIR" && npm run dev -- --port "$FRONT_PORT" "${host_flag[@]}") &
  else
    (cd "$FRONT_DIR" && npm run dev -- --port "$FRONT_PORT") &
  fi
  FRONT_PID=$!
  info "前端开发服务器已启动，PID: $FRONT_PID"
}

# 配置并启动 nginx
start_nginx() {
  info "配置并启动 Nginx..."
  
  # 检查 nginx 是否已安装
  if ! command -v nginx &> /dev/null; then
    error "Nginx 未安装。请先安装 Nginx。"
    exit 1
  fi
  
  # 创建 nginx 配置目录
  mkdir -p "$ROOT_DIR/nginx/conf.d" 2>/dev/null
  
  # 生成 nginx 配置文件
  cat > "$ROOT_DIR/nginx/conf.d/library.conf" << EOF
server {
    listen 80;
    server_name localhost;
    
    # 前端静态资源
    location / {
        root $ROOT_DIR/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:$BACK_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:$BACK_PORT/health;
    }
}
EOF
  
  # 检查 nginx 配置
  nginx -t -c "$ROOT_DIR/nginx/nginx.conf" 2>/dev/null || {
    # 如果自定义配置文件不存在，使用默认配置
    info "使用默认 Nginx 配置"
    # 备份原配置
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak 2>/dev/null || true
    
    # 创建简化的 nginx 主配置
    cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    sendfile on;
    keepalive_timeout 65;
    include /etc/nginx/conf.d/*.conf;
}
EOF
    
    # 复制站点配置到 nginx 配置目录
    cp "$ROOT_DIR/nginx/conf.d/library.conf" /etc/nginx/conf.d/ 2>/dev/null || {
      error "无法复制 nginx 配置文件到 /etc/nginx/conf.d/，请检查权限"
      exit 1
    }
    
    # 重新检查配置
    nginx -t || {
      error "Nginx 配置错误，请检查配置文件"
      exit 1
    }
  }
  
  # 启动或重启 nginx
  if systemctl is-active --quiet nginx; then
    info "重启 Nginx..."
    systemctl restart nginx
  else
    info "启动 Nginx..."
    systemctl start nginx
  fi
  
  info "Nginx 已启动并配置完成！"
}

# 清理函数
cleanup() {
  echo ""
  echo "🛑 正在关闭服务..."
  
  # 关闭后端
  if [ -n "${BACK_PID:-}" ]; then
    kill "$BACK_PID" 2>/dev/null || true
  fi
  
  # 关闭前端开发服务器
  if [ -n "${FRONT_PID:-}" ]; then
    kill "$FRONT_PID" 2>/dev/null || true
  fi
  
  # 如果使用了 nginx，停止 nginx
  if $USE_NGINX; then
    info "停止 Nginx..."
    systemctl stop nginx 2>/dev/null || true
  fi
  
  echo "✅ 所有服务已关闭！"
}

# 显示帮助信息
show_help() {
  echo "Moonshot Library 启动脚本"
  echo ""
  echo "用法: $0 [选项]"
  echo ""
  echo "选项:"
  echo "  --env <environment>    设置环境 (development/production)，默认: development"
  echo "  --use-nginx           使用 Nginx 作为前端服务器 (仅生产环境)"
  echo "  --no-install          跳过依赖安装"
  echo "  --skip-port-check     跳过端口检查"
  echo "  --host <host>         设置主机地址"
  echo "  --front-port <port>   设置前端端口，默认: 5173"
  echo "  --back-port <port>    设置后端端口，默认: 3000"
  echo "  -h, --help            显示帮助信息"
  echo ""
  echo "示例:"
  echo "  # 开发环境启动"
  echo "  $0"
  echo ""
  echo "  # 生产环境使用 Nginx 启动"
  echo "  $0 --env production --use-nginx"
  echo ""
  echo "  # 自定义端口"
  echo "  $0 --front-port 3001 --back-port 3002"
  exit 0
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV="$2"
      shift 2
      ;;
    --use-nginx)
      USE_NGINX=true
      shift
      ;;
    --no-install)
      AUTO_INSTALL=false
      shift
      ;;
    --skip-port-check)
      SKIP_PORT_CHECK=true
      shift
      ;;
    --host)
      FORCE_HOST="$2"
      shift 2
      ;;
    --front-port)
      FRONT_PORT="$2"
      shift 2
      ;;
    --back-port)
      BACK_PORT="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      ;;
    *)
      error "未知参数: $1"
      show_help
      ;;
  esac
done

# 检查环境变量
if [ "$USE_NGINX" = true ] && [ "$ENV" != "production" ]; then
  warn "Nginx 仅建议在生产环境使用，当前环境: $ENV"
fi

# 检查端口
check_port "$BACK_PORT" || exit 1
if [ "$ENV" = "development" ] && [ "$USE_NGINX" = false ]; then
  check_port "$FRONT_PORT" || exit 1
fi

# 确保依赖
ensure_dependencies

# 如果是生产环境或明确指定了构建，执行构建
if [ "$ENV" = "production" ] || [ "$USE_NGINX" = true ]; then
  build_project
fi

# 注册清理函数
trap cleanup EXIT INT TERM

# 启动服务
start_backend

if [ "$ENV" = "development" ] && [ "$USE_NGINX" = false ]; then
  # 开发环境启动前端开发服务器
  start_frontend_dev
  
  echo ""
  echo "✅ 开发环境服务已启动！"
  echo "   后端服务: http://localhost:${BACK_PORT}"
  echo "   前端服务: http://localhost:${FRONT_PORT}"
  echo ""
  echo "按 Ctrl+C 停止所有服务。"
elif [ "$USE_NGINX" = true ]; then
  # 生产环境使用 nginx
  start_nginx
  
  echo ""
  echo "✅ 生产环境服务已启动！"
  echo "   后端服务: http://localhost:${BACK_PORT}"
  echo "   前端服务 (Nginx): http://localhost"
  echo "   健康检查: http://localhost/health"
  echo ""
  echo "按 Ctrl+C 停止所有服务。"
else
  # 生产环境但不使用 nginx（仅后端）
  echo ""
  echo "✅ 后端服务已启动！"
  echo "   后端服务: http://localhost:${BACK_PORT}"
  echo "   健康检查: http://localhost:${BACK_PORT}/health"
  echo ""
  echo "按 Ctrl+C 停止服务。"
fi

# 等待所有后台进程
wait
