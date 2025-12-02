import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getAllUsers as getAllUsersModel, getUserById as getUserByIdModel, updateUser as updateUserModel, getUsersByRole as getUsersByRoleModel } from '../models/user';
import { ApiResponse } from '../types';
import { AppError, ValidationError, NotFoundError } from '../middleware/errorHandler';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const users = await getAllUsersModel(limit, offset);

    const response: ApiResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          page,
          limit,
          total: users.length
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

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('User ID is required');
    }
    const user = await getUserByIdModel(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const response: ApiResponse = {
      success: true,
      message: 'User retrieved successfully',
      data: { user }
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

export const updateUser = async (req: Request, res: Response): Promise<void> => {
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
    if (!id) {
      throw new ValidationError('User ID is required');
    }
    const updates = req.body;

    const existingUser = await getUserByIdModel(id);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const user = await updateUserModel(id, updates);

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: { user }
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

export const getUsersByRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.params;
    if (!role) {
      throw new ValidationError('Role is required');
    }
    const users = await getUsersByRoleModel(role);

    const response: ApiResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: { users }
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