#!/bin/bash

# Moonshot Library 线上部署脚本
# 此脚本用于生产环境部署，包含安全配置和数据库备份功能

set -e

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN} Moonshot Library 线上部署工具 ${NC}"
echo -e "${GREEN}=========================================${NC}"

# 检查Docker和Docker Compose是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: Docker 未安装，请先安装Docker${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}错误: Docker Compose 未安装，请先安装Docker Compose${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker和Docker Compose检查通过${NC}"
}

# 设置JWT密钥
set_jwt_secret() {
    echo -e "\n${YELLOW}请配置JWT密钥（生产环境请使用强密钥）${NC}"
    read -p "请输入JWT密钥（默认将生成随机密钥）: " jwt_secret
    
    # 如果用户没有输入密钥，生成一个随机密钥
    if [ -z "$jwt_secret" ]; then
        jwt_secret=$(openssl rand -hex 32)
        echo -e "${YELLOW}已生成随机JWT密钥: ${jwt_secret}${NC}"
        echo -e "${YELLOW}请务必保存此密钥，后续重启服务需要使用${NC}"
    fi
    
    # 设置环境变量
    export JWT_SECRET=$jwt_secret
    echo -e "${GREEN}✅ JWT密钥已设置${NC}"
}

# 备份数据库
backup_database() {
    if [ -d "./server/database" ] && [ -f "./server/database/library.db" ]; then
        echo -e "\n${YELLOW}正在备份数据库...${NC}"
        BACKUP_DIR="./server/database/backups"
        mkdir -p $BACKUP_DIR
        
        BACKUP_FILE="$BACKUP_DIR/library_db_backup_$(date +%Y%m%d_%H%M%S).db"
        cp ./server/database/library.db $BACKUP_FILE
        
        echo -e "${GREEN}✅ 数据库已备份到: $BACKUP_FILE${NC}"
        
        # 清理30天前的备份文件
        find $BACKUP_DIR -name "library_db_backup_*.db" -mtime +30 -delete
        echo -e "${GREEN}✅ 已清理30天前的备份文件${NC}"
    else
        echo -e "${YELLOW}未找到数据库文件，跳过备份${NC}"
    fi
}

# 创建数据库目录 - Linux权限增强版
create_database_directory() {
    if [ ! -d "./server/database" ]; then
        echo -e "\n${YELLOW}创建数据库目录...${NC}"
        mkdir -p ./server/database
        # Linux环境下设置正确的权限
        chmod -R 755 ./server/database
        # 如果在Linux系统上运行，尝试设置正确的用户组
        if [ "$(uname)" = "Linux" ]; then
            # 尝试获取docker组ID，如果存在则使用
            if getent group docker > /dev/null; then
                DOCKER_GID=$(getent group docker | cut -d: -f3)
                chown -R :$DOCKER_GID ./server/database 2>/dev/null || true
            fi
        fi
        echo -e "${GREEN}✅ 数据库目录已创建并设置正确权限${NC}"
    else
        # 确保现有目录权限正确
        chmod -R 755 ./server/database
        echo -e "${GREEN}✅ 数据库目录权限已确认${NC}"
    fi
}

# 停止现有服务
stop_services() {
    if [ -f "docker-compose.yml" ]; then
        echo -e "\n${YELLOW}停止现有服务（如果存在）...${NC}"
        docker-compose down || true
    fi
}

# 构建并启动服务 - Linux优化版
deploy_services() {
    echo -e "\n${YELLOW}开始构建和启动服务...${NC}"
    echo -e "${YELLOW}注意：首次构建可能需要较长时间，请耐心等待。${NC}"
    
    # 添加Docker镜像源配置，使用国内镜像源加速
    echo -e "${GREEN}配置Docker镜像源加速...${NC}"
    export DOCKER_OPTS="--registry-mirror=https://registry.docker-cn.com,https://mirror.baidubce.com,https://docker.mirrors.ustc.edu.cn"
    
    # Linux环境检测和配置
    if [ "$(uname)" = "Linux" ]; then
        echo -e "${YELLOW}检测到Linux环境，应用Linux特定优化...${NC}"
        # 确保docker守护进程正在运行
        if ! docker info > /dev/null 2>&1; then
            echo -e "${YELLOW}Docker服务未运行，尝试启动...${NC}"
            sudo systemctl start docker || true
            sleep 5
        fi
        
        # 检查并加载必要的内核模块
        echo -e "${GREEN}检查Linux内核模块...${NC}"
        sudo modprobe br_netfilter 2>/dev/null || true
        sudo sysctl -w net.bridge.bridge-nf-call-iptables=1 2>/dev/null || true
    fi
    
    # 清理旧的构建缓存
    echo -e "${GREEN}清理旧的构建缓存...${NC}"
    docker-compose down -v --remove-orphans || true
    
    # 设置生产环境变量
    export NODE_ENV=production
    export NODE_IMAGE=node:20-alpine
    export LOG_LEVEL=warn
    export HEALTH_CHECK_PATH=/health
    export ALLOWED_DOMAINS=${ALLOWED_DOMAINS:-}
    export TRUST_PROXY=1
    
    # 优化构建参数 - Linux特化
    export COMPOSE_DOCKER_CLI_BUILD=0
    export DOCKER_BUILDKIT=0
    export COMPOSE_HTTP_TIMEOUT=1200
    
    # 重新构建和启动服务
    echo -e "${GREEN}重新构建和启动服务...${NC}"
    docker-compose up --build -d
    
    echo -e "\n${GREEN}✅ 服务正在启动！${NC}"
    echo -e "${YELLOW}请等待几分钟让服务完全就绪。${NC}"
}

