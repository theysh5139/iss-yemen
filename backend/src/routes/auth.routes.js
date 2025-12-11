import { Router } from 'express';
import { signup, verifyEmail, login, logout, requestPasswordReset, resetPassword, resendVerification, verifyOTP, resendOTP } from '../controllers/auth.controller.js';
import { signupSchema, validateBody, loginSchema, passwordResetRequestSchema, passwordResetSchema, resendVerificationSchema, verifyOtpSchema, resendOtpSchema } from '../middlewares/validators.js';

const router = Router();

router.post('/signup', validateBody(signupSchema), signup);
router.get('/verify-email', verifyEmail);
router.post('/login', validateBody(loginSchema), login);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOTP);
router.post('/resend-otp', validateBody(resendOtpSchema), resendOTP);
router.post('/logout', logout);
router.post('/password-reset-request', validateBody(passwordResetRequestSchema), requestPasswordReset);
router.post('/password-reset', validateBody(passwordResetSchema), resetPassword);
router.post('/resend-verification', validateBody(resendVerificationSchema), resendVerification);

export default router;


