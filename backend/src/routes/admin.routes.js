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
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  syncEventPaymentFields,
  getAllEventRegistrations,
  verifyPayments,
  approvePayment,
  rejectPayment
} from '../controllers/admin.controller.js';
import { getEmailConfig, saveEmailConfig, testEmailConfig } from '../controllers/emailConfig.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody, createAnnouncementSchema, updateAnnouncementSchema, createEventSchema, updateEventSchema } from '../middlewares/validators.js';
import { uploadImage } from '../middlewares/uploadImage.middleware.js';
import { uploadImageGridFS, processGridFSUpload } from '../middlewares/uploadImageGridFS.middleware.js';
import { uploadQR } from '../middlewares/uploadQR.middleware.js';
import { STORAGE_CONFIG } from '../config/storage.js';

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
// Use GridFS if enabled, otherwise use filesystem
if (STORAGE_CONFIG.useGridFS) {
  router.post('/announcements', uploadImageGridFS, processGridFSUpload, validateBody(createAnnouncementSchema), createAnnouncement);
  router.patch('/announcements/:id', uploadImageGridFS, processGridFSUpload, validateBody(updateAnnouncementSchema), updateAnnouncement);
} else {
  router.post('/announcements', uploadImage.single('image'), validateBody(createAnnouncementSchema), createAnnouncement);
  router.patch('/announcements/:id', uploadImage.single('image'), validateBody(updateAnnouncementSchema), updateAnnouncement);
}
router.delete('/announcements/:id', deleteAnnouncement);

// Event Management
router.get('/events', getAllEvents);
router.post('/events', uploadQR.single('qrCode'), validateBody(createEventSchema), createEvent);
router.patch('/events/:id', uploadQR.single('qrCode'), validateBody(updateEventSchema), updateEvent);
router.patch('/events/:id/cancel', cancelEvent);
router.delete('/events/:id', deleteEvent);
router.post('/events/sync-payment-fields', syncEventPaymentFields);

// Activity Management
router.get('/activities', getAllActivities);
// Use GridFS if enabled, otherwise use filesystem for activity images
if (STORAGE_CONFIG.useGridFS) {
  router.post('/activities', uploadImageGridFS, processGridFSUpload, validateBody(createAnnouncementSchema), createActivity);
  router.patch('/activities/:id', uploadImageGridFS, processGridFSUpload, validateBody(updateAnnouncementSchema), updateActivity);
} else {
  router.post('/activities', uploadImage.single('image'), validateBody(createAnnouncementSchema), createActivity);
  router.patch('/activities/:id', uploadImage.single('image'), validateBody(updateAnnouncementSchema), updateActivity);
}
router.delete('/activities/:id', deleteActivity);


// Event Registrations Management
router.get('/registrations', getAllEventRegistrations);

// Payment Verification (only paid registrations with receipts)
router.get('/payments', verifyPayments);
router.patch('/payments/:eventId/:registrationIndex/approve', approvePayment);
router.patch('/payments/:eventId/:registrationIndex/reject', rejectPayment);

// Email Configuration
router.get('/email-config', getEmailConfig);
router.post('/email-config', saveEmailConfig);
router.patch('/email-config', saveEmailConfig);
router.post('/email-config/test', testEmailConfig);

export default router;

