import { Router, Response } from 'express';
import { prisma } from '../server/prisma.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Validation schemas
const createInstanceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  invitedPlayers: z.array(z.number().int().positive()),
});

const updateInstanceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
});

// Get all instances for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userRole = req.userRole!;

    let instances;

    if (userRole === 'Dungeon Master') {
      // DMs see instances they created
      instances = await prisma.instance.findMany({
        where: { dmId: userId },
        include: {
          invitations: {
            include: {
              player: {
                select: {
                  id: true,
                  username: true,
                  role: true,
                },
              },
            },
          },
          sessions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          instanceCharacters: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              invitations: true,
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Players see instances they're invited to
      instances = await prisma.instance.findMany({
        where: {
          invitations: {
            some: {
              playerId: userId,
              status: { in: ['pending', 'accepted'] },
            },
          },
        },
        include: {
          dm: {
            select: {
              id: true,
              username: true,
            },
          },
          invitations: {
            where: { playerId: userId },
            include: {
              player: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          sessions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              invitations: true,
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(instances);
  } catch (error) {
    console.error('Error fetching instances:', error);
    res.status(500).json({ error: 'Failed to fetch instances' });
  }
});

// Create new instance (DM only)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userRole = req.userRole!;

    if (userRole !== 'Dungeon Master') {
      return res.status(403).json({ error: 'Only Dungeon Masters can create instances' });
    }

    const parse = createInstanceSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const { name, description, invitedPlayers } = parse.data;

    // Create instance with invitations
    const instance = await prisma.instance.create({
      data: {
        name,
        description,
        dmId: userId,
        invitations: {
          create: invitedPlayers.map(playerId => ({
            playerId,
            status: 'pending',
          })),
        },
      },
      include: {
        dm: {
          select: { id: true, username: true },
        },
        invitations: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
        sessions: true,
        instanceCharacters: true,
        _count: {
          select: {
            invitations: true,
            sessions: true,
          },
        },
      },
    });

    res.status(201).json(instance);
  } catch (error) {
    console.error('Error creating instance:', error);
    res.status(500).json({ error: 'Failed to create instance' });
  }
});

// Get specific instance details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);

    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        OR: [
          { dmId: userId }, // DM can see their instances
          {
            invitations: {
              some: {
                playerId: userId,
                status: 'accepted', // Only players who have accepted can see the instance
              },
            },
          },
        ],
      },
      include: {
        dm: {
          select: {
            id: true,
            username: true,
          },
        },
        invitations: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
        instanceCharacters: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        sessions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            invitations: true,
            sessions: true,
          },
        },
      },
    });

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    res.json(instance);
  } catch (error) {
    console.error('Error fetching instance:', error);
    res.status(500).json({ error: 'Failed to fetch instance' });
  }
});

// Update instance (DM only)
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userRole = req.userRole!;
    const instanceId = Number(req.params.id);

    if (userRole !== 'Dungeon Master') {
      return res.status(403).json({ error: 'Only Dungeon Masters can update instances' });
    }

    const parse = updateInstanceSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    // Check if instance exists and belongs to the DM
    const existingInstance = await prisma.instance.findFirst({
      where: { id: instanceId, dmId: userId },
    });

    if (!existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const updatedInstance = await prisma.instance.update({
      where: { id: instanceId },
      data: parse.data,
      include: {
        invitations: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            invitations: true,
            sessions: true,
          },
        },
      },
    });

    res.json(updatedInstance);
  } catch (error) {
    console.error('Error updating instance:', error);
    res.status(500).json({ error: 'Failed to update instance' });
  }
});

// Delete instance (DM only)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userRole = req.userRole!;
    const instanceId = Number(req.params.id);

    if (userRole !== 'Dungeon Master') {
      return res.status(403).json({ error: 'Only Dungeon Masters can delete instances' });
    }

    // Check if instance exists and belongs to the DM
    const existingInstance = await prisma.instance.findFirst({
      where: { id: instanceId, dmId: userId },
    });

    if (!existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Delete instance (cascade will handle related records)
    await prisma.instance.delete({
      where: { id: instanceId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting instance:', error);
    res.status(500).json({ error: 'Failed to delete instance' });
  }
});

// Accept invitation (Player only)
router.post('/:id/accept', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);

    // Update invitation status
    const invitation = await prisma.instanceInvitation.updateMany({
      where: {
        instanceId,
        playerId: userId,
        status: 'pending',
      },
      data: {
        status: 'accepted',
        respondedAt: new Date(),
      },
    });

    if (invitation.count === 0) {
      return res.status(404).json({ error: 'No pending invitation found' });
    }

    res.json({ message: 'Invitation accepted' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Select character for instance (Player only)
router.post('/:id/select-character', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);

    const characterSelectionSchema = z.object({
      characterName: z.string().min(1),
      maxHP: z.number().int().min(1),
      currentHP: z.number().int().min(0),
      tempHP: z.number().int().min(0).optional().default(0),
      initiative: z.number().int().min(0),
    });

    const parse = characterSelectionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const { characterName, maxHP, currentHP, tempHP, initiative } = parse.data;

    // Verify user has access to this instance
    const hasAccess = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        invitations: {
          some: {
            playerId: userId,
            status: 'accepted',
          },
        },
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this instance' });
    }

    // Create or update instance character
    const instanceCharacter = await prisma.instanceCharacter.upsert({
      where: {
        instanceId_userId: {
          instanceId,
          userId,
        },
      },
      update: {
        characterName,
        maxHP,
        currentHP,
        tempHP,
        initiative,
        updatedAt: new Date(),
      },
      create: {
        instanceId,
        userId,
        characterName,
        maxHP,
        currentHP,
        tempHP,
        initiative,
      },
    });

    res.json(instanceCharacter);
  } catch (error) {
    console.error('Error selecting character:', error);
    res.status(500).json({ error: 'Failed to select character' });
  }
});

