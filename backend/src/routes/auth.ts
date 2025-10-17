import { Router, Request, Response } from 'express';
import { prisma } from '../server/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

const credentialsSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

const signupSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  role: z.enum(['Player', 'Dungeon Master']),
});

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';

router.post('/signup', async (req: Request, res: Response) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { username, password, role } = parse.data;
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(409).json({ error: 'Username already in use' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, password: hash, role } });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role });
});

router.post('/login', async (req: Request, res: Response) => {
  const parse = credentialsSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { username, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, role: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

