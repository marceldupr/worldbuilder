import { Router } from 'express';
import { z } from 'zod';
import { OpenAI } from 'openai';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GenerateSchemaSchema = z.object({
  componentType: z.enum(['element', 'manipulator', 'worker', 'helper', 'auditor', 'enforcer']),
  name: z.string().min(1),
  description: z.string().min(10),
});

// POST /api/generate/schema - Generate component schema using AI
router.post('/schema', async (req: AuthRequest, res) => {
  try {
    const { componentType, name, description } = GenerateSchemaSchema.parse(req.body);

    const systemPrompt = getSystemPrompt(componentType);
    const userPrompt = getUserPrompt(componentType, name, description);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const schemaJson = completion.choices[0]?.message?.content;
    if (!schemaJson) {
      throw new Error('No response from OpenAI');
    }

    const schema = JSON.parse(schemaJson);

    res.json({ schema });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error generating schema:', error);
    res.status(500).json({ error: 'Failed to generate schema' });
  }
});

function getSystemPrompt(componentType: string): string {
  const basePrompt = `You are an expert system architect helping to design software components. 
You must respond ONLY with valid JSON. Do not include any explanatory text outside the JSON structure.`;

  const typePrompts: Record<string, string> = {
    element: `${basePrompt}

For an Element component, generate a schema with:
- properties: array of field definitions (name, type, required, validations)
- relationships: optional array of relationships to other elements
- behaviors: optional array of custom methods
- indexes: suggested database indexes

Types: string, integer, decimal, boolean, date, datetime, uuid, enum, json
Validations: required, unique, min, max, minLength, maxLength, pattern, default`,

    manipulator: `${basePrompt}

For a Manipulator (API) component, generate a schema with:
- linkedElement: the element this API exposes
- operations: which CRUD operations to expose (create, read, update, delete)
- endpoints: custom endpoints beyond CRUD
- authentication: auth requirements per operation (public, authenticated, admin)
- pagination: whether to support pagination
- filters: which fields to allow filtering on`,

    worker: `${basePrompt}

For a Worker component, generate a schema with:
- queue: queue name
- concurrency: number of parallel jobs
- steps: array of job processing steps
- retry: retry strategy (attempts, backoff)
- timeout: job timeout in milliseconds
- helpers: which helpers this worker uses`,
  };

  return typePrompts[componentType] || basePrompt;
}

function getUserPrompt(componentType: string, name: string, description: string): string {
  return `Generate a ${componentType} component schema for:

Name: ${name}
Description: ${description}

Return a JSON schema that follows the structure defined in the system prompt.`;
}

export { router as generateRouter };

