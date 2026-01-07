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
  syncEventPaymentFields,
  verifyPayments,
  approvePayment,
  rejectPayment
} from '../controllers/admin.controller.js';
import { getEmailConfig, saveEmailConfig, testEmailConfig } from '../controllers/emailConfig.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody, createAnnouncementSchema, updateAnnouncementSchema, createEventSchema, updateEventSchema } from '../middlewares/validators.js';
import { uploadImage } from '../middlewares/uploadImage.middleware.js';

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
router.post('/announcements', uploadImage.single('image'), validateBody(createAnnouncementSchema), createAnnouncement);
router.patch('/announcements/:id', uploadImage.single('image'), validateBody(updateAnnouncementSchema), updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Event Management
import { uploadQR } from '../middlewares/uploadQR.middleware.js';

router.get('/events', getAllEvents);
router.post('/events', uploadQR.single('qrCode'), validateBody(createEventSchema), createEvent);
router.patch('/events/:id', uploadQR.single('qrCode'), validateBody(updateEventSchema), updateEvent);
router.patch('/events/:id/cancel', cancelEvent);
router.delete('/events/:id', deleteEvent);
router.post('/events/sync-payment-fields', syncEventPaymentFields);


// Payment Verification 
router.get('/payments', verifyPayments);
router.patch('/payments/:eventId/:registrationIndex/approve', approvePayment);
router.patch('/payments/:eventId/:registrationIndex/reject', rejectPayment);

// Email Configuration
router.get('/email-config', getEmailConfig);
router.post('/email-config', saveEmailConfig);
router.patch('/email-config', saveEmailConfig);
router.post('/email-config/test', testEmailConfig);

export default router;

