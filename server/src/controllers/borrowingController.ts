import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiResponse, AuthRequest, BorrowingRequest } from '../types';
import { AppError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { getBookById } from '../models/book';
import { getUserById } from '../models/user';
import {
  checkOverdueBorrowings,
  createBorrowingRecord,
  getAllBorrowingRecords,
  getBorrowingRecordById,
  getBorrowingRecordsByBook,
  getBorrowingRecordsByUser,
  renewBorrowing,
  returnBook,
  updateBorrowingRecord as updateBorrowingRecordInDb,
  updateOverdueStatus
} from '../models/borrowing';

export const validateCreateBorrowing = [
  body('bookId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Book ID is required'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
];

export const validateReturnBook = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Borrowing record ID is required')
];

export const validateRenewBorrowing = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Borrowing record ID is required')
];

export const validateBorrowingQuery = [
  query('userId')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('User ID must be a valid ID'),
  query('bookId')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Book ID must be a valid ID'),
  query('status')
    .optional()
    .isIn(['active', 'returned', 'overdue'])
    .withMessage('Status must be one of: active, returned, overdue'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

// 验证更新借阅记录的请求参数
export const validateUpdateBorrowing = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Borrowing record ID is required'),
  body('borrowDate')
    .optional()
    .isISO8601()
    .withMessage('Borrow date must be a valid date in ISO format'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date in ISO format'),
  body('status')
    .optional()
    .isIn(['active', 'returned', 'overdue'])
    .withMessage('Status must be one of: active, returned, overdue')
];

// 更新借阅记录处理函数
export const updateBorrowingRecord = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // 检查权限 - 只有图书管理员可以更新借阅记录
    if (req.user?.role !== 'librarian') {
      throw new AppError('Permission denied: only librarians can update borrowing records', 403);
    }

    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Borrowing record ID is required');
    }
    const { borrowDate, dueDate, status } = req.body;

    // 验证借阅记录是否存在
    const existingRecord = await getBorrowingRecordById(id);
    if (!existingRecord) {
      throw new NotFoundError('Borrowing record not found');
    }

    // 构建更新对象
    const updates: any = {};

    // 对于borrowDate，如果提供了，直接使用（支持精确到秒）
    if (borrowDate !== undefined) {
      updates.borrow_date = borrowDate;
    }

    if (dueDate !== undefined) {
      updates.due_date = dueDate;
    }

    if (status !== undefined) {
      updates.status = status;
      // 如果设置为returned，且没有return_date，则设置当前日期
      if (status === 'returned' && !existingRecord.returnDate) {
        updates.return_date = new Date().toISOString().split('T')[0];
      }
      // 如果设置为active，清除return_date
      else if (status === 'active') {
        updates.return_date = null;
      }
    }

    // 调用模型更新记录
    const updatedRecord = await updateBorrowingRecordInDb(id!, updates);

    const response: ApiResponse = {
      success: true,
      message: 'Borrowing record updated successfully',
      data: updatedRecord
    };

    res.status(200).json(response);
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

export const createBorrowing = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { bookId, dueDate } = req.body as BorrowingRequest;
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // 验证图书是否存在且可用
    const book = await getBookById(bookId);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    if (book.availableCopies <= 0 || book.status !== 'available') {
      throw new AppError('Book is not available for borrowing', 400);
    }

    // 验证用户是否存在
    const user = await getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 检查用户是否已有未归还的相同图书
    const existingBorrowings = await getBorrowingRecordsByUser(userId);
    const hasActiveBorrowing = existingBorrowings.some(
      borrowing => borrowing.bookId === bookId && borrowing.status === 'active'
    );

    if (hasActiveBorrowing) {
      throw new AppError('User already has an active borrowing record for this book', 400);
    }

    // 如果没有提供dueDate，使用默认借阅期限
    const finalDueDate = dueDate || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

    const borrowingId = `br-${Date.now()}`;
    const borrowingRecord = await createBorrowingRecord({
      id: borrowingId,
      bookId,
      userId,
      dueDate: finalDueDate,
      status: 'active',
      borrowDate: new Date().toISOString()
    });

    const response: ApiResponse = {
      success: true,
      message: 'Book borrowed successfully',
      data: { borrowingRecord }
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

export const returnBookHandler = async (req: Request, res: Response): Promise<void> => {
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
      throw new ValidationError('Borrowing record ID is required');
    }
    const borrowingRecord = await getBorrowingRecordById(id);

    if (!borrowingRecord) {
      throw new NotFoundError('Borrowing record not found');
    }

    if (borrowingRecord.status === 'returned') {
      throw new AppError('Book has already been returned', 400);
    }

    const updatedRecord = await returnBook(id);

    const response: ApiResponse = {
      success: true,
      message: 'Book returned successfully',
      data: { borrowingRecord: updatedRecord }
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

export const renewBorrowingHandler = async (req: Request, res: Response): Promise<void> => {
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
      throw new ValidationError('Borrowing record ID is required');
    }
    const borrowingRecord = await getBorrowingRecordById(id);

    if (!borrowingRecord) {
      throw new NotFoundError('Borrowing record not found');
    }

    if (borrowingRecord.status === 'returned') {
      throw new AppError('Cannot renew a returned book', 400);
    }

    if (borrowingRecord.status === 'overdue') {
      throw new AppError('Cannot renew an overdue book', 400);
    }

    const updatedRecord = await renewBorrowing(id);

    const response: ApiResponse = {
      success: true,
      message: 'Book renewed successfully',
      data: { borrowingRecord: updatedRecord }
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

export const getBorrowingRecords = async (req: Request, res: Response): Promise<void> => {
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
    const userId = req.query.userId as string;
    const bookId = req.query.bookId as string;
    const status = req.query.status as string;

    let records;

    if (userId) {
      records = await getBorrowingRecordsByUser(userId, status, limit, offset);
    } else if (bookId) {
      records = await getBorrowingRecordsByBook(bookId, status);
    } else {
      records = await getAllBorrowingRecords(status, limit, offset);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Borrowing records retrieved successfully',
      data: {
        records,
        pagination: {
          limit,
          offset,
          total: records.length // 在实际应用中应该返回总数
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

export const getBorrowingRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Borrowing record ID is required');
    }
    const borrowingRecord = await getBorrowingRecordById(id);

    if (!borrowingRecord) {
      throw new NotFoundError('Borrowing record not found');
    }

    const response: ApiResponse = {
      success: true,
      message: 'Borrowing record retrieved successfully',
      data: { borrowingRecord }
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

export const checkOverdue = async (req: Request, res: Response): Promise<void> => {
  try {
    const overdueRecords = await checkOverdueBorrowings();

    // 更新逾期状态
    await updateOverdueStatus();

    const response: ApiResponse = {
      success: true,
      message: 'Overdue check completed',
      data: {
        overdueCount: overdueRecords.length,
        overdueRecords
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
