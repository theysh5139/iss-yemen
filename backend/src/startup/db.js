import mongoose from 'mongoose';

let hasListeners = false;

function addConnectionLogging() {
  if (hasListeners) return;
  hasListeners = true;
  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    try {
      const dbName = mongoose.connection.db?.databaseName || 'unknown';
      const host = mongoose.connection.host || mongoose.connection.client?.s?.url || 'unknown';
      const mongoUri = process.env.MONGO_URI || '';
      const isAtlas = mongoUri.includes('mongodb+srv://');
      const connectionType = isAtlas ? '☁️  MongoDB Atlas (Cloud)' : '💻 MongoDB';
      // eslint-disable-next-line no-console
      console.log(`[DB] Connected to ${connectionType}`);
      // eslint-disable-next-line no-console
      console.log(`[DB] Database: ${dbName} | Host: ${host}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('[DB] Connected to MongoDB');
    }
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
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';
  if (mongoose.connection.readyState === 1) return;
  addConnectionLogging();

  // Determine if this is a MongoDB Atlas connection (mongodb+srv://)
  const isAtlas = mongoUri.includes('mongodb+srv://');
  const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
  
  // For local MongoDB, remove any SSL/TLS parameters from the connection string
  if (isLocal && !isAtlas) {
    try {
      const url = new URL(mongoUri);
      // Remove SSL-related query parameters
      url.searchParams.delete('ssl');
      url.searchParams.delete('tls');
      url.searchParams.delete('ssl=true');
      url.searchParams.delete('tls=true');
      mongoUri = url.toString();
    } catch (e) {
      // If URL parsing fails, use the original URI
      console.warn('[DB] Could not parse MongoDB URI, using as-is');
    }
  }
  
  // Connection options
  const connectionOptions = {
    // For MongoDB Atlas, use TLS/SSL
    // For local MongoDB, explicitly disable SSL
    ...(isAtlas ? {
      tls: true,
      // More permissive SSL settings for development
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    } : {
      // Local MongoDB - explicitly disable SSL and use direct connection
      ssl: false,
      directConnection: true,
    }),
    // Common options
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    // Use unified topology (recommended for newer mongoose versions)
    // Note: This is the default in mongoose 6+, but being explicit
  };

  console.log(`[DB] Attempting to connect to MongoDB (${isAtlas ? 'Atlas' : isLocal ? 'Local' : 'Remote'})...`);
  if (isLocal) {
    console.log('[DB] Using local MongoDB connection (SSL disabled)');
  }

  const maxRetries = 5;
  let attempt = 0;
  // simple retry with exponential backoff
  // attempts at ~0s, 0.5s, 1s, 2s, 4s
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(mongoUri, connectionOptions);
      return;
    } catch (err) {
      attempt += 1;
      if (attempt >= maxRetries) {
        console.error('[DB] Connection failed after', maxRetries, 'attempts');
        console.error('[DB] Error details:', err.message);
        console.error('[DB] Connection URI format:', isAtlas ? 'Atlas (mongodb+srv://)' : isLocal ? 'Local (mongodb://)' : 'Remote');
        throw err;
      }
      const delayMs = Math.pow(2, attempt - 1) * 500;
      console.log(`[DB] Connection attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}


