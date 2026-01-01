import express from 'express';
// Using "import * as" allows you to keep using "chatbotController.createRule"
import * as chatbotController from '../controllers/chatbot.controller.js';
import { verifyAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin Routes
router.post('/rule', verifyAdmin, chatbotController.createRule);
router.put('/rule/:id', verifyAdmin, chatbotController.updateRule);
router.get('/rules', verifyAdmin, chatbotController.getAllRules);
router.get('/faqs', chatbotController.getTopFAQs); // Public endpoint for FAQs
router.delete('/rule/:id', verifyAdmin, chatbotController.deleteRule);

// Public Chat Route
router.post('/message', chatbotController.handleChat);

export default router;