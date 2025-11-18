import { Router } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  canvasData: z.any().optional(),
});

// GET /api/projects - List all projects for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { components: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        components: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req: AuthRequest, res) => {
  try {
    console.log('[Projects] Creating project for user:', req.user!.id);
    console.log('[Projects] Data:', req.body);
    
    const data = CreateProjectSchema.parse(req.body);
    console.log('[Projects] Validated data:', data);

    const project = await prisma.project.create({
      data: {
        ...data,
        userId: req.user!.id,
      },
    });

    console.log('[Projects] ✅ Project created:', project.id);
    res.status(201).json(project);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[Projects] Validation error:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('[Projects] ❌ Error creating project:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to create project',
      details: error.message,
      code: error.code 
    });
  }
});

// PATCH /api/projects/:id - Update project
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = UpdateProjectSchema.parse(req.body);

    const project = await prisma.project.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      data,
    });

    if (project.count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updated = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.project.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export { router as projectRouter };

