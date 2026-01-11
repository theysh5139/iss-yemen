import express from 'express';
import { getImage, deleteImage, getImageMetadata } from '../controllers/image.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route to get images (anyone can view images)
router.get('/gridfs/:fileId', getImage);

// Get image metadata (public)
router.get('/gridfs/:fileId/metadata', getImageMetadata);

// Delete image (admin only)
router.delete('/gridfs/:fileId', authenticate, requireRole('admin'), deleteImage);

export default router;


