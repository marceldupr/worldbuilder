import { Router } from 'express';
import { z } from 'zod';
import { createHash } from 'crypto';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

const CreateComponentSchema = z.object({
  projectId: z.string().uuid(),
  type: z.enum(['element', 'manipulator', 'worker', 'helper', 'auth', 'auditor', 'enforcer', 'workflow']),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  schema: z.any(),
  position: z.any().optional(),
});

// POST /api/components - Create component
router.post('/', async (req: AuthRequest, res) => {
  try {
    console.log('[Components] Creating component:', req.body);
    const data = CreateComponentSchema.parse(req.body);
    console.log('[Components] Validated:', data.type, data.name);

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId: req.user!.id,
      },
    });

    if (!project) {
      console.log('[Components] ❌ Project not found:', data.projectId);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('[Components] Project verified, creating component...');
    const component = await prisma.component.create({
      data: {
        ...data,
        status: 'ready',
      },
    });

    console.log('[Components] ✅ Component created:', component.id);
    res.status(201).json(component);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[Components] Validation error:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('[Components] ❌ Error creating component:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to create component',
      details: error.message,
      code: error.code 
    });
  }
});

// GET /api/components/:id - Get component
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    console.log('[Components] GET component:', req.params.id);
    const component = await prisma.component.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!component || component.project.userId !== req.user!.id) {
      console.log('[Components] ❌ Component not found or unauthorized');
      return res.status(404).json({ error: 'Component not found' });
    }

    console.log('[Components] ✅ Component found:', component.name);
    res.json(component);
  } catch (error) {
    console.error('[Components] Error fetching component:', error);
    res.status(500).json({ error: 'Failed to fetch component' });
  }
});

// PATCH /api/components/:id - Update component
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    console.log('[Components] PATCH component:', req.params.id);
    console.log('[Components] Update data:', JSON.stringify(req.body, null, 2));
    
    const component = await prisma.component.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!component || component.project.userId !== req.user!.id) {
      console.log('[Components] ❌ Component not found or unauthorized');
      return res.status(404).json({ error: 'Component not found' });
    }

    const updated = await prisma.component.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name || component.name,
        description: req.body.description !== undefined ? req.body.description : component.description,
        schema: req.body.schema || component.schema,
        position: req.body.position !== undefined ? req.body.position : component.position,
      },
    });

    console.log('[Components] ✅ Component updated successfully');
    res.json(updated);
  } catch (error) {
    console.error('[Components] ❌ Error updating component:', error);
    res.status(500).json({ error: 'Failed to update component' });
  }
});

// POST /api/components/:id/lock - Lock component tests
router.post('/:id/lock', async (req: AuthRequest, res) => {
  try {
    console.log('[Components] Locking component tests:', req.params.id);
    
    const component = await prisma.component.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!component || component.project.userId !== req.user!.id) {
      console.log('[Components] ❌ Component not found or unauthorized');
      return res.status(404).json({ error: 'Component not found' });
    }

    // Update component to locked
    const updated = await prisma.component.update({
      where: { id: req.params.id },
      data: { locked: true },
    });

    // Create locked test records (auto-generated tests)
    const testDefinitions = generateTestDefinitions(component);
    
    for (const testDef of testDefinitions) {
      await prisma.lockedTest.create({
        data: {
          componentId: component.id,
          testName: testDef.testName,
          description: testDef.description,
          testFile: testDef.testFile,
          testType: testDef.testType,
          checksum: testDef.checksum,
          lockedBy: req.user!.id,
        },
      });
    }

    console.log('[Components] ✅ Tests locked successfully');
    res.json({ 
      message: 'Tests locked successfully',
      testCount: testDefinitions.length,
      component: updated 
    });
  } catch (error) {
    console.error('[Components] ❌ Error locking tests:', error);
    res.status(500).json({ error: 'Failed to lock tests' });
  }
});

