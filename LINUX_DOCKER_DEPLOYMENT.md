# Moonshot Library 系统 Linux Docker 部署文档

> 注意：本文档已根据最新的部署脚本和实践经验进行了优化。

## 目录

1. [环境要求](#环境要求)
2. [Docker 和 Docker Compose 安装](#docker-和-docker-compose-安装)
3. [项目配置](#项目配置)
4. [部署步骤](#部署步骤)
5. [验证部署](#验证部署)
6. [常见问题和故障排除](#常见问题和故障排除)
7. [维护命令](#维护命令)

## 环境要求

- Linux 系统 (推荐 Ubuntu 20.04 LTS 或 CentOS 7/8)
- 至少 2GB RAM（推荐 4GB 及以上）
- 至少 10GB 磁盘空间（建议 20GB 及以上，预留数据库增长空间）
- 网络连接（用于拉取镜像）
- root 或 sudo 权限
- Git（用于获取项目代码，可选）

## Docker 和 Docker Compose 安装

> 注意：建议使用 Docker 20.10+ 和 Docker Compose 1.29.2+ 版本以确保最佳兼容性。

### Ubuntu 系统

```bash
# 更新系统包
apt-get update
apt-get upgrade -y

# 安装必要的依赖
apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# 添加 Docker 源
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# 安装 Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### CentOS 系统

```bash
# 安装必要的依赖
yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 源
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker 服务并设置开机自启
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

# 对于 CentOS 8，可能需要额外配置防火墙规则
sudo firewall-cmd --permanent --zone=public --add-masquerade
sudo firewall-cmd --reload
```

### 配置 Docker 镜像加速（可选）

为了提高镜像拉取速度，建议配置国内镜像源：

```bash
# 创建或编辑 Docker 配置文件
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://mirror.baidubce.com",
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  }
}
EOF

# 重启 Docker 服务
systemctl daemon-reload
systemctl restart docker
```

## 项目配置

### 获取项目代码

```bash
# 克隆项目代码（如果有 Git 仓库）
git clone <项目仓库地址> moonshot-library
cd moonshot-library

# 或者如果已经有项目文件，直接进入项目目录
cd /path/to/moonshot-library
```

### 环境变量配置

我们使用统一的 `docker-compose.yml` 文件，通过环境变量来配置不同环境。您可以创建一个 `.env` 文件来存储这些变量：

```bash
# 创建 .env 文件
cat > .env << EOF
# 基本环境配置
NODE_ENV=production
NODE_IMAGE=node:20-alpine

# 安全配置
JWT_SECRET=your_secure_jwt_secret_key_here

# 日志配置
LOG_LEVEL=warn

# 健康检查配置
HEALTH_CHECK_PATH=/health

# 网络配置
TRUST_PROXY=1

# 允许的域名（如果需要配置CORS）
# ALLOWED_DOMAINS=example.com,your-domain.com

# HTTP代理配置（如需代理）
# HTTP_PROXY=http://your-proxy-server:port
# HTTPS_PROXY=http://your-proxy-server:port
EOF

请务必修改 `JWT_SECRET` 为一个安全的随机密钥。注意：如果您使用部署脚本，它会自动提示您设置JWT密钥或生成随机密钥。

## 部署步骤

### 使用部署脚本（推荐）

项目提供了自动化部署脚本，简化了部署过程：

```bash
# 设置脚本执行权限
chmod +x deploy-docker.sh

# 执行部署脚本
./deploy-docker.sh
```

脚本将：
1. 检查 Docker 和 Docker Compose 是否安装
2. 提示设置 JWT 密钥（可自动生成安全密钥）
3. 备份数据库（如果存在，并自动清理30天前的备份）
4. 创建数据库目录并设置正确的权限
5. 停止现有服务
6. 构建和启动新服务（包含Linux系统特定优化）
7. 配置Docker镜像源加速
8. 检查服务状态和健康度

### 手动部署（可选）

如果您希望手动控制部署过程，可以按照以下步骤操作：

```bash
# 设置环境变量（或使用 .env 文件）
export NODE_ENV=production
export NODE_IMAGE=node:20-alpine
export JWT_SECRET=your_secure_jwt_secret_key_here
export LOG_LEVEL=warn
export HEALTH_CHECK_PATH=/health
export TRUST_PROXY=1

# 创建数据库目录并设置权限
mkdir -p server/database
chmod -R 755 server/database

# Linux 环境下设置用户组（可选但推荐）
if getent group docker > /dev/null; then
    DOCKER_GID=$(getent group docker | cut -d: -f3)
    chown -R :$DOCKER_GID ./server/database 2>/dev/null || true
fi

# 清理旧服务（如果需要）
docker-compose down -v --remove-orphans

# 配置镜像加速（可选）
export DOCKER_OPTS="--registry-mirror=https://registry.docker-cn.com,https://mirror.baidubce.com,https://docker.mirrors.ustc.edu.cn"

# 构建并启动服务
docker-compose up --build -d

# 等待服务启动
sleep 30

# 检查服务状态
docker-compose ps
docker-compose logs
```

## 验证部署

部署完成后，您可以通过以下方式验证服务是否正常运行：

```bash
# 检查服务状态
docker-compose ps

# 检查服务健康状态
docker inspect --format='{{.State.Health.Status}}' moonshot-library-backend
docker inspect --format='{{.State.Health.Status}}' moonshot-library-frontend

# 查看服务日志
docker-compose logs -f

# 测试API连接（可选）
curl -I http://localhost:3000/health

# 检查磁盘空间使用情况
df -h

# 检查内存使用情况
free -h
```

### 访问应用

服务启动成功后，您可以通过以下地址访问：

- 前端应用：http://服务器IP 或 http://服务器域名
- 后端 API：http://服务器IP:3000 或 http://服务器域名:3000

## 常见问题和故障排除

### 问题：Nginx配置验证失败

**可能原因**：
- Docker构建阶段Nginx配置验证无法解析Docker网络中的主机名
- Nginx配置文件格式错误
- Nginx配置中的sed命令语法问题

**解决方案**：
1. **跳过构建时的配置验证**（推荐）：
   ```bash
   # 在Dockerfile中找到并修改nginx验证相关的行，将：
   RUN echo "验证nginx配置..." && nginx -t
   
   # 修改为：
   RUN echo "跳过构建时的nginx配置验证..."
   ```

2. **使用printf替代echo生成配置**：
   当在Dockerfile中使用echo生成多行配置文件时，可能会遇到格式问题。建议使用printf命令：
   ```bash
   # 原方式（可能有问题）：
   RUN echo "worker_processes auto;\nuser nginx;\npid /var/run/nginx.pid;" > /etc/nginx/nginx.conf
   
   # 改进方式：
   RUN printf "worker_processes auto;\nuser nginx;\npid /var/run/nginx.pid;\n" > /etc/nginx/nginx.conf
   ```

3. **使用COPY指令引入配置文件**：
   最可靠的方式是预先创建配置文件，然后使用COPY指令：
   ```bash
   # 在Dockerfile中添加：
   COPY nginx.conf /etc/nginx/nginx.conf
   ```

这是因为在Docker构建阶段，Docker网络还未完全创建，无法解析Docker Compose中定义的服务名称（如`backend`）。这个验证在容器实际运行时会自动进行，因此跳过构建时的验证不会影响服务的正常运行。

修改完成后，重新运行部署脚本即可。

### 问题：服务启动失败

**可能原因**：
- 端口被占用
- 环境变量配置错误
- 资源不足

**解决方案**：
```bash
# 检查端口占用
netstat -tuln | grep 80
netstat -tuln | grep 3000

# 查看详细日志
docker-compose logs

# 检查资源使用情况
free -h
df -h
```

### 问题：数据库连接错误

**可能原因**：
- 数据库目录权限问题
- 数据库文件损坏

**解决方案**：
```bash
# 检查数据库目录权限
ls -la server/database
chmod -R 755 server/database

# 从备份恢复数据库（如果有）
cp server/database/backups/library_db_backup_*.db server/database/library.db
```

### 问题：Docker 镜像拉取超时

**可能原因**：
- 网络问题
- 没有配置镜像加速
- Docker daemon 配置问题

**解决方案**：
```bash
# 配置镜像加速（参考上面的 Docker 配置部分）

# 检查网络连接
ping download.docker.com

# 临时设置镜像源环境变量（针对当前会话有效）
export DOCKER_OPTS="--registry-mirror=https://registry.docker-cn.com,https://mirror.baidubce.com,https://docker.mirrors.ustc.edu.cn"

# 或者使用离线镜像（如果有）
docker load -i moonshot-library-backend.tar
docker load -i moonshot-library-frontend.tar

# 增加 Docker 守护进程超时时间
# 在 /etc/docker/daemon.json 中添加
# {
#   "max-concurrent-downloads": 5,
#   "max-concurrent-uploads": 5,
#   "default-shm-size": "2g"
# }

### 问题：服务健康检查失败

**可能原因**：
- 健康检查路径配置错误
- 服务启动时间过长
- 资源不足导致服务启动失败

**解决方案**：
```bash
# 修改健康检查路径配置
export HEALTH_CHECK_PATH=/api/health

# 重新启动服务
docker-compose up -d

# 增加健康检查超时时间（修改 docker-compose.yml 文件中的 start_period 值）

# 查看详细日志以排查问题
docker-compose logs
```

## 维护命令

部署脚本 `deploy-docker.sh` 提供了以下常用的维护命令，可以简化日常运维工作：

### 备份数据库

```bash
./deploy-docker.sh backup
```

### 重启服务

```bash
./deploy-docker.sh restart
```

### 查看日志

```bash
./deploy-docker.sh logs
```

### 停止服务

```bash
./deploy-docker.sh stop
```

## 安全建议

1. 定期更新 Docker 和 Docker Compose 到最新版本
2. 使用强密码保护 JWT 密钥（部署脚本会自动生成强密钥）
3. 在生产环境中配置 HTTPS（使用 Let's Encrypt 或其他 SSL 证书）
4. 定期备份数据库（脚本提供了自动备份功能）
5. 限制服务器的访问权限和开放端口
6. 考虑使用防火墙规则限制 Docker 容器的网络访问
7. 监控容器日志，及时发现异常行为
8. 定期扫描镜像安全漏洞：
   ```bash
   # 使用 Trivy 扫描镜像漏洞（需要先安装 Trivy）
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image moonshot-library-backend
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image moonshot-library-frontend
   ```

## 性能优化建议

1. 为 Docker 分配足够的资源（至少 2GB RAM 和 10GB 磁盘空间）
2. 使用合适的基础镜像（项目已使用 node:20-alpine 优化镜像大小）
3. 优化应用代码和数据库查询
4. 考虑使用负载均衡（如果需要支持大量用户）
5. 定期清理 Docker 系统资源：
   ```bash
   # 清理悬空镜像
   docker image prune -f
   
   # 清理未使用的容器
   docker container prune -f
   
   # 清理未使用的卷
   docker volume prune -f
   ```
6. 对于生产环境，考虑配置 HTTPS 以提高安全性

---

本文档提供了 Moonshot Library 系统在 Linux 环境下使用 Docker 部署的完整指南。如有任何问题，请参考项目文档或联系技术支持。