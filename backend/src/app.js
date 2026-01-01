import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import chatbotRoutes from "./routes/chatbot.routes.js";
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import adminRoutes from './routes/admin.routes.js';
import hodRoutes from './routes/hod.routes.js';
import aboutUsRoutes from './routes/aboutus.routes.js';
import mongoose from 'mongoose';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: process.env.CLIENT_BASE_URL || 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.json());

// General rate limiter for all routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiter for auth routes (login attempts need more flexibility)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again in a few minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

app.use(limiter);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health/db', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] ?? 'unknown';
  res.json({ state, readyState: mongoose.connection.readyState });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hods', hodRoutes);
app.use('/api/aboutus', aboutUsRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

export default app;


