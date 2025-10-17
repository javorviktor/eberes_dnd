import { Router, Response } from 'express';
import { prisma } from '../server/prisma.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Middleware to require DM role
function requireDM(req: AuthRequest, res: Response, next: any) {
  if (req.userRole !== 'Dungeon Master') {
    return res.status(403).json({ error: 'Access denied. Dungeon Master role required.' });
  }
  next();
}

router.use(requireAuth);
router.use(requireDM);

// Get all registered users (DM only)
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
