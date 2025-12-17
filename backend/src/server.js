import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectToDatabase } from './startup/db.js';

const port = process.env.PORT || 5000;

async function start() {
  try {
    await connectToDatabase();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[DB] Failed to connect to MongoDB:', err.message);
    // eslint-disable-next-line no-console
    console.warn('[DB] Server will start but database features may not work');
  }
  
  const server = http.createServer(app);
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${port}`);
  });
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.error(`Port ${port} is already in use. Please use a different port.`);
    } else {
      // eslint-disable-next-line no-console
      console.error('Server error:', err);
    }
    process.exit(1);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});