# 检查服务状态
check_services() {
    # 设置环境变量以确保正确检查服务
    export NODE_ENV=production
    export NODE_IMAGE=node:20-alpine
    export LOG_LEVEL=warn
    export HEALTH_CHECK_PATH=/health
    
    echo -e "\n${YELLOW}等待服务启动并检查状态...${NC}"
    sleep 20
    
    echo -e "\n${GREEN}=========================================${NC}"
    echo -e "${GREEN}服务状态：${NC}"
    docker-compose ps
    
    # 检查服务健康状态
    echo -e "\n${YELLOW}检查服务健康状态...${NC}"
    local backend_healthy=$(docker inspect --format='{{.State.Health.Status}}' moonshot-library-backend 2>/dev/null || echo "unhealthy")
    local frontend_healthy=$(docker inspect --format='{{.State.Health.Status}}' moonshot-library-frontend 2>/dev/null || echo "unhealthy")
    
    echo -e "后端服务状态: $backend_healthy"
    echo -e "前端服务状态: $frontend_healthy"
    
    if [ "$backend_healthy" = "healthy" ] && [ "$frontend_healthy" = "healthy" ]; then
        echo -e "\n${GREEN}✅ 所有服务部署成功且健康！${NC}"
        echo -e "${YELLOW}前端访问地址: http://localhost${NC}"
        echo -e "${YELLOW}后端API地址: http://localhost:3000${NC}"
    else
        echo -e "\n${RED}警告: 部分服务可能存在问题，请检查日志${NC}"
        echo -e "${YELLOW}查看后端日志: docker logs moonshot-library-backend${NC}"
        echo -e "${YELLOW}查看前端日志: docker logs moonshot-library-frontend${NC}"
    fi
}

# 显示部署完成信息
show_completion_message() {
    echo -e "\n${GREEN}=========================================${NC}"
    echo -e "${GREEN}🚀 线上部署操作完成！${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${YELLOW}生产环境维护建议：${NC}"
    echo -e "  1. 定期备份数据库: ./deploy-docker-prod.sh backup"
    echo -e "  2. 重启服务: ./deploy-docker-prod.sh restart"
    echo -e "  3. 查看日志: ./deploy-docker-prod.sh logs"
    echo -e "  4. 停止服务: ./deploy-docker-prod.sh stop"
}

# 备份命令
backup_command() {
    backup_database
    exit 0
}

# 重启命令
restart_command() {
    # 设置环境变量以确保正确重启服务
    export NODE_ENV=production
    export NODE_IMAGE=node:20-alpine
    export LOG_LEVEL=warn
    export HEALTH_CHECK_PATH=/health
    
    echo -e "${YELLOW}重启服务...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ 服务已重启${NC}"
    exit 0
}

# 查看日志命令
logs_command() {
    # 设置环境变量以确保正确查看服务日志
    export NODE_ENV=production
    export NODE_IMAGE=node:20-alpine
    export LOG_LEVEL=warn
    export HEALTH_CHECK_PATH=/health
    
    echo -e "${YELLOW}查看服务日志...${NC}"
    docker-compose logs -f
    exit 0
}

# 停止命令
stop_command() {
    # 设置环境变量以确保正确停止服务
    export NODE_ENV=production
    export NODE_IMAGE=node:20-alpine
    export LOG_LEVEL=warn
    export HEALTH_CHECK_PATH=/health
    
    echo -e "${YELLOW}停止服务...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ 服务已停止${NC}"
    exit 0
}

# 主部署流程
main() {
    # 处理命令行参数
    if [ $# -gt 0 ]; then
        case "$1" in
            backup)
                backup_command
                ;;
            restart)
                restart_command
                ;;
            logs)
                logs_command
                ;;
            stop)
                stop_command
                ;;
            *)
                echo -e "${RED}未知命令: $1${NC}"
                echo -e "用法: $0 [backup|restart|logs|stop]"
                exit 1
                ;;
        esac
    fi
    
    # 执行主部署流程
    check_docker
    set_jwt_secret
    backup_database
    create_database_directory
    stop_services
    deploy_services
    check_services
    show_completion_message
}

# 执行主函数
main "$@"
