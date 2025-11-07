import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import mongoose from 'mongoose';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: process.env.CLIENT_BASE_URL || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health/db', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] ?? 'unknown';
  res.json({ state, readyState: mongoose.connection.readyState });
});

app.use('/api/auth', authRoutes);

// Test routes (useful for debugging email configuration)
// In production, you might want to protect these routes or remove them
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

export default app;


