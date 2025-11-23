import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/auth';
import { getUserById } from '../models/user';
import { UnauthorizedError, ForbiddenError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.id);

    if (!user) {
      console.error(`[Auth] User not found with ID: ${decoded.id}`);
      throw new UnauthorizedError('User not found');
    }

    if (user.membership === 'suspended') {
      throw new UnauthorizedError('Account suspended');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid token'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.id);

    if (user && user.membership === 'active') {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    }

    next();
  } catch (error) {
    // 可选认证失败时不阻止请求
    next();
  }
};