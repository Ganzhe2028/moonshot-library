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

# 配置Nginx代理 - 支持HTTPS
RUN mkdir -p /etc/nginx/conf.d && \
    # HTTP 到 HTTPS 重定向配置
    echo '# HTTP 到 HTTPS 重定向配置' > /etc/nginx/conf.d/default.conf && \
    echo 'server {' >> /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    listen [::]:80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    ' >> /etc/nginx/conf.d/default.conf && \
    echo '    # 将所有HTTP请求重定向到HTTPS' >> /etc/nginx/conf.d/default.conf && \
    echo '    return 301 https://$host$request_uri;' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '# HTTPS 服务器配置' >> /etc/nginx/conf.d/default.conf && \
    echo 'server {' >> /etc/nginx/conf.d/default.conf && \
    echo '    listen 443 ssl;' >> /etc/nginx/conf.d/default.conf && \
    echo '    listen [::]:443 ssl;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # SSL证书配置' >> /etc/nginx/conf.d/default.conf && \
    echo '    ssl_certificate /etc/nginx/ssl/cert.pem;' >> /etc/nginx/conf.d/default.conf && \
    echo '    ssl_certificate_key /etc/nginx/ssl/key.pem;' >> /etc/nginx/conf.d/default.conf && \
    echo '    ' >> /etc/nginx/conf.d/default.conf && \
    echo '    # SSL优化配置' >> /etc/nginx/conf.d/default.conf && \
    echo '    ssl_protocols TLSv1.2 TLSv1.3;' >> /etc/nginx/conf.d/default.conf && \
    echo '    ssl_prefer_server_ciphers on;' >> /etc/nginx/conf.d/default.conf && \
    echo '    ssl_ciphers "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256";' >> /etc/nginx/conf.d/default.conf && \
    echo '    ssl_session_timeout 1d;' >> /etc/nginx/conf.d/default.conf && \
    echo '    ssl_session_cache shared:SSL:10m;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # 增加超时设置' >> /etc/nginx/conf.d/default.conf && \
    echo '    proxy_connect_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '    proxy_send_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '    proxy_read_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '    client_body_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '    client_header_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '    send_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '    resolver_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # 增加缓冲区和大小限制' >> /etc/nginx/conf.d/default.conf && \
    echo '    client_max_body_size 20m;' >> /etc/nginx/conf.d/default.conf && \
    echo '    client_body_buffer_size 128k;' >> /etc/nginx/conf.d/default.conf && \
    echo '    proxy_buffers 16 64k;' >> /etc/nginx/conf.d/default.conf && \
    echo '    proxy_buffer_size 128k;' >> /etc/nginx/conf.d/default.conf && \
    echo '    proxy_busy_buffers_size 256k;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # 启用TCP_NODELAY和keepalive' >> /etc/nginx/conf.d/default.conf && \
    echo '    tcp_nodelay on;' >> /etc/nginx/conf.d/default.conf && \
    echo '    tcp_nopush on;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # API代理配置' >> /etc/nginx/conf.d/default.conf && \
    echo '    location /api/ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_pass http://backend:3000/api/;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # 根目录' >> /etc/nginx/conf.d/default.conf && \
    echo '    root   /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index  index.html index.htm;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # 前端路由支持' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # 静态资源缓存' >> /etc/nginx/conf.d/default.conf && \
    echo '    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|eot)$ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 30d;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "public, no-transform";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # 错误页面' >> /etc/nginx/conf.d/default.conf && \
    echo '    error_page  404              /404.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    error_page   500 502 503 504  /50x.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    location = /50x.html {' >> /etc/nginx/conf.d/default.conf && \
    echo '        root   /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

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