import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import session from 'express-session';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import borrowingRoutes from './routes/borrowings';
import userRoutes from './routes/users';
import { initDatabase } from './models/database';
import { ensureDemoAccounts } from './scripts/seedData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Moonshot Library System API',
      version: '1.0.0',
      description: '校园图书馆管理系统的API文档',
      contact: {
        name: 'Moonshot Library Team',
        email: 'support@moonshot-library.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: '开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/server.ts'] // 扫描路由文件中的注释
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const startServer = async () => {
  try {
    await initDatabase();
    await ensureDemoAccounts();

    app.listen(PORT, () => {
      console.log(`🚀 Moonshot Library Server running on port ${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
};

// 安全中间件
app.use(helmet());

// CORS 配置 - 支持多个开发端口
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:8080'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // 开发环境下，允许所有 localhost 请求
    if (!origin ||
        origin.startsWith('http://localhost') ||
        process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // 检查 origin 是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'production') {
      // 生产环境下，从环境变量读取允许的域名列表
      const allowedDomains = process.env.ALLOWED_DOMAINS ?
        process.env.ALLOWED_DOMAINS.split(',') : [];

      if (allowedDomains.some(domain => origin.includes(domain))) {
        callback(null, true);
      } else {
        // 生产环境默认允许来自服务器自身的请求
        callback(null, true);
      }
    } else {
      // 仅在严格模式下拒绝请求
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // 支持预检请求缓存
  maxAge: 86400
}));

// 信任代理设置，确保正确处理 X-Forwarded-* 头
app.set('trust proxy', true);

// 会话中间件配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 3600000 // 1小时
  }
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 15 分钟内最多 100 个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 日志中间件
app.use(morgan('combined'));

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务器是否正常运行
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 服务器正常运行
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-12-01T12:00:00.000Z
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *       500:
 *         description: 服务器错误
 */
// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Moonshot Library API Documentation'
}));

// API文档JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/users', userRoutes);

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
startServer();

export default app;