// POST /api/components/:id/unlock - Unlock component tests
router.post('/:id/unlock', async (req: AuthRequest, res) => {
  try {
    console.log('[Components] Unlocking component tests:', req.params.id);
    
    const component = await prisma.component.findFirst({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!component || component.project.userId !== req.user!.id) {
      console.log('[Components] ❌ Component not found or unauthorized');
      return res.status(404).json({ error: 'Component not found' });
    }

    // Update component to unlocked
    const updated = await prisma.component.update({
      where: { id: req.params.id },
      data: { locked: false },
    });

    // Delete all locked tests for this component
    await prisma.lockedTest.deleteMany({
      where: { componentId: component.id },
    });

    console.log('[Components] ✅ Tests unlocked successfully');
    res.json({ 
      message: 'Tests unlocked successfully',
      component: updated 
    });
  } catch (error) {
    console.error('[Components] ❌ Error unlocking tests:', error);
    res.status(500).json({ error: 'Failed to unlock tests' });
  }
});

// GET /api/components/:id/tests - Get locked tests for component
router.get('/:id/tests', async (req: AuthRequest, res) => {
  try {
    const component = await prisma.component.findFirst({
      where: { id: req.params.id },
      include: { 
        project: true,
        lockedTests: true,
      },
    });

    if (!component || component.project.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json({ 
      locked: component.locked,
      tests: component.lockedTests 
    });
  } catch (error) {
    console.error('[Components] Error fetching tests:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
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

/**
 * Generate test definitions for a component
 */
function generateTestDefinitions(component: any) {
  const tests: any[] = [];

  if (component.type === 'element' && component.schema?.properties) {
    const name = component.name;
    const testFile = `src/entities/__tests__/${name.toLowerCase()}.service.test.ts`;

    // Basic CRUD tests
    tests.push({
      testName: `should create ${name} with valid data`,
      description: 'Validates that a valid entity can be created',
      testFile,
      testType: 'unit',
      checksum: createHash('md5').update(`create-valid-${component.id}`).digest('hex'),
    });

    // Required field tests
    component.schema.properties
      .filter((p: any) => p.required && !['id', 'createdAt', 'updatedAt'].includes(p.name))
      .forEach((prop: any) => {
        tests.push({
          testName: `should reject missing ${prop.name}`,
          description: `Validates that ${prop.name} is required`,
          testFile,
          testType: 'unit',
          checksum: createHash('md5').update(`required-${prop.name}-${component.id}`).digest('hex'),
        });
      });

    // Min/max validation tests
    component.schema.properties
      .filter((p: any) => p.min !== undefined || p.max !== undefined)
      .forEach((prop: any) => {
        if (prop.min !== undefined) {
          tests.push({
            testName: `should reject ${prop.name} below minimum`,
            description: `Validates ${prop.name} minimum constraint`,
            testFile,
            testType: 'unit',
            checksum: createHash('md5').update(`min-${prop.name}-${component.id}`).digest('hex'),
          });
        }
      });

    // Default value tests
    component.schema.properties
      .filter((p: any) => p.default)
      .forEach((prop: any) => {
        tests.push({
          testName: `should default ${prop.name} to ${prop.default}`,
          description: `Validates ${prop.name} default value`,
          testFile,
          testType: 'unit',
          checksum: createHash('md5').update(`default-${prop.name}-${component.id}`).digest('hex'),
        });
      });
  }

  if (component.type === 'manipulator') {
    const testFile = `src/controllers/__tests__/${component.schema.linkedElement?.toLowerCase()}.controller.test.ts`;
    
    if (component.schema.operations) {
      Object.entries(component.schema.operations).forEach(([op, enabled]) => {
        if (enabled) {
          tests.push({
            testName: `should ${op} ${component.schema.linkedElement} via API`,
            description: `Integration test for ${op} operation`,
            testFile,
            testType: 'integration',
            checksum: createHash('md5').update(`api-${op}-${component.id}`).digest('hex'),
          });
        }
      });
    }
  }

  return tests;
}

export { router as componentRouter };

