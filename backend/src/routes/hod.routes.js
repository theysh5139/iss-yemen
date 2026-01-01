import { Router } from 'express';
import { getHODs, getHODById, createHOD, updateHOD, deleteHOD } from '../controllers/hod.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getHODs);
router.get('/:id', getHODById);

// Admin routes
router.post('/', authenticate, requireRole('admin'), createHOD);
router.patch('/:id', authenticate, requireRole('admin'), updateHOD);
router.delete('/:id', authenticate, requireRole('admin'), deleteHOD);

export default router;







