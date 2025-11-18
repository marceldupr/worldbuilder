import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import type { AuthRequest } from '../middleware/auth.js';
import { CodeGeneratorService } from '../services/CodeGenerator.service.js';

const router = Router();
const prisma = new PrismaClient();
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

export { router as codeRouter };

