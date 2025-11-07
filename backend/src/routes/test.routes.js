import { Router } from 'express';
import { testEmail, testEmailConnectionEndpoint } from '../controllers/test.controller.js';

const router = Router();

// Test email sending
router.post('/email', testEmail);

// Test SMTP connection
router.get('/email-connection', testEmailConnectionEndpoint);

export default router;

