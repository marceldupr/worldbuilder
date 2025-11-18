import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const CreateComponentSchema = z.object({
  projectId: z.string().uuid(),
  type: z.enum(['element', 'manipulator', 'worker', 'helper', 'auditor', 'enforcer']),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  schema: z.any(),
  position: z.any().optional(),
});

// POST /api/components - Create component
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = CreateComponentSchema.parse(req.body);

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const component = await prisma.component.create({
      data: {
        ...data,
        status: 'ready',
      },
    });

    res.status(201).json(component);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

// GET /api/components/:id - Get component
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const component = await prisma.component.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!component || component.project.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json(component);
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({ error: 'Failed to fetch component' });
  }
});

// DELETE /api/components/:id - Delete component
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const component = await prisma.component.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!component || component.project.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Component not found' });
    }

    await prisma.component.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

export { router as componentRouter };

