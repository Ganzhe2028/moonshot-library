import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiResponse } from '../types';
import { ValidationError } from './errorHandler';

export const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

export const validateUserId = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('User ID is required')
];

export const validateBookId = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Book ID is required')
];

export const validateBorrowingId = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Borrowing record ID is required')
];

export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'librarian', 'teacher', 'student'])
    .withMessage('Role must be one of: admin, librarian, teacher, student')
];

export const validateUserCreate = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('role')
    .isIn(['admin', 'librarian', 'teacher', 'student'])
    .withMessage('Role must be one of: admin, librarian, teacher, student')
];

export const validateUserRole = [
  body('role')
    .isIn(['admin', 'librarian', 'teacher', 'student'])
    .withMessage('Role must be one of: admin, librarian, teacher, student')
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    } as ApiResponse);
    return;
  }
  next();
};

export const validateRequest = (validators: any[]) => {
  return [...validators, handleValidationErrors];
};