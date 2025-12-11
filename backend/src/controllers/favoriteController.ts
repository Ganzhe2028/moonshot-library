import { Response } from 'express';
import { validationResult } from 'express-validator';

import { ApiResponse, AuthRequest } from '../types';
import { AppError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { getUserById } from '../models/user';
import { getBookById } from '../models/book';
import {
  addFavorite,
  getFavoriteByUserAndBook,
  getFavoritesByUser,
  removeFavorite
} from '../models/favorite';

export const getUserFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('User ID is required');
    }

    const user = await getUserById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const favorites = await getFavoritesByUser(id);

    const response: ApiResponse = {
      success: true,
      message: 'Favorites retrieved successfully',
      data: { favorites }
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

export const addUserFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const { bookId } = req.body;

    const user = await getUserById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const book = await getBookById(bookId);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const existing = await getFavoriteByUserAndBook(id, bookId);
    if (existing) {
      throw new AppError('Book already in favorites', 400);
    }

    const favorite = await addFavorite(id, bookId);

    const response: ApiResponse = {
      success: true,
      message: 'Book added to favorites',
      data: { favorite }
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

export const removeUserFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, bookId } = req.params;

    if (!id || !bookId) {
      throw new ValidationError('User ID and book ID are required');
    }

    const user = await getUserById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const existed = await getFavoriteByUserAndBook(id, bookId);
    if (!existed) {
      throw new NotFoundError('Favorite not found');
    }

    await removeFavorite(id, bookId);

    const response: ApiResponse = {
      success: true,
      message: 'Book removed from favorites'
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
