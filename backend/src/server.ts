import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import borrowingRoutes from './routes/borrowings';
import userRoutes from './routes/users';
import settingsRoutes from './routes/settings';
import { initDatabase } from './models/database';
import { ensureDemoAccounts } from './scripts/seedData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const normalizeOrigin = (origin: string): string => origin.replace(/\/$/, '');

const parseEnvInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const allowedOrigins = new Set<string>(
  [process.env.FRONTEND_URL].filter(Boolean).map((origin) => normalizeOrigin(origin as string))
);
const allowedDomainSuffixes = (process.env.ALLOWED_DOMAINS || '')
  .split(',')
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

const apiRateLimitWindowMs = parseEnvInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const apiRateLimitMax = parseEnvInt(process.env.RATE_LIMIT_MAX, isProduction ? 5000 : 1000);

const validateRuntimeConfig = (): void => {
  if (!isProduction) {
    return;
  }

  const secrets = [
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { name: 'REFRESH_TOKEN_SECRET', value: process.env.REFRESH_TOKEN_SECRET },
    { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET }
  ];

  const weakSecrets = secrets
    .filter((secret) => !secret.value || secret.value.length < 16 || secret.value.includes('your-'))
    .map((secret) => secret.name);

  if (weakSecrets.length > 0) {
    console.error(`❌ Missing/weak secrets in production: ${weakSecrets.join(', ')}`);
    process.exit(1);
  }

  if (allowedOrigins.size === 0 && allowedDomainSuffixes.length === 0) {
    console.warn('⚠️  No CORS allowlist set in production (FRONTEND_URL or ALLOWED_DOMAINS).');
  }
};

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
    validateRuntimeConfig();
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
app.disable('x-powered-by');
app.use(helmet());

// CORS 配置 - 支持多个开发端口
if (!isProduction) {
  [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:8080'
  ].forEach((origin) => allowedOrigins.add(origin));
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (!isProduction) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    if (allowedDomainSuffixes.length > 0) {
      try {
        const { hostname } = new URL(normalizedOrigin);
        const hostnameLower = hostname.toLowerCase();
        const isAllowedDomain = allowedDomainSuffixes.some(
          (domain) => hostnameLower === domain || hostnameLower.endsWith(`.${domain}`)
        );

        if (isAllowedDomain) {
          return callback(null, true);
        }
      } catch {
        // Invalid origin; reject below.
      }
    }

    return callback(new Error('Not allowed by CORS'));
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
  windowMs: apiRateLimitWindowMs, // 15 分钟
  max: apiRateLimitMax, // 限制每个 IP 在窗口内的请求数
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false
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

// 静态文件服务 - 提供上传的封面图片
app.use('/api/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
startServer();

export default app;
