import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const validateJsonContent = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      const response: ApiResponse = {
        success: false,
        message: 'Content-Type must be application/json'
      };
      res.status(400).json(response);
      return;
    }
  }
  next();
};

export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  // 如果设置了 API_KEY 环境变量，则需要验证
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid or missing API key'
    };
    res.status(401).json(response);
    return;
  }
  
  next();
};

export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default
  
  if ((req as any).file && (req as any).file.size > maxFileSize) {
    const response: ApiResponse = {
      success: false,
      message: `File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`
    };
    res.status(413).json(response);
    return;
  }
  
  if ((req as any).files) {
    const files = Array.isArray((req as any).files) ? (req as any).files : Object.values((req as any).files).flat();
    
    for (const file of files) {
      if (file.size > maxFileSize) {
        const response: ApiResponse = {
          success: false,
          message: `File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`
        };
        res.status(413).json(response);
        return;
      }
    }
  }
  
  next();
};

export const validatePaginationParams = (req: Request, res: Response, next: NextFunction): void => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  
  if (limit < 1 || limit > 100) {
    const response: ApiResponse = {
      success: false,
      message: 'Limit must be between 1 and 100'
    };
    res.status(400).json(response);
    return;
  }
  
  if (offset < 0) {
    const response: ApiResponse = {
      success: false,
      message: 'Offset must be a non-negative integer'
    };
    res.status(400).json(response);
    return;
  }
  
  req.query.limit = limit.toString();
  req.query.offset = offset.toString();
  
  next();
};