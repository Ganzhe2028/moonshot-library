import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as XLSX from 'xlsx';
import { 
  createBook, 
  getBookById, 
  getAllBooks, 
  updateBook, 
  deleteBook,
  getBookCategories,
  getBookByISBN
} from '../models/book';
import { ApiResponse, Book, BookRequest } from '../types';
import { AppError, ValidationError, NotFoundError } from '../middleware/errorHandler';

export const validateCreateBook = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('titleEn')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value.trim() === '') {
        return true;
      }
      // 如果提供了值，检查长度
      const trimmed = value.trim();
      return trimmed.length >= 1 && trimmed.length <= 200;
    })
    .withMessage('English title must be between 1 and 200 characters if provided'),
  body('authors')
    .isArray({ min: 1 })
    .withMessage('Authors must be a non-empty array'),
  body('authors.*')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each author name must be between 1 and 100 characters'),
  body('authorsEn')
    .optional()
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return true;
      }
      // 必须是数组
      if (!Array.isArray(value)) {
        return false;
      }
      // 数组中的每个元素必须是非空字符串
      return value.every((item: any) => {
        if (typeof item !== 'string') return false;
        const trimmed = item.trim();
        return trimmed.length >= 1 && trimmed.length <= 100;
      });
    })
    .withMessage('English authors must be an array, and each author name must be between 1 and 100 characters if provided'),
  body('isbn')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value.trim() === '') {
        return true;
      }
      // 清理格式：去除空格和连字符
      const cleaned = value.replace(/[\s-]/g, '');
      // 验证是否为有效的 ISBN-10 或 ISBN-13
      // ISBN-10: 10位数字，最后一位可以是X
      // ISBN-13: 13位数字
      const isbn10Pattern = /^[0-9]{9}[0-9Xx]$/;
      const isbn13Pattern = /^[0-9]{13}$/;
      
      if (cleaned.length === 10 && isbn10Pattern.test(cleaned)) {
        return true;
      }
      if (cleaned.length === 13 && isbn13Pattern.test(cleaned)) {
        return true;
      }
      // 如果格式不对，尝试使用 express-validator 的 isISBN 验证
      // 但先恢复原始格式以便验证
      return /^[0-9]{10}$|^[0-9]{13}$|^[0-9]{9}[0-9Xx]$/.test(cleaned);
    })
    .withMessage('ISBN 必须是有效的 ISBN-10（10位数字，最后一位可以是X）或 ISBN-13（13位数字）格式'),
  body('publisher')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value.trim() === '') {
        return true;
      }
      // 如果提供了值，检查长度
      const trimmed = value.trim();
      return trimmed.length >= 1 && trimmed.length <= 100;
    })
    .withMessage('Publisher must be between 1 and 100 characters if provided'),
  body('publisherEn')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value.trim() === '') {
        return true;
      }
      // 如果提供了值，检查长度
      const trimmed = value.trim();
      return trimmed.length >= 1 && trimmed.length <= 100;
    })
    .withMessage('English publisher must be between 1 and 100 characters if provided'),
  body('publishedYear')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value === '' || value === null || value === undefined) {
        return true;
      }
      // 转换为数字
      const year = Number(value);
      // 检查是否为有效年份
      if (isNaN(year) || !Number.isInteger(year)) {
        return false;
      }
      const currentYear = new Date().getFullYear();
      return year >= 1000 && year <= currentYear;
    })
    .withMessage('Published year must be a valid year between 1000 and ' + new Date().getFullYear()),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  body('categoryEn')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value.trim() === '') {
        return true;
      }
      // 如果提供了值，检查长度
      const trimmed = value.trim();
      return trimmed.length >= 1 && trimmed.length <= 50;
    })
    .withMessage('English category must be between 1 and 50 characters if provided'),
  body('description')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value.trim() === '') {
        return true;
      }
      // 如果提供了值，检查长度
      const trimmed = value.trim();
      return trimmed.length <= 1000;
    })
    .withMessage('Description must not exceed 1000 characters if provided'),
  body('descriptionEn')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value.trim() === '') {
        return true;
      }
      // 如果提供了值，检查长度
      const trimmed = value.trim();
      return trimmed.length <= 1000;
    })
    .withMessage('English description must not exceed 1000 characters if provided'),
  body('coverImage')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      // 允许 URL 或相对路径
      if (!value || value.trim() === '') return true;
      return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/api/uploads/');
    })
    .withMessage('Cover image must be a valid URL or upload path'),
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
    .optional({ checkFalsy: true })
    .custom((value) => {
      // 如果为空或未提供，允许通过
      if (!value || value.trim() === '') {
        return true;
      }
      // 如果提供了值，检查长度
      const trimmed = value.trim();
      return trimmed.length >= 1 && trimmed.length <= 50;
    })
    .withMessage('Location must be between 1 and 50 characters if provided'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('tagsEn')
    .optional()
    .isArray()
    .withMessage('English tags must be an array'),
  body('tagsEn.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each English tag must be between 1 and 30 characters')
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

export const importBooksHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      throw new ValidationError('请上传Excel文件（支持 xlsx/xls，兼容 CSV）');
    }

    const parsedRows = parseWorkbook(req.file.buffer, req.file.originalname);
    if (!parsedRows.length) {
      throw new ValidationError('Excel表中没有数据');
    }

    if (parsedRows.length > 500) {
      throw new ValidationError('单次最多导入500条记录，请拆分后重试');
    }

    const result = await importBooksFromRows(parsedRows);

    const response: ApiResponse = {
      success: true,
      message: `成功导入 ${result.imported} 条，跳过 ${result.failed} 条。`,
      data: result
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
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
};

