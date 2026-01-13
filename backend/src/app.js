import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import chatbotRoutes from "./routes/chatbot.routes.js";
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import eventRoutes from './routes/event.routes.js';
import adminRoutes from './routes/admin.routes.js';
import hodRoutes from './routes/hod.routes.js';
import committeeRoutes from './routes/committee.routes.js';
import clubMemberRoutes from './routes/clubMember.routes.js';
import aboutUsRoutes from './routes/aboutus.routes.js';
import receiptRoutes from './routes/receipt.routes.js';
import imageRoutes from './routes/image.routes.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
  contentSecurityPolicy: false, // Allow images from same origin
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port (development)
    if (origin.match(/^http:\/\/localhost:\d+$/)) return callback(null, true);
    
    // Allow Vercel domains (production/preview)
    if (origin.match(/^https:\/\/(.*\.)?vercel\.app$/)) return callback(null, true);
    if (origin.match(/^https:\/\/(.*\.)?vercel\.dev$/)) return callback(null, true);
    
    // Allow the configured CLIENT_BASE_URL
    const allowedOrigin = process.env.CLIENT_BASE_URL;
    if (allowedOrigin && origin === allowedOrigin) return callback(null, true);
    
    // Allow same-origin requests (when frontend and backend are on same domain)
    return callback(null, true);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// General rate limiter for all routes - very high limits to prevent blocking
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Very high limit to prevent rate limiting issues
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Unlimited rate limiter for auth routes (login attempts unlimited)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // Essentially unlimited login attempts
  message: 'Too many login attempts. Please try again in a few minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Only apply general rate limiter if not in development mode
if (process.env.NODE_ENV !== 'development') {
  app.use(limiter);
}

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health/db', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] ?? 'unknown';
  res.json({ state, readyState: mongoose.connection.readyState });
});

// Apply auth limiter (with very high limits) to auth routes
// In development, this effectively allows unlimited attempts
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hods', hodRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/club-members', clubMemberRoutes);
app.use('/api/aboutus', aboutUsRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/images', imageRoutes);

// Test routes (useful for debugging email configuration)
// In production, you might want to protect these routes or remove them
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

export default app;


