import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { 
  createBook, 
  getBookById, 
  getAllBooks, 
  updateBook, 
  deleteBook,
  getBookCategories 
} from '../models/book';
import { ApiResponse, BookRequest } from '../types';
import { AppError, ValidationError, NotFoundError } from '../middleware/errorHandler';

export const validateCreateBook = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('authors')
    .isArray({ min: 1 })
    .withMessage('Authors must be a non-empty array'),
  body('authors.*')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each author name must be between 1 and 100 characters'),
  body('isbn')
    .optional()
    .trim()
    .isISBN()
    .withMessage('Please provide a valid ISBN'),
  body('publisher')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Publisher must be between 1 and 100 characters'),
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Published year must be a valid year'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('coverImage')
    .optional()
    .trim()
    .isURL()
    .withMessage('Cover image must be a valid URL'),
  body('status')
    .optional()
    .isIn(['available', 'borrowed', 'reserved', 'maintenance'])
    .withMessage('Status must be available, borrowed, reserved, or maintenance'),
  body('totalCopies')
    .isInt({ min: 1, max: 100 })
    .withMessage('Total copies must be between 1 and 100'),
  body('availableCopies')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Available copies must be between 0 and 100'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Location must be between 1 and 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
];

export const validateUpdateBook = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Book ID is required'),
  ...validateCreateBook.map(validator => validator.optional())
];

export const validateBookId = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Book ID is required')
];

export const validateBookQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

export const getBooks = async (req: Request, res: Response): Promise<void> => {
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

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const books = await getAllBooks(limit, offset, category, search);

    const response: ApiResponse = {
      success: true,
      message: 'Books retrieved successfully',
      data: {
        books,
        pagination: {
          limit,
          offset,
          total: books.length // 在实际应用中应该返回总数
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

export const getBook = async (req: Request, res: Response): Promise<void> => {
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
      throw new ValidationError('Book ID is required');
    }
    const book = await getBookById(id);

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const response: ApiResponse = {
      success: true,
      message: 'Book retrieved successfully',
      data: { book }
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

export const createBookHandler = async (req: Request, res: Response): Promise<void> => {
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

    const bookData: BookRequest = req.body;
    const bookId = `bk-${Date.now()}`;

    const book = await createBook({
      id: bookId,
      ...bookData
    });

    const response: ApiResponse = {
      success: true,
      message: 'Book created successfully',
      data: { book }
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

export const updateBookHandler = async (req: Request, res: Response): Promise<void> => {
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
      throw new ValidationError('Book ID is required');
    }
    const updates = req.body;

    const existingBook = await getBookById(id);
    if (!existingBook) {
      throw new NotFoundError('Book not found');
    }

    const book = await updateBook(id, updates);

    const response: ApiResponse = {
      success: true,
      message: 'Book updated successfully',
      data: { book }
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

export const deleteBookHandler = async (req: Request, res: Response): Promise<void> => {
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
      throw new ValidationError('Book ID is required');
    }

    const existingBook = await getBookById(id);
    if (!existingBook) {
      throw new NotFoundError('Book not found');
    }

    const success = await deleteBook(id);

    if (!success) {
      throw new AppError('Failed to delete book', 500);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Book deleted successfully'
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

export const getBookCategoriesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getBookCategories();

    const response: ApiResponse = {
      success: true,
      message: 'Categories retrieved successfully',
      data: { categories }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
