import { Router } from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  deactivateUser,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  getAllEvents,
  getAllPaymentReceipts,
  approvePayment,
  rejectPayment
} from '../controllers/admin.controller.js';
import { getEmailConfig, saveEmailConfig, testEmailConfig } from '../controllers/emailConfig.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody, createAnnouncementSchema, updateAnnouncementSchema, createEventSchema, updateEventSchema } from '../middlewares/validators.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

// Stats
router.get('/stats', getAdminStats);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/deactivate', deactivateUser);
router.delete('/users/:id', deleteUser);

// Announcement Management
router.get('/announcements', getAllAnnouncements);
router.post('/announcements', validateBody(createAnnouncementSchema), createAnnouncement);
router.patch('/announcements/:id', validateBody(updateAnnouncementSchema), updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Event Management
router.get('/events', getAllEvents);
router.post('/events', validateBody(createEventSchema), createEvent);
router.patch('/events/:id', validateBody(updateEventSchema), updateEvent);
router.patch('/events/:id/cancel', cancelEvent);
router.delete('/events/:id', deleteEvent);

// Payment Verification 
router.get('/payments', getAllPaymentReceipts);
router.patch('/payments/:id/approve', approvePayment);
router.patch('/payments/:id/reject', rejectPayment);

// Email Configuration
router.get('/email-config', getEmailConfig);
router.post('/email-config', saveEmailConfig);
router.patch('/email-config', saveEmailConfig);
router.post('/email-config/test', testEmailConfig);

export default router;

