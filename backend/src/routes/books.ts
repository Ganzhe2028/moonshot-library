import { Router, Request, Response, NextFunction } from 'express';
import {
  getBooks,
  getBook,
  createBookHandler,
  updateBookHandler,
  deleteBookHandler,
  getBookCategoriesHandler,
  validateCreateBook,
  validateUpdateBook,
  validateBookId,
  validateBookQuery,
  importBooksHandler
} from '../controllers/bookController';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) || /\.(xlsx?|csv)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持上传Excel文件（xlsx/xls，兼容CSV）'));
    }
  }
});

const importUploadMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      res.status(400).json({
        success: false,
        message: err.message || '文件上传失败'
      });
      return;
    }
    next();
  });
};

/**
 * @swagger
 * /books:
 *   get:
 *     summary: 获取图书列表
 *     description: 获取图书列表，支持分页、搜索和分类筛选
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: 每页数量
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: 偏移量
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 图书分类
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 图书列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Books retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           authors:
 *                             type: array
 *                             items:
 *                               type: string
 *                           isbn:
 *                             type: string
 *                           publisher:
 *                             type: string
 *                           publishedYear:
 *                             type: integer
 *                           category:
 *                             type: string
 *                           description:
 *                             type: string
 *                           totalCopies:
 *                             type: integer
 *                           availableCopies:
 *                             type: integer
 *                           location:
 *                             type: string
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       500:
 *         description: 服务器错误
 */
router.get('/', validateBookQuery, getBooks);

/**
 * @swagger
 * /books/categories:
 *   get:
 *     summary: 获取图书分类
 *     description: 获取所有图书分类
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: 分类获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: 服务器错误
 */
router.get('/categories', getBookCategoriesHandler);

/**
 * @swagger
 * /books/import:
 *   post:
 *     summary: 批量导入图书
 *     description: 通过上传 Excel 文件批量导入图书记录（推荐使用下载的模板，兼容 CSV；需要管理员或图书管理员权限）
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel 文件（.xlsx/.xls，兼容 CSV）
 *     responses:
 *       201:
 *         description: 导入完成
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                           message:
 *                             type: string
 *       400:
 *         description: 上传或数据校验失败
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post(
  '/import',
  authenticate,
  authorize(['admin', 'librarian']),
  importUploadMiddleware,
  importBooksHandler
);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: 获取图书详情
 *     description: 根据ID获取单本图书的详细信息
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 图书ID
 *     responses:
 *       200:
 *         description: 图书详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         authors:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isbn:
 *                           type: string
 *                         publisher:
 *                           type: string
 *                         publishedYear:
 *                           type: integer
 *                         category:
 *                           type: string
 *                         description:
 *                           type: string
 *                         totalCopies:
 *                           type: integer
 *                         availableCopies:
 *                           type: integer
 *                         location:
 *                           type: string
 *                         tags:
 *                           type: array
 *                           items:
 *                             type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: 图书未找到
 *       400:
 *         description: 无效的图书ID
 */
router.get('/:id', validateBookId, getBook);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: 创建图书
 *     description: 创建新的图书（需要管理员或图书管理员权限）
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - authors
 *               - isbn
 *             properties:
 *               title:
 *                 type: string
 *                 example: 人工智能导论
 *               authors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["张三", "李四"]
 *               isbn:
 *                 type: string
 *                 example: 978-7-111-12345-6
 *               publisher:
 *                 type: string
 *                 example: 机械工业出版社
 *               publishedYear:
 *                 type: integer
 *                 example: 2023
 *               category:
 *                 type: string
 *                 example: 计算机科学
 *               description:
 *                 type: string
 *                 example: 人工智能领域的经典教材
 *               totalCopies:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *               location:
 *                 type: string
 *                 example: A区-101
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["人工智能", "教材"]
 *     responses:
 *       201:
 *         description: 图书创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         authors:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isbn:
 *                           type: string
 *                         publisher:
 *                           type: string
 *                         publishedYear:
 *                           type: integer
 *                         category:
 *                           type: string
 *                         description:
 *                           type: string
 *                         totalCopies:
 *                           type: integer
 *                         availableCopies:
 *                           type: integer
 *                         location:
 *                           type: string
 *                         tags:
 *                           type: array
 *                           items:
 *                             type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/', authenticate, authorize(['admin', 'librarian']), validateCreateBook, createBookHandler);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: 更新图书
 *     description: 更新图书信息（需要管理员或图书管理员权限）
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 图书ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: 人工智能导论（第二版）
 *               authors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["张三", "李四", "王五"]
 *               isbn:
 *                 type: string
 *                 example: 978-7-111-12345-6
 *               publisher:
 *                 type: string
 *                 example: 机械工业出版社
 *               publishedYear:
 *                 type: integer
 *                 example: 2024
 *               category:
 *                 type: string
 *                 example: 计算机科学
 *               description:
 *                 type: string
 *                 example: 人工智能领域的经典教材（更新版）
 *               totalCopies:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               location:
 *                 type: string
 *                 example: A区-102
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["人工智能", "教材", "新版"]
 *     responses:
 *       200:
 *         description: 图书更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         authors:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isbn:
 *                           type: string
 *                         publisher:
 *                           type: string
 *                         publishedYear:
 *                           type: integer
 *                         category:
 *                           type: string
 *                         description:
 *                           type: string
 *                         totalCopies:
 *                           type: integer
 *                         availableCopies:
 *                           type: integer
 *                         location:
 *                           type: string
 *                         tags:
 *                           type: array
 *                           items:
 *                             type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 图书未找到
 */
router.put('/:id', authenticate, authorize(['admin', 'librarian']), validateUpdateBook, updateBookHandler);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: 删除图书
 *     description: 删除图书（需要管理员或图书管理员权限）
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 图书ID
 *     responses:
 *       200:
 *         description: 图书删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book deleted successfully
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 图书未找到
 */
router.delete('/:id', authenticate, authorize(['admin', 'librarian']), validateBookId, deleteBookHandler);

export default router;
