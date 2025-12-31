import { Router } from 'express';
import {
  createPayment,
  getPaymentProof,
  downloadReceipt,
  getUserReceipts
} from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// U21 & U22: Create payment (automatically generates proof and receipt)
router.post('/create', createPayment);

// Get payment proof
router.get('/proof/:paymentId', getPaymentProof);

// Get user's receipts
router.get('/receipts', getUserReceipts);

// Download receipt PDF
router.get('/receipts/:receiptId/download', downloadReceipt);

export default router;

