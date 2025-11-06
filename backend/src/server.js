import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectToDatabase } from './startup/db.js';

const port = process.env.PORT || 5000;

async function start() {
  await connectToDatabase();
  const server = http.createServer(app);
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${port}`);
  });
}

start();


