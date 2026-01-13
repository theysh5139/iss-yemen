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
    }
  } catch (err) {
    console.error('[API] Initial database connection error:', err.message);
  }
})();

// Export Express app directly - Vercel automatically wraps it
export default app;
