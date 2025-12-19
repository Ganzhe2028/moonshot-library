import { Router } from 'express';

import {
  getBorrowingLimitSetting,
  updateBorrowingLimitSetting,
  validateBorrowingLimit
} from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/borrowing-limit', getBorrowingLimitSetting);
router.put(
  '/borrowing-limit',
  authenticate,
  authorize(['librarian', 'admin']),
  validateBorrowingLimit,
  updateBorrowingLimitSetting
);

export default router;
