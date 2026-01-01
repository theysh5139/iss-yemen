import { Router } from 'express';
import {
  getReceipt,
  downloadReceipt,
  shareReceipt,
  viewSharedReceipt,
  getUserReceipts
} from '../controllers/receipt.controller.js';
import { authenticate, requireRole, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Protected routes (members only)
router.get('/user/receipts', authenticate, requireRole('member', 'admin'), getUserReceipts);
router.get('/event/:eventId', authenticate, requireRole('member', 'admin'), getReceipt);
router.get('/event/:eventId/download', optionalAuth, downloadReceipt); // Optional auth for admin viewing
router.get('/event/:eventId/share', authenticate, requireRole('member', 'admin'), shareReceipt);

// Public route for shared receipts
router.get('/shared/:token', viewSharedReceipt);

export default router;

