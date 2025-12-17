import { Router } from 'express';
import {
  getEvents,
  getEventById,
  registerForEvent,
  unregisterFromEvent,
  getUpcomingEvents,
  getEventsByType,
  getHomepageData,
  getPastEvents
} from '../controllers/event.controller.js';
import { authenticate, optionalAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes (optional auth for better UX)
router.get('/homepage', optionalAuth, getHomepageData);
router.get('/upcoming', optionalAuth, getUpcomingEvents);
router.get('/past', optionalAuth, getPastEvents);
router.get('/type/:type', optionalAuth, getEventsByType);
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// Protected routes (members only)
router.post('/:id/register', authenticate, requireRole('member', 'admin'), registerForEvent);
router.post('/:id/unregister', authenticate, requireRole('member', 'admin'), unregisterFromEvent);

export default router;

