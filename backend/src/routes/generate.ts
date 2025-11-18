import { Router } from 'express';
import { z } from 'zod';
import { OpenAI } from 'openai';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GenerateSchemaSchema = z.object({
  componentType: z.enum(['element', 'manipulator', 'worker', 'helper', 'auditor', 'enforcer', 'workflow']),
  name: z.string().min(1),
  description: z.string().min(10),
});

// POST /api/generate/schema - Generate component schema using AI
router.post('/schema', async (req: AuthRequest, res) => {
  try {
    console.log('[Generate] Schema generation request:', req.body);
    const data = GenerateSchemaSchema.parse(req.body);
    const { componentType, name, description, projectId } = data as any;

    console.log('[Generate] Type:', componentType, 'Name:', name);
    
    // Load existing components for context
    let availableComponents: any[] = [];
    if (projectId) {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { components: true },
        });
        availableComponents = project?.components || [];
        console.log('[Generate] Found', availableComponents.length, 'existing components for context');
      } catch (error) {
        console.warn('[Generate] Could not load project components:', error);
      }
    }
    
    const systemPrompt = getSystemPrompt(componentType);
    const userPrompt = getUserPrompt(componentType, name, description, availableComponents);

    console.log('[Generate] Calling OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    console.log('[Generate] AI response received, parsing...');
    const schema = JSON.parse(schemaJson);
    console.log('[Generate] ✅ Schema generated successfully');

    res.json({ schema });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[Generate] Validation error:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('[Generate] ❌ Error generating schema:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ 
      error: 'Failed to generate schema',
      details: error.message 
    });
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

    auditor: `${basePrompt}

For an Auditor component, generate a schema with:
- linkedElement: the element this auditor tracks
- auditEvents: which events to log (created, updated, deleted, state_changed)
- retention: how long to keep audit logs
- rules: validation rules (before/after hooks)
- Format: Track who made changes, when, what changed (before/after snapshots)`,

    enforcer: `${basePrompt}

For an Enforcer component, generate a schema with:
- rules: array of business rules to enforce
- Each rule should have:
  - name: descriptive rule name
  - type: workflow | constraint | permission | validation
  - trigger: when the rule applies (before_create, before_update, before_delete, etc)
  - components: which components are involved
  - condition: what must be true
  - errorMessage: message when rule is violated
  - description: what the rule does
  
Focus on cross-component business logic, workflow enforcement, and permission rules.`,

    workflow: `${basePrompt}

For a Workflow component, generate a schema with:
- trigger: how the workflow starts (http, event, schedule, manual)
- steps: ordered array of workflow steps
- Each step should have:
  - name: step identifier
  - description: what happens
  - component: which component to use (Element, Helper, Worker, etc)
  - action: what action to call
  - onError: what to do if step fails (retry, skip, abort)
  - timeout: optional timeout
- errorHandling: object mapping error types to responses
- rollback: optional rollback strategy

Generate a complete multi-step workflow that orchestrates the described process.`,
  };

  return typePrompts[componentType] || basePrompt;
}

function getUserPrompt(componentType: string, name: string, description: string, availableComponents: any[] = []): string {
  let prompt = `Generate a ${componentType} component schema for:

Name: ${name}
Description: ${description}
`;

  // Add context about available components for better integration
  if (availableComponents.length > 0) {
    prompt += `\nAvailable components in this project:\n`;
    availableComponents.forEach((comp) => {
      prompt += `- ${comp.name} (${comp.type})`;
      if (comp.schema) {
        // Include key details
        if (comp.type === 'element' && comp.schema.properties) {
          const fields = comp.schema.properties.map((p: any) => p.name).slice(0, 5).join(', ');
          prompt += ` - Fields: ${fields}`;
        }
        if (comp.type === 'helper' && comp.schema.integration) {
          prompt += ` - Integration: ${comp.schema.integration}`;
        }
      }
      prompt += '\n';
    });

    // Add specific guidance based on component type
    if (['worker', 'workflow', 'enforcer', 'auditor'].includes(componentType)) {
      prompt += `\nIMPORTANT: Reference and integrate with the existing components listed above. Generate specific logic that uses these actual components by name, not generic placeholders.`;
    }
  }

  prompt += `\nReturn a JSON schema that follows the structure defined in the system prompt.`;
  
  return prompt;
}

// POST /api/generate/test-data - Generate test data for component
router.post('/test-data', async (req: AuthRequest, res) => {
  try {
    const { componentId } = z.object({ componentId: z.string().uuid() }).parse(req.body);
    
    console.log('[Generate] Test data generation request for:', componentId);
    
    // Get component
    const component = await prisma.component.findFirst({
      where: { id: componentId },
      include: { project: true },
    });

    if (!component || component.project.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Generate test data using AI
    const systemPrompt = `You are a test data generator. Generate realistic test data for the given component schema.
    
Return a JSON object with:
- validData: array of 3 valid test data objects
- invalidData: array of 3 invalid test data objects (to test validation)
- edgeCases: array of 2 edge case test data objects

Make the data realistic and diverse.`;

    const userPrompt = `Generate test data for ${component.name} (${component.type}) with schema:

${JSON.stringify(component.schema, null, 2)}

Return realistic test data that can be used in unit tests.`;

    console.log('[Generate] Calling OpenAI for test data...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const testDataJson = completion.choices[0]?.message?.content;
    if (!testDataJson) {
      throw new Error('No response from OpenAI');
    }

    const testData = JSON.parse(testDataJson);
    console.log('[Generate] ✅ Test data generated successfully');

    res.json({ testData });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[Generate] Validation error:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('[Generate] ❌ Error generating test data:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate test data',
      details: error.message 
    });
  }
});

export { router as generateRouter };