export const uploadCoverHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      throw new ValidationError('请上传封面图片');
    }

    // 返回图片URL（相对于API根路径）
    const imageUrl = `/api/uploads/covers/${req.file.filename}`;

    const response: ApiResponse = {
      success: true,
      message: '封面上传成功',
      data: {
        url: imageUrl
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
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
};

type ImportableRow = Record<string, any>;

interface ImportResult {
  imported: number;
  failed: number;
  total: number;
  books: Book[];
  errors: { row: number; message: string }[];
}

const STATUS_MAP: Record<string, Book['status']> = {
  available: 'available',
  可借阅: 'available',
  '可借阅 ': 'available',
  borrowed: 'borrowed',
  借出中: 'borrowed',
  reserved: 'reserved',
  预约: 'reserved',
  maintenance: 'maintenance',
  维护中: 'maintenance'
};

const COLUMN_ALIASES: Record<string, keyof BookRequest> = {
  title: 'title',
  书名: 'title',
  标题: 'title',
  titleen: 'titleEn',
  英文标题: 'titleEn',
  authors: 'authors',
  author: 'authors',
  作者: 'authors',
  authorsen: 'authorsEn',
  英文作者: 'authorsEn',
  category: 'category',
  分类: 'category',
  类别: 'category',
  categoryen: 'categoryEn',
  英文分类: 'categoryEn',
  totalcopies: 'totalCopies',
  总册数: 'totalCopies',
  库存: 'totalCopies',
  availablecopies: 'availableCopies',
  可用册数: 'availableCopies',
  可借数: 'availableCopies',
  status: 'status',
  状态: 'status',
  tags: 'tags',
  标签: 'tags',
  tagsen: 'tagsEn',
  英文标签: 'tagsEn',
  isbn: 'isbn',
  publisher: 'publisher',
  出版社: 'publisher',
  publisheren: 'publisherEn',
  英文出版社: 'publisherEn',
  publishedyear: 'publishedYear',
  出版年份: 'publishedYear',
  出版年: 'publishedYear',
  年份: 'publishedYear',
  location: 'location',
  馆藏位置: 'location',
  位置: 'location',
  description: 'description',
  简介: 'description',
  描述: 'description',
  descriptionen: 'descriptionEn',
  英文简介: 'descriptionEn'
};

const normalizeKey = (key: string): string => key.toLowerCase().replace(/[\s_]+/g, '');

const toOptionalString = (value: any): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str ? str : undefined;
};

const parseListField = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean);
  }

  if (value === undefined || value === null) return [];

  return String(value)
    .split(/[,，;；/]/)
    .map((v) => v.trim())
    .filter(Boolean);
};

const parseWorkbook = (buffer: Buffer, filename: string): ImportableRow[] => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new ValidationError('Excel文件为空');
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new ValidationError('未找到有效的工作表');
    }
    const rows = XLSX.utils.sheet_to_json<ImportableRow>(sheet, {
      defval: '',
      blankrows: false,
      raw: false
    });
    return rows;
  } catch (error) {
    const message =
      error instanceof Error
        ? `读取Excel失败：${error.message}`
        : `无法读取Excel文件：${filename}`;
    throw new ValidationError(message);
  }
};

