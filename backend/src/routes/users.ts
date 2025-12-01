import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUser,
  getUsersByRole
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { validatePagination } from '../middleware/validation';

const router = express.Router();

// 所有用户相关路由都需要认证
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: 获取用户列表
 *     description: 获取所有用户列表（需要管理员或图书管理员权限）
 *     tags: [Users]
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
 *         description: 用户列表获取成功
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
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [admin, librarian, member]
 *                           grade:
 *                             type: string
 *                           membershipStatus:
 *                             type: string
 *                             enum: [active, suspended, expired]
 *                           avatarColor:
 *                             type: string
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
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
// 获取所有用户（管理员和图书管理员）
router.get(
  '/',
  authorize(['admin', 'librarian']),
  validatePagination,
  getAllUsers
);

/**
 * @swagger
 * /users/role/{role}:
 *   get:
 *     summary: 根据角色获取用户
 *     description: 根据用户角色获取用户列表（需要管理员或图书管理员权限）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, librarian, member]
 *         description: 用户角色
 *     responses:
 *       200:
 *         description: 用户列表获取成功
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
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           grade:
 *                             type: string
 *                           membershipStatus:
 *                             type: string
 *                           avatarColor:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
// 根据角色获取用户
router.get(
  '/role/:role',
  authorize(['admin', 'librarian']),
  getUsersByRole
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: 获取用户详情
 *     description: 根据ID获取单个用户的详细信息
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 用户信息获取成功
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
 *                   example: User retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [admin, librarian, member]
 *                         grade:
 *                           type: string
 *                         membershipStatus:
 *                           type: string
 *                           enum: [active, suspended, expired]
 *                         avatarColor:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: 未认证
 *       404:
 *         description: 用户未找到
 */
// 获取单个用户信息
router.get(
  '/:id',
  getUserById
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: 更新用户信息
 *     description: 更新用户信息（用户可以更新自己的信息，管理员可以更新任何用户信息）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: 张三
 *               grade:
 *                 type: string
 *                 maxLength: 10
 *                 example: 2023级
 *               avatarColor:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#FF6B6B'
 *               membership:
 *                 type: string
 *                 enum: [active, suspended, expired]
 *                 example: active
 *     responses:
 *       200:
 *         description: 用户信息更新成功
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
 *                   example: User updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [admin, librarian, member]
 *                         grade:
 *                           type: string
 *                         membershipStatus:
 *                           type: string
 *                           enum: [active, suspended, expired]
 *                         avatarColor:
 *                           type: string
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
 *         description: 用户未找到
 */
// 更新用户信息
router.put(
  '/:id',
  [
    body('name').optional().isLength({ min: 2, max: 50 }).withMessage('姓名长度必须在2-50个字符之间'),
    body('grade').optional().isLength({ min: 1, max: 10 }).withMessage('年级格式不正确'),
    body('avatarColor').optional().isHexColor().withMessage('头像颜色必须是有效的十六进制颜色'),
    body('membership').optional().isIn(['active', 'suspended', 'expired']).withMessage('会员状态无效')
  ],
  handleValidationErrors,
  updateUser
);

export default router;