#!/bin/bash

# ============================================================
# Moonshot Library 部署脚本
# 用于 PM2 + Nginx 部署方案
# ============================================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOGS_DIR="$PROJECT_ROOT/logs"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的命令
check_requirements() {
    print_info "检查系统环境..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js 20+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_warning "Node.js 版本 $(node -v)，建议使用 20+"
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 未安装，正在安装..."
        npm install -g pm2
    fi
    
    print_success "环境检查通过"
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    
    # 前端依赖
    print_info "安装前端依赖..."
    cd "$FRONTEND_DIR"
    npm install --legacy-peer-deps
    
    # 后端依赖
    print_info "安装后端依赖..."
    cd "$BACKEND_DIR"
    npm install
    
    print_success "依赖安装完成"
}

# 构建项目
build_project() {
    print_info "构建项目..."
    
    # 构建前端
    print_info "构建前端..."
    cd "$FRONTEND_DIR"
    npm run build
    
    # 构建后端
    print_info "构建后端..."
    cd "$BACKEND_DIR"
    npm run build
    
    print_success "项目构建完成"
}

# 初始化数据库
init_database() {
    print_info "初始化数据库..."
    cd "$BACKEND_DIR"
    
    # 创建数据库目录
    mkdir -p database
    
    # 运行初始化脚本
    npm run init-db
    
    print_success "数据库初始化完成"
}

# 创建日志目录
setup_logs() {
    print_info "创建日志目录..."
    mkdir -p "$LOGS_DIR"
    print_success "日志目录创建完成: $LOGS_DIR"
}

# 启动/重启服务
start_service() {
    print_info "启动后端服务..."
    cd "$PROJECT_ROOT"
    
    # 检查是否已有运行的实例
    if pm2 list | grep -q "moonshot-backend"; then
        print_info "重启现有服务..."
        pm2 restart moonshot-backend
    else
        print_info "启动新服务..."
        pm2 start ecosystem.config.js --env production
    fi
    
    # 保存 PM2 进程列表
    pm2 save
    
    print_success "后端服务已启动"
    print_info "查看日志: pm2 logs moonshot-backend"
}

# 停止服务
stop_service() {
    print_info "停止后端服务..."
    pm2 stop moonshot-backend 2>/dev/null || true
    print_success "服务已停止"
}

# 显示状态
show_status() {
    print_info "服务状态:"
    pm2 list
}

# 显示帮助
show_help() {
    echo ""
    echo "Moonshot Library 部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  install     安装依赖"
    echo "  build       构建前端和后端"
    echo "  init-db     初始化数据库"
    echo "  start       启动服务"
    echo "  stop        停止服务"
    echo "  restart     重启服务"
    echo "  status      查看服务状态"
    echo "  deploy      完整部署（安装 + 构建 + 启动）"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy    # 首次完整部署"
    echo "  $0 restart   # 更新代码后重启"
    echo ""
}

# 完整部署
full_deploy() {
    print_info "开始完整部署..."
    echo ""
    
    check_requirements
    install_dependencies
    build_project
    init_database
    setup_logs
    start_service
    
    echo ""
    print_success "============================================"
    print_success "部署完成！"
    print_success "============================================"
    echo ""
    print_info "后端服务运行在: http://localhost:3000"
    print_info "前端静态文件位于: $FRONTEND_DIR/dist"
    echo ""
    print_info "下一步:"
    print_info "1. 配置 Nginx（参考 nginx/moonshot-library.conf）"
    print_info "2. 配置后端环境变量（backend/.env）"
    print_info "3. 配置 SSL 证书（推荐使用 Certbot）"
    echo ""
}

# 主程序
case "${1:-}" in
    install)
        check_requirements
        install_dependencies
        ;;
    build)
        build_project
        ;;
    init-db)
        init_database
        ;;
    start)
        setup_logs
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        start_service
        ;;
    status)
        show_status
        ;;
    deploy)
        full_deploy
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac

