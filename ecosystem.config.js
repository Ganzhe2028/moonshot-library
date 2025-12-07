/**
 * PM2 配置文件
 * 用于部署 Moonshot Library 服务
 * 
 * 使用方式：
 *   开发环境: pm2 start ecosystem.config.js
 *   生产环境: pm2 start ecosystem.config.js --env production
 *   测试环境: pm2 start ecosystem.config.js --env test
 * 
 * 端口配置：
 *   前端开发服务器: 5173
 *   后端 API: 3000 (测试环境 3001)
 */

const path = require('path');

module.exports = {
  apps: [
    // 后端服务
    {
      name: 'moonshot-backend',
      script: './dist/server.js',
      // 关键：设置工作目录为 backend，确保数据库路径正确
      cwd: path.join(__dirname, 'backend'),
      instances: 1, // SQLite 单实例运行，避免并发写入问题
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // 默认环境变量（开发环境）
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      
      // 生产环境
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // 测试环境
      env_test: {
        NODE_ENV: 'test',
        PORT: 3001,
      },
      
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: path.join(__dirname, 'logs/backend-error.log'),
      out_file: path.join(__dirname, 'logs/backend-out.log'),
      merge_logs: true,
      
      // 重启策略
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 优雅关闭
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    }
  ],
  
  // 部署配置（可选，用于远程部署）
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/master',
      repo: 'git@github.com:your-org/moonshot-library.git',
      path: '/var/www/moonshot-library',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

