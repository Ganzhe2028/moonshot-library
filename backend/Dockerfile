# 多阶段构建Dockerfile - 后端Express项目

# 构建参数
ARG NODE_IMAGE=node:20-alpine
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG HTTP_PROXY=
ARG HTTPS_PROXY=

# 第一阶段：构建阶段
FROM ${NODE_IMAGE} AS build

# 安装Python和构建工具（用于编译sqlite3等原生模块）
RUN apk update && \
    apk add --no-cache python3 py3-pip make g++ && \
    ln -sf python3 /usr/bin/python

# 设置构建环境变量
ARG NPM_REGISTRY
ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV NODE_ENV=development
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_CACHE=/root/.npm
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NODE_OPTIONS=--max-old-space-size=4096

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖 - 使用国内镜像加速和优化参数
RUN echo "使用NPM镜像: ${NPM_REGISTRY}" && \
    npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm cache clean --force && \
    npm install --registry=${NPM_REGISTRY} --prefer-offline --no-audit --legacy-peer-deps --progress=false --loglevel=warn --fetch-retries 5 --fetch-retry-factor 2 --fetch-retry-mintimeout 10000 --fetch-retry-maxtimeout 120000

# 复制所有源代码
COPY . .

# 编译TypeScript
RUN echo "开始编译TypeScript..." && \
    npm run build -- --skipLibCheck --incremental false || (echo "编译失败，显示更多错误信息..." && npm run build --verbose)

# 第二阶段：运行阶段
FROM ${NODE_IMAGE}

# 设置工作目录
WORKDIR /app

# 创建数据库目录并设置权限
RUN mkdir -p /app/database && chmod 777 /app/database

# 复制编译后的代码和package.json
COPY --from=build /app/dist ./dist
COPY package*.json ./

# 仅安装生产依赖 - 使用国内镜像加速和优化参数
# 移除--only=production选项以确保所有必要依赖都被安装
RUN echo "安装生产依赖..." && \
    npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm cache clean --force && \
    npm install --registry=${NPM_REGISTRY} --prefer-offline --no-audit --legacy-peer-deps --progress=false --loglevel=warn --fetch-retries 5 --fetch-retry-factor 2

# 复制数据库初始化脚本
COPY ./src/scripts ./src/scripts

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 删除之前可能创建的重复启动脚本
RUN rm -f /start.sh || true

# 创建增强版启动脚本，增加错误处理和调试信息
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "[$(date)] 开始启动后端服务"' >> /app/start.sh && \
    echo 'export NODE_ENV=production' >> /app/start.sh && \
    echo 'export NODE_OPTIONS="--max-old-space-size=2048"' >> /app/start.sh && \
    echo '# 检查数据库目录是否存在，不存在则创建' >> /app/start.sh && \
    echo 'mkdir -p /app/database' >> /app/start.sh && \
    echo 'echo "启动服务器..."' >> /app/start.sh && \
    echo 'echo "服务将在${PORT}端口启动"' >> /app/start.sh && \
    echo 'node dist/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# 启动脚本
CMD ["/app/start.sh"]