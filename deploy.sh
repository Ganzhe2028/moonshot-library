#!/bin/bash

# ============================================================
# Moonshot Library 部署脚本
# 支持开发/测试/生产多环境部署
# ============================================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOGS_DIR="$PROJECT_ROOT/logs"

# 默认环境和端口
ENV="${ENV:-development}"
FRONTEND_PORT=5173
BACKEND_PORT=3000

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

print_env() {
    echo -e "${CYAN}[ENV: $ENV]${NC} $1"
}

print_url() {
    echo -e "${MAGENTA}$1${NC}"
}

# 解析环境参数
parse_env() {
    case "$1" in
        --dev|--development)
            ENV="development"
            ;;
        --test)
            ENV="test"
            BACKEND_PORT=3001
            ;;
        --prod|--production)
            ENV="production"
            ;;
    esac
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

# 设置环境配置文件
setup_env_file() {
    print_env "配置环境文件..."
    
    # 后端环境文件
    local backend_env_file="$BACKEND_DIR/.env.$ENV"
    local backend_env_target="$BACKEND_DIR/.env"
    
    if [ -f "$backend_env_file" ]; then
        print_info "使用环境配置: $backend_env_file"
        cp "$backend_env_file" "$backend_env_target"
    elif [ ! -f "$backend_env_target" ]; then
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            print_warning "未找到 .env 文件，从 .env.example 创建"
            cp "$BACKEND_DIR/.env.example" "$backend_env_target"
        else
            print_error "未找到环境配置文件"
            exit 1
        fi
    fi
    
    # 前端环境文件
    local frontend_env_file="$FRONTEND_DIR/.env.$ENV"
    local frontend_env_target="$FRONTEND_DIR/.env.local"
    
    if [ -f "$frontend_env_file" ]; then
        print_info "使用前端配置: $frontend_env_file"
        cp "$frontend_env_file" "$frontend_env_target"
    fi
    
    print_success "环境配置完成"
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
    print_env "构建项目..."
    
    # 设置环境变量
    setup_env_file
    
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
    
    # 切换到后端目录执行，确保数据库路径正确
    cd "$BACKEND_DIR"
    
    # 创建数据库目录（在 backend 下）
    mkdir -p "$BACKEND_DIR/database"
    
    # 检查数据库是否已存在
    if [ -f "$BACKEND_DIR/database/library.db" ]; then
        print_warning "数据库已存在: $BACKEND_DIR/database/library.db"
        read -p "是否重新初始化？这会清空现有数据 [y/N]: " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            print_info "跳过数据库初始化"
            return
        fi
    fi
    
    # 运行初始化脚本（从 backend 目录执行）
    npm run init-db
    
    print_success "数据库初始化完成: $BACKEND_DIR/database/library.db"
}

# 创建日志目录
setup_logs() {
    print_info "创建日志目录..."
    mkdir -p "$LOGS_DIR"
    print_success "日志目录创建完成: $LOGS_DIR"
}

# 启动后端服务
start_backend() {
    print_env "启动后端服务..."
    cd "$PROJECT_ROOT"
    
    # 确定 PM2 环境参数
    local pm2_env=""
    case "$ENV" in
        production)
            pm2_env="--env production"
            ;;
        test)
            pm2_env="--env test"
            ;;
        *)
            pm2_env=""
            ;;
    esac
    
    # 检查是否已有运行的实例
    if pm2 list | grep -q "moonshot-backend"; then
        print_info "重启后端服务..."
        if [ -n "$pm2_env" ]; then
            pm2 restart ecosystem.config.js --only moonshot-backend $pm2_env
        else
            pm2 restart moonshot-backend
        fi
    else
        print_info "启动后端服务..."
        pm2 start ecosystem.config.js $pm2_env --only moonshot-backend
    fi
    
    # 保存 PM2 进程列表
    pm2 save
    
    print_success "后端服务已启动"
}

# 启动前端开发服务器
start_frontend_dev() {
    print_info "启动前端开发服务器..."
    cd "$FRONTEND_DIR"
    
    # 检查是否已有前端进程在运行
    if pm2 list | grep -q "moonshot-frontend"; then
        print_info "重启前端服务..."
        pm2 restart moonshot-frontend
    else
        print_info "启动前端服务..."
        pm2 start npm --name "moonshot-frontend" -- run dev
    fi
    
    pm2 save
    print_success "前端开发服务器已启动"
}

