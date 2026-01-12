import { Router } from 'express';
import { 
  getCommittees, 
  getCommitteeById, 
  createCommittee, 
  updateCommittee, 
  deleteCommittee 
} from '../controllers/committee.controller.js';
import {
  getExecutiveMembers,
  getExecutiveMemberById,
  createExecutiveMember,
  updateExecutiveMember,
  deleteExecutiveMember
} from '../controllers/executive-member.controller.js';
import {
  getCommitteeHeads,
  getCommitteeHeadById,
  getCommitteeHeadsByCommittee,
  createCommitteeHead,
  updateCommitteeHead,
  deleteCommitteeHead
} from '../controllers/committee-head.controller.js';
import {
  getCommitteeMembers,
  getCommitteeMembersGrouped,
  getCommitteeMembersByCommittee,
  getCommitteeMemberById,
  createCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember
} from '../controllers/committee-member.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// ===== COMMITTEES ROUTES =====
// Public routes
router.get('/committees', getCommittees);
router.get('/committees/:id', getCommitteeById);

// Admin routes
router.post('/committees', authenticate, requireRole('admin'), createCommittee);
router.patch('/committees/:id', authenticate, requireRole('admin'), updateCommittee);
router.delete('/committees/:id', authenticate, requireRole('admin'), deleteCommittee);

// ===== EXECUTIVE MEMBERS ROUTES =====
// Public routes
router.get('/executive-members', getExecutiveMembers);
router.get('/executive-members/:id', getExecutiveMemberById);

// Admin routes
router.post('/executive-members', authenticate, requireRole('admin'), createExecutiveMember);
router.patch('/executive-members/:id', authenticate, requireRole('admin'), updateExecutiveMember);
router.delete('/executive-members/:id', authenticate, requireRole('admin'), deleteExecutiveMember);

// ===== COMMITTEE HEADS ROUTES =====
// Public routes
router.get('/committee-heads', getCommitteeHeads);
router.get('/committee-heads/committee/:committeeId', getCommitteeHeadsByCommittee);
router.get('/committee-heads/:id', getCommitteeHeadById);

// Admin routes
router.post('/committee-heads', authenticate, requireRole('admin'), createCommitteeHead);
router.patch('/committee-heads/:id', authenticate, requireRole('admin'), updateCommitteeHead);
router.delete('/committee-heads/:id', authenticate, requireRole('admin'), deleteCommitteeHead);

// ===== COMMITTEE MEMBERS ROUTES =====
// Public routes
router.get('/committee-members', getCommitteeMembers);
router.get('/committee-members/grouped', getCommitteeMembersGrouped);
router.get('/committee-members/committee/:committeeId', getCommitteeMembersByCommittee);
router.get('/committee-members/:id', getCommitteeMemberById);

// Admin routes
router.post('/committee-members', authenticate, requireRole('admin'), createCommitteeMember);
router.patch('/committee-members/:id', authenticate, requireRole('admin'), updateCommitteeMember);
router.delete('/committee-members/:id', authenticate, requireRole('admin'), deleteCommitteeMember);

export default router;
