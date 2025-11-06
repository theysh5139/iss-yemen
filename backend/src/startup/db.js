import mongoose from 'mongoose';

let hasListeners = false;

function addConnectionLogging() {
  if (hasListeners) return;
  hasListeners = true;
  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('[DB] Connected to MongoDB');
  });
  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.log('[DB] Disconnected from MongoDB');
  });
  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[DB] MongoDB error:', err.message);
  });
}

export async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';
  if (mongoose.connection.readyState === 1) return;
  addConnectionLogging();

  const maxRetries = 5;
  let attempt = 0;
  // simple retry with exponential backoff
  // attempts at ~0s, 0.5s, 1s, 2s, 4s
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(mongoUri);
      return;
    } catch (err) {
      attempt += 1;
      if (attempt >= maxRetries) throw err;
      const delayMs = Math.pow(2, attempt - 1) * 500;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}


