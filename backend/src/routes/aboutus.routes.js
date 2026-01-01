import { Router } from 'express';
import { getAboutUs, updateAboutUs } from '../controllers/aboutus.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public route
router.get('/', getAboutUs);

// Admin route
router.patch('/', authenticate, requireRole('admin'), updateAboutUs);

export default router;







