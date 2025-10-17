import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void | Response {
  const header = (req as Request).headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

