import { Router } from 'express';
import { z } from 'zod';
import { OpenAI } from 'openai';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

// Lazy-load OpenAI client to ensure env vars are loaded
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const GenerateSchemaSchema = z.object({
  componentType: z.enum(['element', 'manipulator', 'worker', 'helper', 'auditor', 'enforcer', 'workflow']),
  name: z.string().min(1),
  description: z.string().min(10),
  skipRelatedGeneration: z.boolean().optional(), // Skip generating related component schemas
});

const GenerateSingleComponentSchema = z.object({
  componentType: z.enum(['element', 'manipulator', 'worker', 'helper', 'auditor', 'enforcer', 'workflow']),
  name: z.string().min(1),
  context: z.string().optional(), // Context about the parent component
  relatedTo: z.string().optional(), // Name of the component this relates to
});

// POST /api/generate/schema - Generate component schema using AI
router.post('/schema', async (req: AuthRequest, res): Promise<void> => {
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
    const openai = getOpenAIClient();
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
    console.log('[Generate] Schema relationships:', JSON.stringify(schema.relationships, null, 2));

    // Post-process schema: identify missing related elements and components
    const result: any = { schema };
    const missingComponents: Record<string, string[]> = {
      elements: [],
      workflows: [],
      auditors: [],
      enforcers: [],
      workers: [],
      helpers: [],
    };
    
    if (componentType === 'element') {
      console.log('[Generate] Checking for missing components...');
      console.log('[Generate] Available components:', availableComponents.map((c: any) => `${c.name}(${c.type})`).join(', '));
      
      // Check relationships for missing elements
      if (schema.relationships && Array.isArray(schema.relationships)) {
        for (const rel of schema.relationships) {
          console.log('[Generate] Processing relationship:', JSON.stringify(rel));
          const relatedElementName = rel.to || rel.target || rel.relatedTo;
          
          if (!relatedElementName) {
            console.warn('[Generate] ⚠️ Relationship missing target name:', rel);
            continue;
          }
          
          const exists = availableComponents.some(
            (comp: any) => comp.name === relatedElementName && comp.type === 'element'
          );
          
          console.log(`[Generate] Checking element "${relatedElementName}": exists=${exists}`);
          
          if (!exists && !missingComponents.elements.includes(relatedElementName)) {
            missingComponents.elements.push(relatedElementName);
            console.log(`[Generate] ➕ Missing element: ${relatedElementName}`);
          }
        }
      }
      
      // Check behaviors for missing components (workflows, auditors, workers, helpers, enforcers)
      if (schema.behaviors && Array.isArray(schema.behaviors)) {
        for (const behavior of schema.behaviors) {
          if (behavior.type === 'lifecycle_hook' && behavior.target) {
            console.log('[Generate] Processing behavior:', JSON.stringify(behavior));
            
            let targetType: string | null = null;
            let targetList: string[] | null = null;
            
            // Determine component type based on action
            if (behavior.action === 'triggerWorkflow') {
              targetType = 'workflow';
              targetList = missingComponents.workflows;
            } else if (behavior.action === 'callAuditor') {
              targetType = 'auditor';
              targetList = missingComponents.auditors;
            } else if (behavior.action === 'enforceRules') {
              targetType = 'enforcer';
              targetList = missingComponents.enforcers;
            } else if (behavior.action === 'queueJob') {
              targetType = 'worker';
              targetList = missingComponents.workers;
            } else if (behavior.action === 'sendNotification') {
              targetType = 'helper';
              targetList = missingComponents.helpers;
            }
            
            if (targetType && targetList) {
              const exists = availableComponents.some(
                (comp: any) => comp.name === behavior.target && comp.type === targetType
              );
              
              console.log(`[Generate] Checking ${targetType} "${behavior.target}": exists=${exists}`);
              
              if (!exists && !targetList.includes(behavior.target)) {
                targetList.push(behavior.target);
                console.log(`[Generate] ➕ Missing ${targetType}: ${behavior.target}`);
              }
            }
          }
        }
      }
      
      // Add to result if any missing components found
      const hasMissing = Object.values(missingComponents).some(arr => arr.length > 0);
      if (hasMissing) {
        result.missingComponents = missingComponents;
        console.log('[Generate] 🔗 Missing components (will be generated on-demand after user selection):', JSON.stringify(missingComponents, null, 2));
        // NOTE: Schemas will be generated on-demand via /api/generate/single after user selects which components to create
      } else {
        console.log('[Generate] ℹ️ No missing components detected');
      }
    }

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[Generate] Validation error:', error.errors);
      res.status(400).json({ error: error.errors });
      return;
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

// POST /api/generate/single - Generate a single component schema on-demand
router.post('/single', async (req: AuthRequest, res): Promise<void> => {
  try {
    console.log('[Generate] Single component schema generation request:', req.body);
    const data = GenerateSingleComponentSchema.parse(req.body);
    const { componentType, name, relatedTo } = data;

    console.log('[Generate] Type:', componentType, 'Name:', name);
    
    const openai = getOpenAIClient();
    let prompt = '';
    
    // Build context-specific prompts for each component type
    switch (componentType) {
      case 'element':
        prompt = `Generate a SIMPLE schema for a ${name} element${relatedTo ? ` that relates to ${relatedTo}` : ''}.

CRITICAL RULES TO PREVENT INFINITE GENERATION:
- DO NOT add ANY relationships to other elements (except back to ${relatedTo || 'parent'} if needed)
- DO NOT add ANY lifecycle hooks
- DO NOT suggest ANY behaviors that trigger other components
- Focus ONLY on properties for this element
- Keep it minimal - just the essential properties

Return a JSON schema with properties only.`;
        break;
        
      case 'workflow':
        prompt = `Generate a workflow schema for ${name}${relatedTo ? ` triggered by ${relatedTo} element` : ''}.
                    
CRITICAL: This is a SUPPORT workflow only - do NOT suggest creating new components.
${relatedTo ? `Use only the ${relatedTo} element.` : ''} Keep it simple with 2-3 steps.`;
        break;
        
      case 'auditor':
        prompt = `Generate an auditor schema for ${name}${relatedTo ? ` tracking ${relatedTo} element changes` : ''}.
                    
Focus on audit events and retention only. 2-3 events maximum.`;
        break;
        
      case 'enforcer':
        prompt = `Generate an enforcer schema for ${name}${relatedTo ? ` validating ${relatedTo} element rules` : ''}.
                    
Focus on 2-3 simple business rules${relatedTo ? ` for ${relatedTo} only` : ''}.`;
        break;
        
      case 'worker':
        prompt = `Generate a worker schema for ${name}${relatedTo ? ` processing ${relatedTo} element jobs` : ''}.
                    
Simple async job processing with 2-3 steps.`;
        break;
        
      case 'helper':
        prompt = `Generate a helper schema for ${name}${relatedTo ? ` providing utilities for ${relatedTo} element` : ''}.
                    
Simple helper with 1-2 utility methods.`;
        break;
        
      default:
        throw new Error(`Unsupported component type: ${componentType}`);
    }
    
    console.log('[Generate] Calling OpenAI for single component...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt(componentType) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const schemaJson = completion.choices[0]?.message?.content;
    if (!schemaJson) {
      throw new Error('No response from OpenAI');
    }

    const schema = JSON.parse(schemaJson);
    console.log('[Generate] ✅ Single component schema generated:', name);

    res.json({ 
      name,
      schema,
      description: `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} for ${relatedTo || 'project'}`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[Generate] Validation error:', error.errors);
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('[Generate] ❌ Error generating single component schema:', error);
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
- relationships: array of relationships to other elements (if any are mentioned or implied)
- behaviors: array of custom methods and lifecycle hooks (be creative based on the description)
- indexes: suggested database indexes

Types: string, integer, decimal, boolean, date, datetime, uuid, enum, json, image, file, document
Validations: required, unique, min, max, minLength, maxLength, pattern, default

Special types:
- image: stores image URL (use with file upload)
- file: stores file URL (use with file upload) 
- document: stores document URL (use with file upload)

CRITICAL - Relationships format:
Relationships MUST be objects with these exact fields:
{
  "from": "ElementName",  // The current element
  "to": "RelatedElementName",  // The element this relates to
  "type": "belongsTo" | "hasOne" | "hasMany" | "manyToMany",
  "fieldName": "fieldName",  // The field name (e.g., "category", "user", "tags")
  "required": true/false
}

Example:
{
  "from": "Product",
  "to": "Category",
  "type": "belongsTo",
  "fieldName": "category",
  "required": true
}

DO NOT create relationships as properties with uuid type - use the relationship structure above!

For behaviors, include:
1. Custom methods (type: "custom_method") - business logic methods like restock(), archive(), publish()
   Example: { type: "custom_method", name: "restock", description: "Add quantity to inventory", parameters: [{ name: "quantity", type: "integer" }] }

2. Lifecycle hooks (type: "lifecycle_hook") - automated actions triggered by CRUD events
   Triggers: beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete
   Actions: triggerWorkflow, callAuditor, enforceRules, queueJob, sendNotification
   Example: { type: "lifecycle_hook", trigger: "afterCreate", action: "triggerWorkflow", target: "WelcomeWorkflow", description: "Send welcome email to new user" }

CRITICAL RULES FOR LIFECYCLE HOOKS:
- ALWAYS provide a descriptive "target" name for the component the hook should call
- If the action is "triggerWorkflow", target should be a workflow name (e.g., "OrderProcessingWorkflow", "NotificationWorkflow")
- If the action is "callAuditor", target should be an auditor name (e.g., "ProductAuditor", "OrderAuditor")
- If the action is "enforceRules", target should be an enforcer name (e.g., "ValidationEnforcer", "BusinessRulesEnforcer")
- If the action is "queueJob", target should be a worker name (e.g., "EmailWorker", "ReportWorker")
- If the action is "sendNotification", target should be a helper name (e.g., "EmailHelper", "SlackHelper")
- NEVER leave target empty or null - always provide a meaningful, descriptive name

IMPORTANT: Analyze the description carefully and suggest meaningful behaviors and hooks based on the use case. Be creative and suggest 2-3 useful custom methods and 3-5 relevant lifecycle hooks.`,

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

    helper: `${basePrompt}

For a Helper component, generate a schema with:
- integration: type of integration (email, slack, stripe, twilio, s3, custom, etc)
- methods: array of utility methods this helper provides
- Each method should have:
  - name: method name
  - description: what it does
  - parameters: array of input parameters
- config: configuration options (apiKey, webhook URLs, etc)

Focus on useful utility functions and third-party integrations.`,

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
    const elements = availableComponents.filter(c => c.type === 'element');
    const workflows = availableComponents.filter(c => c.type === 'workflow');
    const auditors = availableComponents.filter(c => c.type === 'auditor');
    const workers = availableComponents.filter(c => c.type === 'worker');
    
    prompt += `\nExisting components in this project:\n`;
    
    if (elements.length > 0) {
      prompt += `\nElements (${elements.length}):\n`;
      elements.forEach((comp) => {
        prompt += `- ${comp.name}`;
        if (comp.schema?.properties) {
          const fields = comp.schema.properties.map((p: any) => p.name).slice(0, 5).join(', ');
          prompt += ` [${fields}]`;
        }
        prompt += '\n';
      });
    }
    
    if (workflows.length > 0) {
      prompt += `\nWorkflows: ${workflows.map(c => c.name).join(', ')}\n`;
    }
    if (auditors.length > 0) {
      prompt += `Auditors: ${auditors.map(c => c.name).join(', ')}\n`;
    }
    if (workers.length > 0) {
      prompt += `Workers: ${workers.map(c => c.name).join(', ')}\n`;
    }

    // Add specific guidance based on component type
    if (componentType === 'element') {
      prompt += `\nFor relationships: Consider if this element relates to any existing elements above. If relationships are implied by the description, include them.`;
      prompt += `\nFor behaviors: Think about lifecycle hooks that could trigger existing workflows, auditors, or workers.`;
    } else if (['worker', 'workflow', 'enforcer', 'auditor'].includes(componentType)) {
      prompt += `\nIMPORTANT: Reference and integrate with the existing components listed above. Generate specific logic that uses these actual components by name, not generic placeholders.`;
    }
  } else if (componentType === 'element') {
    prompt += `\nNote: This is the first element in the project. If the description implies relationships to other concepts (like Category, Tag, User, etc), include them in the relationships array.`;
  }

  prompt += `\nReturn a JSON schema that follows the structure defined in the system prompt.`;
  
  return prompt;
}

// POST /api/generate/test-data - Generate test data for component
router.post('/test-data', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { componentId } = z.object({ componentId: z.string().uuid() }).parse(req.body);
    
    console.log('[Generate] Test data generation request for:', componentId);
    
    // Get component
    const component = await prisma.component.findFirst({
      where: { id: componentId },
      include: { project: true },
    });

    if (!component || component.project.userId !== req.user!.id) {
      res.status(404).json({ error: 'Component not found' });
      return;
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
    const openai = getOpenAIClient();
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
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('[Generate] ❌ Error generating test data:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate test data',
      details: error.message 
    });
  }
});

/**
 * POST /api/generate/custom-endpoint-plan
 * Analyze endpoint description and create generation plan
 */
router.post('/custom-endpoint-plan', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { projectId, description } = req.body;

    if (!description) {
      res.status(400).json({ error: 'Description is required' });
      return;
    }

    // Get project context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { components: true },
    });

    if (!project || project.userId !== req.user!.id) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Build context for AI
    const existingComponents = project.components.map(c => ({
      name: c.name,
      type: c.type,
      description: c.description,
    }));

    // Ask AI to create a generation plan
    const prompt = `You are an expert software architect analyzing an API endpoint requirement.

PROJECT CONTEXT:
- Project: ${project.name}
- Existing components (${existingComponents.length}):
${existingComponents.length > 0 ? existingComponents.map(c => `  • ${c.name} (${c.type}): ${c.description}`).join('\n') : '  (none yet)'}

USER REQUEST:
"${description}"

CRITICAL RULES:
1. FIRST check if components already exist in the project above
2. ONLY suggest NEW components if they DON'T exist
3. If a relevant API already exists, ADD endpoint to it, don't create new API
4. For example:
   - If "Task" element exists, don't suggest creating "Task" again
   - If "Task API" exists, ADD custom endpoint to it instead of creating new API
   - If "Authentication" exists, don't suggest "Authentication" again
5. Be minimal - suggest only what's truly missing

SPECIAL CASE - Adding to Existing API:
If the endpoint relates to an existing Element that already has an API:
- Set "addToExistingApi" to the name of the existing API component
- Do NOT include a new "manipulator" component in the list
- The custom endpoint will be added to the existing API

TASK:
Analyze this request and create a plan. Consider:
1. What HTTP method and path should be used?
2. Should this be added to an existing API or create new?
3. What components are MISSING?

IMPORTANT: Keep components list SHORT. Only truly necessary new components.

RESPONSE FORMAT (JSON only):
{
  "endpoint": {
    "method": "POST|GET|PATCH|DELETE",
    "path": "/path/to/endpoint",
    "description": "What this endpoint does"
  },
  "addToExistingApi": "Task API" | null,
  "components": [
    {
      "type": "element|manipulator|worker|helper|auditor|workflow",
      "name": "ComponentName",
      "description": "What this component does",
      "reason": "Why this component is needed"
    }
  ]
}

Generate a complete, thoughtful plan. Include ALL components needed, not just the obvious ones.`;

    console.log('[CustomEndpoint] Calling OpenAI for plan...');
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert software architect. Respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const plan = JSON.parse(response.choices[0].message.content || '{}');
    console.log('[CustomEndpoint] ✅ Plan generated:', plan);

    res.json({ plan });
  } catch (error: any) {
    console.error('[CustomEndpoint] Error creating plan:', error);
    res.status(500).json({ error: error.message || 'Failed to create plan' });
  }
});

/**
 * POST /api/generate/custom-endpoint
 * Generate all components from the plan
 */
router.post('/custom-endpoint', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { projectId, description, plan } = req.body;

    if (!plan || !plan.components) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { components: true },
    });

    if (!project || project.userId !== req.user!.id) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const createdComponents: any[] = [];
    let xPos = 100;
    let yPos = 100;

    // Check if we should add to existing API
    if (plan.addToExistingApi) {
      console.log(`[CustomEndpoint] Adding endpoint to existing API: ${plan.addToExistingApi}`);
      
      // Find the existing API component
      const existingApi = project.components.find(
        (c: any) => c.name === plan.addToExistingApi && c.type === 'manipulator'
      );
      
      if (existingApi) {
        // Add custom endpoint to existing API schema
        const currentSchema = (existingApi.schema as any) || {};
        const updatedSchema = {
          ...currentSchema,
          customEndpoints: [
            ...(currentSchema.customEndpoints || []),
            {
              method: plan.endpoint.method,
              path: plan.endpoint.path,
              description: plan.endpoint.description,
              addedAt: new Date().toISOString(),
            }
          ]
        };
        
        await prisma.component.update({
          where: { id: existingApi.id },
          data: { schema: updatedSchema },
        });
        
        console.log(`[CustomEndpoint] ✅ Added custom endpoint to ${plan.addToExistingApi}`);
      } else {
        console.warn(`[CustomEndpoint] ⚠️ API "${plan.addToExistingApi}" not found, will create new components`);
      }
    }

    console.log(`[CustomEndpoint] Generating ${plan.components.length} new components...`);

    // Generate each component in order
    for (const componentPlan of plan.components) {
      try {
        console.log(`[CustomEndpoint] Creating ${componentPlan.type}: ${componentPlan.name}`);
        
        // Generate schema for this component using AI
        const schemaPrompt = `Generate a detailed schema for this component:

Type: ${componentPlan.type}
Name: ${componentPlan.name}
Description: ${componentPlan.description}
Context: Part of endpoint "${plan.endpoint.path}" which does: ${plan.endpoint.description}
Original User Request: ${description}

Respond with a JSON schema appropriate for this component type. Make it complete and production-ready.`;

        const openai = getOpenAIClient();
        const schemaResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: getSystemPrompt(componentPlan.type),
            },
            {
              role: 'user',
              content: schemaPrompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        });

        const schema = JSON.parse(schemaResponse.choices[0].message.content || '{}');

        // Create component in database
        const component = await prisma.component.create({
          data: {
            projectId,
            type: componentPlan.type,
            name: componentPlan.name,
            description: componentPlan.description,
            schema,
            position: { x: xPos, y: yPos },
            status: 'ready',
          },
        });

        createdComponents.push(component);
        console.log(`[CustomEndpoint] ✅ Created ${componentPlan.name}`);

        // Position next component
        xPos += 250;
        if (xPos > 800) {
          xPos = 100;
          yPos += 150;
        }
      } catch (error) {
        console.error(`[CustomEndpoint] Error creating component ${componentPlan.name}:`, error);
      }
    }

    console.log(`[CustomEndpoint] ✅ Generated ${createdComponents.length} components successfully`);

    res.json({
      success: true,
      components: createdComponents,
      endpoint: plan.endpoint,
    });
  } catch (error: any) {
    console.error('[CustomEndpoint] Error generating custom endpoint:', error);
    res.status(500).json({ error: error.message || 'Failed to generate endpoint' });
  }
});

export { router as generateRouter };

