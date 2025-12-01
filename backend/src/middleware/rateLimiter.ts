import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      windowMs: options.windowMs ?? 15 * 60 * 1000, // 15 minutes
      max: options.max ?? 100,
      message: options.message ?? 'Too many requests, please try again later',
      skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
      skipFailedRequests: options.skipFailedRequests ?? false,
      keyGenerator: options.keyGenerator ?? ((req: Request) => req.ip || 'unknown')
    };
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.options.keyGenerator!(req);
      const now = Date.now();
      const resetTime = now + this.options.windowMs;

      const current = this.requests.get(key);

      if (!current || now > current.resetTime) {
        this.requests.set(key, { count: 1, resetTime });
        return next();
      }

      current.count++;

      if (current.count > this.options.max!) {
        const retryAfter = Math.ceil((current.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        res.setHeader('X-RateLimit-Limit', this.options.max!);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());

        const response: ApiResponse = {
          success: false,
          message: this.options.message!
        };

        return res.status(429).json(response);
      }

      res.setHeader('X-RateLimit-Limit', this.options.max!);
      res.setHeader('X-RateLimit-Remaining', this.options.max! - current.count);
      res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());

      // 根据配置决定是否跳过成功或失败的请求计数
      const originalSend = res.send;
      const that = this;
      res.send = function(body) {
        const shouldSkip = 
          (res.statusCode < 400 && that.options.skipSuccessfulRequests) ||
          (res.statusCode >= 400 && that.options.skipFailedRequests);

        if (!shouldSkip) {
          that.requests.set(key, current);
        }

        return originalSend.call(res, body);
      };

      next();
    };
  }

  public reset(key?: string) {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
};

// 预定义的限流配置
export const rateLimiters = {
  // 通用限流
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please try again later'
  }),

  // 认证相关限流
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true
  }),

  // 严格限流
  strict: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many requests, please slow down'
  }),

  // API 限流
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: 'API rate limit exceeded'
  })
};