// Decline invitation (Player only)
router.post('/:id/decline', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);

    // Update invitation status
    const invitation = await prisma.instanceInvitation.updateMany({
      where: {
        instanceId,
        playerId: userId,
        status: 'pending',
      },
      data: {
        status: 'declined',
        respondedAt: new Date(),
      },
    });

    if (invitation.count === 0) {
      return res.status(404).json({ error: 'No pending invitation found' });
    }

    res.json({ message: 'Invitation declined' });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ error: 'Failed to decline invitation' });
  }
});

// Enter instance (create session)
router.post('/:id/enter', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);

    // Check if user has access to this instance
    const hasAccess = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        OR: [
          { dmId: userId },
          {
            invitations: {
              some: {
                playerId: userId,
                status: 'accepted',
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this instance' });
    }

    // Create or update session
    const session = await prisma.instanceSession.upsert({
      where: {
        instanceId_userId: {
          instanceId,
          userId,
        },
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        instanceId,
        userId,
        joinedAt: new Date(),
        lastSeen: new Date(),
      },
    });

    res.json(session);
  } catch (error) {
    console.error('Error entering instance:', error);
    res.status(500).json({ error: 'Failed to enter instance' });
  }
});

// Leave instance (delete session)
router.post('/:id/leave', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);

    await prisma.instanceSession.deleteMany({
      where: {
        instanceId,
        userId,
      },
    });

    res.json({ message: 'Left instance' });
  } catch (error) {
    console.error('Error leaving instance:', error);
    res.status(500).json({ error: 'Failed to leave instance' });
  }
});

// Update character HP (Player only)
router.patch('/:id/update-hp', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);
    const { characterId, newHP, newTempHP, lastChangeType, lastChangeAmount } = req.body;

    if (!characterId || newHP === undefined) {
      return res.status(400).json({ error: 'Character ID and new HP are required' });
    }

    // Check if user has access to this instance and owns the character
    const character = await prisma.instanceCharacter.findFirst({
      where: {
        id: characterId,
        instanceId: instanceId,
        userId: userId, // Only allow users to update their own character
      },
    });

    if (!character) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    // Update the character's HP, temp HP, and last change data
    const updateData: any = { currentHP: newHP };
    if (newTempHP !== undefined) {
      updateData.tempHP = newTempHP;
    }
    if (lastChangeType && lastChangeAmount !== undefined) {
      updateData.lastChangeType = lastChangeType;
      updateData.lastChangeAmount = lastChangeAmount;
      updateData.lastChangeTimestamp = new Date();
    }

    const updatedCharacter = await prisma.instanceCharacter.update({
      where: { id: characterId },
      data: updateData,
    });

    res.json({ message: 'HP updated successfully', character: updatedCharacter });
  } catch (error) {
    console.error('Error updating HP:', error);
    res.status(500).json({ error: 'Failed to update HP' });
  }
});

// Update character conditions endpoint
router.patch('/:id/update-conditions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);
    const { characterId, conditions } = req.body;

    if (!characterId || !Array.isArray(conditions)) {
      return res.status(400).json({ error: 'Character ID and conditions array are required' });
    }

    // Check if user has access to this instance and owns the character
    const character = await prisma.instanceCharacter.findFirst({
      where: {
        id: characterId,
        instanceId: instanceId,
        userId: userId, // Only allow users to update their own character
      },
    });

    if (!character) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    // Update the character's conditions (storing as JSON string)
    const updatedCharacter = await prisma.instanceCharacter.update({
      where: { id: characterId },
      data: { 
        conditions: JSON.stringify(conditions) // Store conditions as JSON string
      },
    });

    res.json({ message: 'Conditions updated successfully', character: updatedCharacter });
  } catch (error) {
    console.error('Error updating conditions:', error);
    res.status(500).json({ error: 'Failed to update conditions' });
  }
});

// Add combat log entry
router.post('/:id/combat-log', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const instanceId = Number(req.params.id);
    const { characterName, action, details } = req.body;

    if (!characterName || !action || !details) {
      return res.status(400).json({ error: 'Character name, action, and details are required' });
    }

    // Check if user has access to this instance
    const hasAccess = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        OR: [
          { dmId: userId },
          {
            invitations: {
              some: {
                playerId: userId,
                status: 'accepted',
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this instance' });
    }

    // Create combat log entry
    const combatLogEntry = await prisma.combatLog.create({
      data: {
        instanceId,
        characterName,
        action,
        details,
      },
    });

    res.json(combatLogEntry);
  } catch (error) {
    console.error('Error adding combat log entry:', error);
    res.status(500).json({ error: 'Failed to add combat log entry' });
  }
});

// Get combat log entries for an instance (DM only)
router.get('/:id/combat-log', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userRole = req.userRole!;
    const instanceId = Number(req.params.id);

    if (userRole !== 'Dungeon Master') {
      return res.status(403).json({ error: 'Only Dungeon Masters can view combat logs' });
    }

    // Check if user is the DM of this instance
    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        dmId: userId,
      },
    });

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found or access denied' });
    }

    // Get combat log entries
    const combatLogs = await prisma.combatLog.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(combatLogs);
  } catch (error) {
    console.error('Error fetching combat log:', error);
    res.status(500).json({ error: 'Failed to fetch combat log' });
  }
});

export default router;
