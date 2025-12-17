import { Router } from 'express';
import { signup, verifyEmail, login, logout, requestPasswordReset, resetPassword, resendVerification, getCurrentUser } from '../controllers/auth.controller.js';
import { signupSchema, validateBody, loginSchema, passwordResetRequestSchema, passwordResetSchema, resendVerificationSchema } from '../middlewares/validators.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/signup', validateBody(signupSchema), signup);
router.get('/verify-email', verifyEmail);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.post('/password-reset-request', validateBody(passwordResetRequestSchema), requestPasswordReset);
router.post('/password-reset', validateBody(passwordResetSchema), resetPassword);
router.post('/resend-verification', validateBody(resendVerificationSchema), resendVerification);
router.get('/me', authenticate, getCurrentUser);

export default router;


