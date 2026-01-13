import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../backend/src/app.js';
import { connectToDatabase } from '../backend/src/startup/db.js';

// Initialize database connection on module load
(async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
      console.log('[API] Database connection initialized');
    }
  } catch (err) {
    console.error('[API] Database connection error:', err.message);
  }
})();

// Export Express app - Vercel automatically wraps it for serverless
export default app;