# 启动所有服务
start_service() {
    setup_logs
    setup_env_file
    
    start_backend
    
    # 开发/测试环境启动前端开发服务器
    if [ "$ENV" != "production" ]; then
        start_frontend_dev
    fi
    
    show_access_info
}

# 显示访问信息
show_access_info() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  服务已启动！环境: $ENV${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    
    if [ "$ENV" = "production" ]; then
        echo -e "  ${BLUE}后端 API:${NC}  http://localhost:$BACKEND_PORT"
        echo -e "  ${BLUE}前端静态:${NC}  $FRONTEND_DIR/dist"
        echo ""
        echo -e "  ${YELLOW}生产环境需要配置 Nginx 来服务前端静态文件${NC}"
        echo -e "  ${YELLOW}参考: nginx/moonshot-library.conf${NC}"
    else
        echo -e "  ${BLUE}前端访问:${NC}  ${MAGENTA}http://localhost:$FRONTEND_PORT${NC}"
        echo -e "  ${BLUE}后端 API:${NC}  http://localhost:$BACKEND_PORT"
        echo -e "  ${BLUE}API 文档:${NC}  http://localhost:$BACKEND_PORT/api-docs"
    fi
    
    echo ""
    echo -e "  ${CYAN}常用命令:${NC}"
    echo "    pm2 list                 # 查看进程状态"
    echo "    pm2 logs                 # 查看所有日志"
    echo "    pm2 logs moonshot-backend   # 后端日志"
    echo "    pm2 logs moonshot-frontend  # 前端日志"
    echo "    ./deploy.sh stop         # 停止所有服务"
    echo ""
}

# 停止服务
stop_service() {
    print_info "停止所有服务..."
    pm2 stop moonshot-backend 2>/dev/null || true
    pm2 stop moonshot-frontend 2>/dev/null || true
    print_success "服务已停止"
}

# 删除服务
delete_service() {
    print_info "删除所有服务..."
    pm2 delete moonshot-backend 2>/dev/null || true
    pm2 delete moonshot-frontend 2>/dev/null || true
    pm2 save
    print_success "服务已删除"
}

# 显示状态
show_status() {
    print_info "服务状态:"
    pm2 list
    echo ""
    show_access_info
}

# 显示帮助
show_help() {
    echo ""
    echo "Moonshot Library 部署脚本"
    echo ""
    echo "用法: $0 [命令] [环境选项]"
    echo ""
    echo "命令:"
    echo "  install     安装依赖"
    echo "  build       构建前端和后端"
    echo "  init-db     初始化数据库"
    echo "  start       启动服务（后端 + 前端开发服务器）"
    echo "  stop        停止所有服务"
    echo "  restart     重启所有服务"
    echo "  delete      删除所有 PM2 服务"
    echo "  status      查看服务状态和访问地址"
    echo "  logs        查看日志"
    echo "  deploy      完整部署（安装 + 构建 + 初始化 + 启动）"
    echo "  help        显示此帮助信息"
    echo ""
    echo "环境选项:"
    echo "  --dev, --development   开发环境（默认）"
    echo "  --test                 测试环境（后端端口 3001）"
    echo "  --prod, --production   生产环境（仅启动后端）"
    echo ""
    echo "示例:"
    echo "  $0 deploy              # 开发环境完整部署"
    echo "  $0 deploy --prod       # 生产环境完整部署"
    echo "  $0 start               # 启动开发环境"
    echo "  $0 status              # 查看状态和访问地址"
    echo ""
    echo "端口配置:"
    echo "  前端开发服务器: $FRONTEND_PORT"
    echo "  后端 API:       $BACKEND_PORT（测试环境 3001）"
    echo ""
    echo "环境配置文件:"
    echo "  backend/.env.development    # 后端开发环境"
    echo "  backend/.env.production     # 后端生产环境"
    echo "  frontend/.env.development   # 前端开发环境"
    echo "  frontend/.env.production    # 前端生产环境"
    echo ""
}

# 查看日志
show_logs() {
    pm2 logs
}

# 完整部署
full_deploy() {
    print_env "开始完整部署..."
    echo ""
    
    check_requirements
    install_dependencies
    build_project
    init_database
    setup_logs
    start_service
}

# 解析所有参数
for arg in "$@"; do
    parse_env "$arg"
done

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
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        sleep 1
        start_service
        ;;
    delete)
        delete_service
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
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
