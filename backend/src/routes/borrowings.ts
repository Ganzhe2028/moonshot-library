import { Router } from 'express';
import {
  createBorrowing,
  returnBookHandler,
  renewBorrowingHandler,
  getBorrowingRecords,
  getBorrowingRecord,
  checkOverdue,
  validateCreateBorrowing,
  validateReturnBook,
  validateRenewBorrowing,
  validateBorrowingQuery
} from '../controllers/borrowingController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /borrowings:
 *   get:
 *     summary: 获取借阅记录列表
 *     description: 获取借阅记录列表，支持按用户、图书、状态等筛选
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
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
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用户ID（管理员可查看所有用户记录）
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         description: 图书ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned, overdue]
 *         description: 借阅状态
 *     responses:
 *       200:
 *         description: 借阅记录获取成功
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
 *                   example: Borrowing records retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrowings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           bookId:
 *                             type: string
 *                           borrowDate:
 *                             type: string
 *                             format: date-time
 *                           dueDate:
 *                             type: string
 *                             format: date-time
 *                           returnDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum: [active, returned, overdue]
 *                           renewalCount:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           book:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               isbn:
 *                                 type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       401:
 *         description: 未认证
 */
router.get('/', authenticate, validateBorrowingQuery, getBorrowingRecords);

/**
 * @swagger
 * /borrowings/overdue:
 *   get:
 *     summary: 获取逾期借阅记录
 *     description: 获取所有逾期的借阅记录（需要管理员或图书管理员权限）
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: 逾期记录获取成功
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
 *                   example: Overdue records retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrowings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           bookId:
 *                             type: string
 *                           borrowDate:
 *                             type: string
 *                             format: date-time
 *                           dueDate:
 *                             type: string
 *                             format: date-time
 *                           returnDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             example: overdue
 *                           renewalCount:
 *                             type: integer
 *                           book:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                               isbn:
 *                                 type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/overdue', authenticate, authorize(['admin', 'librarian']), checkOverdue);

/**
 * @swagger
 * /borrowings/{id}:
 *   get:
 *     summary: 获取借阅记录详情
 *     description: 根据ID获取单条借阅记录的详细信息
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 借阅记录ID
 *     responses:
 *       200:
 *         description: 借阅记录详情获取成功
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
 *                   example: Borrowing record retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrowing:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         bookId:
 *                           type: string
 *                         borrowDate:
 *                           type: string
 *                           format: date-time
 *                         dueDate:
 *                           type: string
 *                           format: date-time
 *                         returnDate:
 *                           type: string
 *                           format: date-time
 *                         status:
 *                           type: string
 *                           enum: [active, returned, overdue]
 *                         renewalCount:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                         book:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             isbn:
 *                               type: string
 *                             authors:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             publisher:
 *                               type: string
 *                             publishedYear:
 *                               type: integer
 *                             category:
 *                               type: string
 *                             totalCopies:
 *                               type: integer
 *                             availableCopies:
 *                               type: integer
 *                             location:
 *                               type: string
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                             membershipId:
 *                               type: string
 *                             membershipStatus:
 *                               type: string
 *       401:
 *         description: 未认证
 *       404:
 *         description: 借阅记录未找到
 */
router.get('/:id', authenticate, getBorrowingRecord);

/**
 * @swagger
 * /borrowings:
 *   post:
 *     summary: 借阅图书
 *     description: 创建新的图书借阅记录
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *             properties:
 *               bookId:
 *                 type: string
 *                 description: 图书ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: 借阅成功
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
 *                   example: Book borrowed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrowing:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         bookId:
 *                           type: string
 *                         borrowDate:
 *                           type: string
 *                           format: date-time
 *                         dueDate:
 *                           type: string
 *                           format: date-time
 *                         status:
 *                           type: string
 *                           example: active
 *                         renewalCount:
 *                           type: integer
 *                           example: 0
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: 请求参数错误或图书不可用
 *       401:
 *         description: 未认证
 *       404:
 *         description: 图书未找到
 */
router.post('/', authenticate, validateCreateBorrowing, createBorrowing);

/**
 * @swagger
 * /borrowings/{id}/return:
 *   put:
 *     summary: 归还图书
 *     description: 归还已借阅的图书
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 借阅记录ID
 *     responses:
 *       200:
 *         description: 归还成功
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
 *                   example: Book returned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrowing:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         bookId:
 *                           type: string
 *                         borrowDate:
 *                           type: string
 *                           format: date-time
 *                         dueDate:
 *                           type: string
 *                           format: date-time
 *                         returnDate:
 *                           type: string
 *                           format: date-time
 *                         status:
 *                           type: string
 *                           example: returned
 *                         renewalCount:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: 请求参数错误或状态无效
 *       401:
 *         description: 未认证
 *       404:
 *         description: 借阅记录未找到
 */
router.put('/:id/return', authenticate, validateReturnBook, returnBookHandler);

/**
 * @swagger
 * /borrowings/{id}/renew:
 *   put:
 *     summary: 续借图书
 *     description: 续借已借阅的图书
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 借阅记录ID
 *     responses:
 *       200:
 *         description: 续借成功
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
 *                   example: Book renewed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrowing:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         bookId:
 *                           type: string
 *                         borrowDate:
 *                           type: string
 *                           format: date-time
 *                         dueDate:
 *                           type: string
 *                           format: date-time
 *                         status:
 *                           type: string
 *                           example: active
 *                         renewalCount:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: 请求参数错误或无法续借
 *       401:
 *         description: 未认证
 *       404:
 *         description: 借阅记录未找到
 */
router.put('/:id/renew', authenticate, validateRenewBorrowing, renewBorrowingHandler);

export default router;