# 多阶段构建Dockerfile - 前端Vue项目

# 构建参数
ARG NODE_IMAGE=node:20-alpine
ARG NGINX_IMAGE=nginx:alpine
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG HTTP_PROXY=
ARG HTTPS_PROXY=

# 第一阶段：构建阶段
FROM ${NODE_IMAGE} AS build

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
ENV NODE_OPTIONS=--max-old-space-size=4096 --dns-timeout=120000 --connect-timeout=120000 --http-timeout=120000

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
COPY . ./

# 构建项目
RUN echo "开始构建前端项目..." && \
    npm run build -- --progress=false --loglevel=warn || (echo "构建失败，显示更多错误信息..." && npm run build --verbose)

# 第二阶段：运行阶段
FROM ${NGINX_IMAGE}

# 设置nginx优化参数
RUN mkdir -p /etc/nginx/conf.d

# 优化nginx全局配置 - 超简化版本
RUN printf 'worker_processes auto;\nuser nginx;\npid /var/run/nginx.pid;\n\nevents {\n    worker_connections 1024;\n}\n\nhttp {\n    include /etc/nginx/mime.types;\n    default_type application/octet-stream;\n    sendfile on;\n    keepalive_timeout 65;\n    include /etc/nginx/conf.d/*.conf;\n}' > /etc/nginx/nginx.conf

# 复制构建产物到nginx
COPY --from=build /app/dist /usr/share/nginx/html

# 创建SSL证书目录
RUN mkdir -p /etc/nginx/ssl

# 复制项目中的nginx配置文件，替换Dockerfile中动态生成的配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 跳过构建时的nginx配置验证（backend主机名在构建阶段不可用）
RUN echo "跳过构建时的nginx配置验证..."

# 暴露端口
EXPOSE 80 443

# 启动nginx，添加详细日志
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "[$(date)] 启动Nginx服务器..."' >> /start.sh && \
    echo 'echo "服务器将在80和443端口启动"' >> /start.sh && \
    echo 'nginx -t && nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]