import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from '../routes/auth.js';
import adminRouter from '../routes/admin.js';
import instancesRouter from '../routes/instances.js';

export const app = express();

// Configure CORS for local development
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Any local network IP
    /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,  // Any local network IP
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/ // Any local network IP
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Security headers for local development
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/instances', instancesRouter);

