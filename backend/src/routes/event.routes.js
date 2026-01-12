import { Router } from 'express';
import {
  getEvents,
  getEventById,
  registerForEvent,
  unregisterFromEvent,
  getUpcomingEvents,
  getEventsByType,
  getHomepageData,
  getPastEvents,
  getAllActivities
} from '../controllers/event.controller.js';
import { authenticate, optionalAuth, requireRole } from '../middlewares/auth.middleware.js';
import { uploadReceipt } from '../middlewares/uploadReceipt.middleware.js';

const router = Router();

// Public routes (optional auth for better UX)
router.get('/homepage', optionalAuth, getHomepageData);
router.get('/activities', optionalAuth, getAllActivities);
router.get('/upcoming', optionalAuth, getUpcomingEvents);
router.get('/past', optionalAuth, getPastEvents);
router.get('/type/:type', optionalAuth, getEventsByType);
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// Protected routes (any logged-in user can register)
router.post('/:id/register', authenticate, uploadReceipt.single('receipt'), registerForEvent);
router.post('/:id/unregister', authenticate, unregisterFromEvent);

export default router;

