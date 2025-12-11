import { Response } from 'express';
import { validationResult } from 'express-validator';

import { ApiResponse, AuthRequest } from '../types';
import { AppError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { getUserById } from '../models/user';
import { getCreditByUserId, updateCredit } from '../models/credit';

export const getUserCredit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('User ID is required');
    }

    const user = await getUserById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const credit = await getCreditByUserId(id);

    const response: ApiResponse = {
      success: true,
      message: 'Credit retrieved successfully',
      data: { credit }
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

export const updateUserCredit = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    if (!id) throw new ValidationError('User ID is required');

    const user = await getUserById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { score, remarks } = req.body as {
      score?: number;
      remarks?: string;
    };

    // ensure credit exists
    await getCreditByUserId(id);
    const credit = await updateCredit(id, { score, remarks });

    const response: ApiResponse = {
      success: true,
      message: 'Credit updated successfully',
      data: { credit }
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
