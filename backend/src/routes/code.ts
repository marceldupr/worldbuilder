import { Router } from 'express';
import archiver from 'archiver';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';
import { CodeGeneratorService } from '../services/CodeGenerator.service.js';

const router = Router();
const codeGenerator = new CodeGeneratorService();

// POST /api/code/generate/:projectId - Generate code for project
router.post('/generate/:projectId', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate code
    const files = await codeGenerator.generateProject(projectId);

    res.json({
      message: 'Code generated successfully',
      fileCount: files.length,
      files: files.map((f) => ({ path: f.path, size: f.content.length })),
    });
  } catch (error: any) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: error.message || 'Failed to generate code' });
  }
});

// GET /api/code/preview/:projectId - Preview generated code
router.get('/preview/:projectId', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate code
    const files = await codeGenerator.generateProject(projectId);

    // Return files with content for preview
    res.json({ files });
  } catch (error: any) {
    console.error('Error previewing code:', error);
    res.status(500).json({ error: error.message || 'Failed to preview code' });
  }
});

// GET /api/code/download/:projectId - Download code as ZIP
router.get('/download/:projectId', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user!.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate code
    const files = await codeGenerator.generateProject(projectId);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${project.name}.zip"`
    );

    // Pipe archive to response
    archive.pipe(res);

    // Add files to archive
    for (const file of files) {
      archive.append(file.content, { name: file.path });
    }

    // Finalize archive
    await archive.finalize();
  } catch (error: any) {
    console.error('Error downloading code:', error);
    res.status(500).json({ error: error.message || 'Failed to download code' });
  }
});

// POST /api/code/finalize/:projectId - AI finalizes all code (removes TODOs)
router.post('/finalize/:projectId', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user!.id,
      },
      include: {
        components: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('[Code] 🪄 AI Finalization started for:', project.name);
    console.log('[Code] Components:', project.components.length);

    // Analyze project structure
    const analysis = analyzeProject(project);
    console.log('[Code] Analysis:', JSON.stringify(analysis, null, 2));

    // Use AI to generate complete implementations
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an expert software engineer who implements complete, production-ready code.

You will receive a project structure with components, their relationships, and behaviors.
Your task is to generate COMPLETE implementations for:
- Custom methods with full business logic
- Lifecycle hooks that actually call the referenced components
- Workflow steps that integrate with helpers and workers
- Enforcer rules with real validation logic
- Auditor hooks that log to the audit table

NO PLACEHOLDERS. NO TODOs. Write production-ready code that actually works.

Return a JSON object with:
{
  "implementations": {
    "fileName": { "method": "methodName", "code": "complete implementation" }
  },
  "connections": [
    { "from": "Component", "to": "Component", "logic": "how they connect" }
  ]
}`;

    const userPrompt = `Finalize this project:

Project: ${project.name}
Description: ${project.description}

Components:
${project.components.map((c: any) => `
- ${c.name} (${c.type})
  Schema: ${JSON.stringify(c.schema, null, 2)}
`).join('\n')}

Generate COMPLETE implementations for all custom methods, lifecycle hooks, and integrations.
Make sure components actually call each other where behaviors indicate.
Write production-ready code with proper error handling.`;

    console.log('[Code] Calling OpenAI for finalization...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temp for more precise code
      response_format: { type: 'json_object' },
    });

    const implementationsJson = completion.choices[0]?.message?.content;
    if (!implementationsJson) {
      throw new Error('No response from OpenAI');
    }

    const implementations = JSON.parse(implementationsJson);
    console.log('[Code] ✅ AI finalization complete');
    console.log('[Code] Generated', Object.keys(implementations.implementations || {}).length, 'implementations');

    // Store finalized implementations in project metadata
    await prisma.project.update({
      where: { id: projectId },
      data: {
        canvasData: {
          ...((project.canvasData as any) || {}),
          aiImplementations: implementations,
          finalizedAt: new Date().toISOString(),
        },
      },
    });

    res.json({ 
      message: 'Code finalized successfully',
      completions: Object.keys(implementations.implementations || {}).length,
      implementations 
    });
  } catch (error: any) {
    console.error('[Code] Error finalizing code:', error);
    res.status(500).json({ error: error.message || 'Failed to finalize code' });
  }
});

/**
 * Analyze project to understand structure and intent
 */
function analyzeProject(project: any) {
  const analysis = {
    elements: project.components.filter((c: any) => c.type === 'element'),
    apis: project.components.filter((c: any) => c.type === 'manipulator'),
    workers: project.components.filter((c: any) => c.type === 'worker'),
    helpers: project.components.filter((c: any) => c.type === 'helper'),
    workflows: project.components.filter((c: any) => c.type === 'workflow'),
    enforcers: project.components.filter((c: any) => c.type === 'enforcer'),
    auditors: project.components.filter((c: any) => c.type === 'auditor'),
    auth: project.components.filter((c: any) => c.type === 'auth'),
    
    relationships: [] as any[],
    behaviors: [] as any[],
    integrations: [] as string[],
  };

  // Extract all relationships
  project.components.forEach((c: any) => {
    if (c.schema?.relationships) {
      analysis.relationships.push(...c.schema.relationships.map((r: any) => ({
        ...r,
        component: c.name,
      })));
    }
    if (c.schema?.behaviors) {
      analysis.behaviors.push(...c.schema.behaviors.map((b: any) => ({
        ...b,
        component: c.name,
      })));
    }
  });

  // Detect integrations
  analysis.helpers.forEach((h: any) => {
    if (h.schema?.integration) {
      analysis.integrations.push(h.schema.integration);
    }
  });

  return analysis;
}

export { router as codeRouter };


