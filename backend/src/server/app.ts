import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from '../routes/auth.js';
import adminRouter from '../routes/admin.js';
import instancesRouter from '../routes/instances.js';

export const app = express();

// Trust proxy for reverse proxy setup
app.set('trust proxy', true);

// Configure CORS based on environment
const isProduction = process.env.NODE_ENV === 'production';
const corsOptions = {
  origin: isProduction 
    ? [
        'https://garagednd.botanyrobotics.com',
        'http://localhost:3000', // For development
        'http://192.168.0.130:3000' // For local network access
      ]
    : [
        'http://localhost:3000',
        'http://192.168.0.130:3000',
        'https://garagednd.botanyrobotics.com' // For testing
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Security headers and HTTPS redirect
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Handle HTTPS redirect only in production
  if (isProduction && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/instances', instancesRouter);