const mapRowToPayload = (row: ImportableRow): { payload?: BookRequest; error?: string } => {
  const normalizedEntries = Object.entries(row).reduce<Record<string, any>>((acc, [key, value]) => {
    acc[normalizeKey(key)] = value;
    return acc;
  }, {});

  const mapped: Partial<BookRequest> = {};
  Object.entries(normalizedEntries).forEach(([key, value]) => {
    const target = COLUMN_ALIASES[key];
    if (target) {
      (mapped as Record<keyof BookRequest, unknown>)[target] = value;
    }
  });

  const title = toOptionalString(mapped.title);
  const authors = parseListField(mapped.authors);
  const category = toOptionalString(mapped.category);

  if (!title || !authors.length || !category) {
    return { error: '缺少必填字段（标题/作者/分类）' };
  }

  const totalCopies = Number(mapped.totalCopies ?? 1);
  if (!Number.isInteger(totalCopies) || totalCopies < 1) {
    return { error: '总册数必须是正整数' };
  }

  let availableCopies: number | undefined;
  const rawAvailable = mapped.availableCopies as unknown;
  if (rawAvailable !== undefined && rawAvailable !== null && String(rawAvailable).trim() !== '') {
    const parsedAvailable = Number(rawAvailable);
    if (!Number.isInteger(parsedAvailable) || parsedAvailable < 0) {
      return { error: '可用册数必须是非负整数' };
    }
    availableCopies = Math.min(parsedAvailable, totalCopies);
  } else {
    availableCopies = totalCopies;
  }

  let status: Book['status'] = 'available';
  const statusValue = toOptionalString(mapped.status);
  if (statusValue) {
    const normalizedStatus = normalizeKey(statusValue);
    status = STATUS_MAP[normalizedStatus] || STATUS_MAP[statusValue] || 'available';
  }

  let publishedYear: number | undefined;
  const rawPublishedYear = mapped.publishedYear as unknown;
  if (rawPublishedYear !== undefined && rawPublishedYear !== null && String(rawPublishedYear).trim() !== '') {
    const parsedYear = Number(rawPublishedYear);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(parsedYear) || parsedYear < 1000 || parsedYear > currentYear) {
      return { error: '出版年份不合法' };
    }
    publishedYear = parsedYear;
  }

  const payload: BookRequest = {
    title,
    authors,
    category,
    totalCopies,
    availableCopies,
    status,
    tags: parseListField(mapped.tags)
  };

  const authorsEn = parseListField(mapped.authorsEn);
  if (authorsEn.length) payload.authorsEn = authorsEn;

  const titleEn = toOptionalString(mapped.titleEn);
  if (titleEn) payload.titleEn = titleEn;

  const categoryEn = toOptionalString(mapped.categoryEn);
  if (categoryEn) payload.categoryEn = categoryEn;

  const tagsEn = parseListField(mapped.tagsEn);
  if (tagsEn.length) payload.tagsEn = tagsEn;

  const isbn = toOptionalString(mapped.isbn);
  if (isbn) payload.isbn = isbn;

  const publisher = toOptionalString(mapped.publisher);
  if (publisher) payload.publisher = publisher;

  const publisherEn = toOptionalString(mapped.publisherEn);
  if (publisherEn) payload.publisherEn = publisherEn;

  if (publishedYear !== undefined) payload.publishedYear = publishedYear;

  const location = toOptionalString(mapped.location);
  if (location) payload.location = location;

  const description = toOptionalString(mapped.description);
  if (description) payload.description = description;

  const descriptionEn = toOptionalString(mapped.descriptionEn);
  if (descriptionEn) payload.descriptionEn = descriptionEn;

  return {
    payload
  };
};

const generateBookId = (): string => `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const importBooksFromRows = async (rows: ImportableRow[]): Promise<ImportResult> => {
  const errors: { row: number; message: string }[] = [];
  const importedBooks: Book[] = [];
  const seenIsbn = new Set<string>();

  for (let index = 0; index < rows.length; index++) {
    const excelRow = index + 2; // 1-based row index including header
    const row = rows[index];
    if (!row) {
      errors.push({ row: excelRow, message: '空行已跳过' });
      continue;
    }
    const { payload, error } = mapRowToPayload(row);

    if (error || !payload) {
      errors.push({ row: excelRow, message: error || '无法解析该行数据' });
      continue;
    }

    if (payload.isbn) {
      const isbnKey = payload.isbn.trim();
      if (seenIsbn.has(isbnKey)) {
        errors.push({ row: excelRow, message: '同一文件中ISBN重复，已跳过' });
        continue;
      }
      const existing = await getBookByISBN(isbnKey);
      if (existing) {
        errors.push({ row: excelRow, message: `ISBN已存在（${isbnKey}），跳过重复记录` });
        continue;
      }
      seenIsbn.add(isbnKey);
    }

    try {
      const book = await createBook({
        id: generateBookId(),
        ...payload
      });
      importedBooks.push(book);
    } catch (err) {
      const message = err instanceof Error ? err.message : '写入数据库失败';
      errors.push({ row: excelRow, message });
    }
  }

  return {
    imported: importedBooks.length,
    failed: errors.length,
    total: rows.length,
    books: importedBooks,
    errors
  };
};
