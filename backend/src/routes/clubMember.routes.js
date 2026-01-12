import { Router } from 'express';
import { getClubMembers, getClubMemberById, createClubMember, updateClubMember, deleteClubMember } from '../controllers/clubMember.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getClubMembers);
router.get('/:id', getClubMemberById);

// Admin routes
router.post('/', authenticate, requireRole('admin'), createClubMember);
router.patch('/:id', authenticate, requireRole('admin'), updateClubMember);
router.delete('/:id', authenticate, requireRole('admin'), deleteClubMember);

export default router;
