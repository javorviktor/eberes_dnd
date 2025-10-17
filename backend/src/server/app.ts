import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from '../routes/auth.js';
import adminRouter from '../routes/admin.js';
import instancesRouter from '../routes/instances.js';

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/instances', instancesRouter);

