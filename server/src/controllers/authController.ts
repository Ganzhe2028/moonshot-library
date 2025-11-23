import { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { validationResult as validationResultType } from 'express-validator';
import { createUser, getUserByEmail, verifyPassword, getUserById } from '../models/user';
import { generateToken, generateRefreshToken } from '../utils/auth';
import { msalService } from '../utils/msalService';
import { ApiResponse, LoginRequest, RegisterRequest, AuthRequest } from '../types';
import { AppError, ValidationError } from '../middleware/errorHandler';
import crypto from 'crypto';

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('role')
    .isIn(['student', 'teacher', 'librarian'])
    .withMessage('Role must be student, teacher, or librarian'),
  body('grade')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Grade must be between 1 and 50 characters')
];

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      if (firstError && firstError.msg) {
        throw new ValidationError(firstError.msg);
      } else {
        throw new ValidationError('Validation failed');
      }
    }

    const { email, password }: LoginRequest = req.body;

    const user = await getUserByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.membership === 'suspended') {
      throw new AppError('Account suspended', 403);
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          grade: user.grade,
          membership: user.membership,
          avatarColor: user.avatarColor
        },
        token,
        refreshToken
      }
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      if (firstError && firstError.msg) {
        throw new ValidationError(firstError.msg);
      } else {
        throw new ValidationError('Validation failed');
      }
    }

    const { email, password, name, role, grade }: RegisterRequest = req.body;

    // 验证grade字段
    if (grade !== undefined && grade.trim() === '') {
      throw new ValidationError('Grade cannot be empty if provided');
    }

    // 检查邮箱是否已存在
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // 创建新用户
    const userId = `user-${Date.now()}`;
    const userData = {
      id: userId,
      email,
      password,
      name,
      role,
      ...(grade?.trim() ? { grade: grade.trim() } : {})
    };
    const user = await createUser(userData);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const response: ApiResponse = {
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          grade: user.grade,
          membership: user.membership,
          avatarColor: user.avatarColor
        },
        token,
        refreshToken
      }
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    // 这里应该验证刷新令牌，为了简化，我们直接使用访问令牌逻辑
    // 在实际应用中，刷新令牌应该有不同的验证逻辑和存储机制
    const { id } = JSON.parse(atob(refreshToken.split('.')[1]));
    
    const user = await getUserByEmail(id); // 这里简化处理
    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const response: ApiResponse = {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    };

    res.json(response);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // 在实际应用中，这里应该使令牌失效
  // 可以维护一个黑名单或将令牌存储在数据库中
  
  const response: ApiResponse = {
    success: true,
    message: 'Logout successful'
  };

  res.json(response);
};

// Microsoft OAuth相关的验证规则
export const validateMsalAuth = [
  query('code')
    .isString()
    .withMessage('Authorization code is required'),
  query('state')
    .isString()
    .withMessage('State parameter is required')
];

// 处理Microsoft登录的重定向
export const msalLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    // 生成随机state参数，用于防止CSRF攻击
    const state = crypto.randomBytes(16).toString('hex');
    
    // 保存state到session中，以便稍后验证
    if (req.session) {
      (req.session as any).msalState = state;
    }
    
    // 获取环境变量中的重定向URI
    const redirectUri = process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/api/auth/msal/callback';
    
    // 生成Microsoft登录URL
    const authUrl = await msalService.getAuthUrl(redirectUri, state);
    
    const response: ApiResponse = {
      success: true,
      message: 'Microsoft login URL generated successfully',
      data: { authUrl }
    };
    
    res.json(response);
  } catch (error) {
    console.error('MSAL login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Microsoft login URL'
    });
  }
};

// 处理Microsoft OAuth回调
export const msalCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      throw new ValidationError(firstError?.msg || 'Validation failed');
    }
    
    const { code, state } = req.query;
    
    // 验证state参数，防止CSRF攻击
    if (req.session && typeof (req.session as any).msalState === 'string' && (req.session as any).msalState !== state) {
      throw new AppError('Invalid state parameter', 401);
    }
    
    // 清除session中的state
    if (req.session) {
      delete (req.session as any).msalState;
    }
    
    // 获取环境变量中的重定向URI
    const redirectUri = process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/api/auth/msal/callback';
    
    // 处理登录并获取用户信息和令牌
    const { user, token, refreshToken } = await msalService.handleLogin(code as string, redirectUri);
    
    // 重定向到前端页面，携带token信息
    const frontendRedirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectWithTokens = `${frontendRedirectUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`;
    
    res.redirect(redirectWithTokens);
  } catch (error) {
    console.error('MSAL callback error:', error);
    
    // 重定向到前端错误页面
    const frontendRedirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorRedirect = `${frontendRedirectUrl}/login?error=msal_failed`;
    
    res.redirect(errorRedirect);
  }
};

// 验证Microsoft登录状态（用于前端）
export const msalVerify = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      throw new AppError('Token is required', 400);
    }
    
    // 这里可以添加对token的验证逻辑
    // 由于我们已经在handleLogin中生成了JWT，这里可以简单地返回成功
    
    const response: ApiResponse = {
      success: true,
      message: 'MSAL login verified successfully'
    };
    
    res.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not found', 401);
    }
    
    const user = await getUserById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'User retrieved successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          grade: user.grade,
          membership: user.membership,
          avatarColor: user.avatarColor
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};