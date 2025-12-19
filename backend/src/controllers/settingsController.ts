import { Response } from 'express';
import { body, validationResult } from 'express-validator';

import { ApiResponse, AuthRequest } from '../types';
import { AppError, ValidationError } from '../middleware/errorHandler';
import { getBorrowingLimit, setBorrowingLimit } from '../models/settings';

export const validateBorrowingLimit = [
  body('maxActiveBorrowings')
    .isInt({ min: 1, max: 50 })
    .withMessage('Max active borrowings must be between 1 and 50')
];

export const getBorrowingLimitSetting = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const maxActiveBorrowings = await getBorrowingLimit();
    const response: ApiResponse = {
      success: true,
      message: 'Borrowing limit retrieved successfully',
      data: { maxActiveBorrowings }
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateBorrowingLimitSetting = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { maxActiveBorrowings } = req.body as { maxActiveBorrowings: number };
    const updatedLimit = await setBorrowingLimit(maxActiveBorrowings);

    const response: ApiResponse = {
      success: true,
      message: 'Borrowing limit updated successfully',
      data: { maxActiveBorrowings: updatedLimit }
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
