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

/**
 * POST /api/generate/magic-improve
 * Analyze entire project and suggest improvements
 */
router.post('/magic-improve', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }

    console.log('[MagicImprove] Analyzing project:', projectId);

    // Get project with all components
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { components: true },
    });

    if (!project || project.userId !== req.user!.id) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.components.length === 0) {
      res.status(400).json({ error: 'Project has no components to analyze' });
      return;
    }

    console.log(`[MagicImprove] Found ${project.components.length} components to analyze`);

    // Build comprehensive project context for AI
    const projectContext = {
      name: project.name,
      description: project.description,
      totalComponents: project.components.length,
      components: project.components.map((c: any) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        description: c.description,
        schema: c.schema,
        status: c.status,
        locked: c.locked,
      })),
      // Group by type for easier analysis
      componentsByType: {
        elements: project.components.filter((c: any) => c.type === 'element'),
        manipulators: project.components.filter((c: any) => c.type === 'manipulator'),
        workers: project.components.filter((c: any) => c.type === 'worker'),
        helpers: project.components.filter((c: any) => c.type === 'helper'),
        auditors: project.components.filter((c: any) => c.type === 'auditor'),
        enforcers: project.components.filter((c: any) => c.type === 'enforcer'),
        workflows: project.components.filter((c: any) => c.type === 'workflow'),
        auth: project.components.filter((c: any) => c.type === 'auth'),
      },
    };

    // Prepare AI prompt for system analysis
    const systemPrompt = `You are an expert software architect and system analyst. Your job is to analyze a project's components and identify gaps, missing pieces, and improvements needed to make it production-ready.

You will analyze the project's components and suggest concrete improvements across these categories:

1. **Missing Components** - Essential components that should exist but don't
   - Missing Data APIs for Elements
   - Missing Workers for async operations
   - Missing Auditors for tracking
   - Missing Enforcers for validation
   - Missing Helpers for common operations

2. **Missing Relationships** - Connections between Elements that make sense
   - Identify Elements that should be related but aren't
   - Suggest relationship types (belongsTo, hasMany, etc.)

3. **Schema Improvements** - Database and data model enhancements
   - Missing fields in Elements
   - Missing indexes for performance
   - Missing validation rules
   - Data type improvements

4. **Architecture Improvements** - System-level enhancements
   - Security gaps (authentication, authorization)
   - Missing error handling
   - Performance optimizations
   - Scalability concerns

5. **Integration Gaps** - Missing glue code
   - Lifecycle hooks not configured
   - Workers not connected to Elements
   - Workflows not orchestrated
   - Helpers not utilized

CRITICAL: Component Type Selection Rules
==========================================
Choose the component type VERY carefully based on what you're suggesting:

**element** - ONLY for data models/entities that store data in the database
  Examples: User, Task, Product, Order, Category, Comment
  NOT for: APIs, services, authentication, utilities

**manipulator** - ONLY for REST APIs that expose Elements via HTTP endpoints
  Examples: "User API", "Task API", "Product API", "Order API"
  Use when: An Element exists but has no API to access it
  Format: Name should be "{ElementName} API"

**worker** - Background job processors for async tasks
  Examples: EmailWorker, ReportWorker, ImageProcessingWorker
  Use when: Need to queue/process long-running tasks

**helper** - Utility services and third-party integrations
  Examples: EmailHelper (SendGrid), PaymentHelper (Stripe), StorageHelper (S3)
  Use when: Need reusable utility functions or external service integrations

**auditor** - Track changes and create audit trails for Elements
  Examples: TaskAuditor, UserAuditor, OrderAuditor
  Use when: Need to log who changed what and when

**enforcer** - Business rules and validation logic
  Examples: TaskEnforcer, OrderEnforcer, InventoryEnforcer
  Use when: Need to enforce complex business rules across components

**workflow** - Multi-step orchestrated processes
  Examples: OrderProcessingWorkflow, UserOnboardingWorkflow
  Use when: Need to coordinate multiple components in sequence

**auth** - Authentication and authorization (USE SPARINGLY - check if exists first!)
  Examples: Authentication
  Use when: System has NO authentication at all

IMPORTANT RULES:
- Only suggest improvements that are truly valuable
- Be specific - provide exact component names, field names, etc.
- Prioritize by impact (high, medium, low)
- Consider the project's domain and purpose
- Don't suggest things that already exist
- Focus on making the system production-ready

Response format (JSON):
{
  "analysis": {
    "summary": "Brief overview of the project's current state",
    "strengths": ["List of what's done well"],
    "gaps": ["List of main gaps or issues"]
  },
  "improvements": [
    {
      "category": "missing_component|missing_relationship|schema_improvement|architecture|integration",
      "priority": "high|medium|low",
      "title": "Short title",
      "description": "Detailed explanation of why this is needed",
      "impact": "What benefit this brings",
      "effort": "easy|medium|hard",
      "action": {
        "type": "add_component|update_component|add_field|add_relationship|add_hook",
        "targetComponent": "component name",
        "details": { /* MUST match the structure below for each action type */ }
      }
    }
  ],
  "estimatedImpact": "Overall assessment of how much these improvements will help"
}

CRITICAL: The "details" object MUST follow these EXACT structures for each action type:

For "add_component":
{
  "componentType": "element|manipulator|worker|helper|auditor|enforcer|workflow|auth",
  "name": "ComponentName",
  "description": "What this component does",
  "linkedElement": "ElementName" (REQUIRED for manipulator and auditor types),
  "relatedComponents": ["Component1", "Component2"] (optional)
}

EXAMPLES OF CORRECT COMPONENT TYPE SELECTION:
✓ { "componentType": "element", "name": "User", "description": "User data model" }
✓ { "componentType": "manipulator", "name": "User API", "description": "REST API for User", "linkedElement": "User" }
✓ { "componentType": "worker", "name": "EmailWorker", "description": "Send emails asynchronously" }
✓ { "componentType": "helper", "name": "EmailHelper", "description": "Email utility using SendGrid" }

WRONG - DO NOT DO THIS:
✗ { "componentType": "element", "name": "User API" } ← APIs are NOT elements!
✗ { "componentType": "manipulator", "name": "User" } ← Elements are NOT manipulators!
✗ { "componentType": "manipulator", "name": "Task API" } without "linkedElement": "Task" ← MUST include linkedElement!

For "add_field":
{
  "field": {
    "name": "fieldName",
    "type": "string|integer|boolean|date|etc",
    "required": true|false,
    "description": "What this field stores",
    "validations": {} (optional)
  }
}

For "add_relationship":
{
  "relationship": {
    "from": "SourceElement",
    "to": "TargetElement",
    "type": "belongsTo|hasOne|hasMany|manyToMany",
    "fieldName": "relationshipFieldName",
    "required": true|false
  }
}

For "add_hook":
{
  "hook": {
    "type": "lifecycle_hook",
    "trigger": "beforeCreate|afterCreate|beforeUpdate|afterUpdate|beforeDelete|afterDelete",
    "action": "triggerWorkflow|callAuditor|enforceRules|queueJob|sendNotification",
    "target": "TargetComponentName",
    "description": "What this hook does"
  }
}

For "update_component":
{
  "updates": {
    "indexes": [...],
    "validations": {...},
    // any schema properties to merge
  }
}

EXAMPLE improvements with correct structure:

Example 1 - Adding an API for an existing Element:
{
  "category": "missing_component",
  "priority": "high",
  "title": "Add User API",
  "description": "Create REST API to expose User data via HTTP endpoints",
  "impact": "Allows frontend to access User data via CRUD operations",
  "effort": "easy",
  "action": {
    "type": "add_component",
    "targetComponent": "User",
    "details": {
      "componentType": "manipulator",
      "name": "User API",
      "description": "REST API for User Element with CRUD operations",
      "linkedElement": "User"
    }
  }
}

Example 2 - Adding a Helper for utilities:
{
  "category": "missing_component",
  "priority": "medium",
  "title": "Add Email Helper",
  "description": "Implement email sending functionality using SendGrid",
  "impact": "Enables sending transactional emails to users",
  "effort": "medium",
  "action": {
    "type": "add_component",
    "targetComponent": null,
    "details": {
      "componentType": "helper",
      "name": "EmailHelper",
      "description": "Send emails using SendGrid integration",
      "relatedComponents": ["User", "Task"]
    }
  }
}

Example 3 - Adding a new Element (data model):
{
  "category": "missing_component",
  "priority": "medium",
  "title": "Add Comment Element",
  "description": "Create Comment data model for user feedback on tasks",
  "impact": "Allows users to add comments to tasks",
  "effort": "medium",
  "action": {
    "type": "add_component",
    "targetComponent": "Task",
    "details": {
      "componentType": "element",
      "name": "Comment",
      "description": "Comment data model with text, author, and timestamp",
      "relatedComponents": ["Task", "User"]
    }
  }
}`;

    const userPrompt = `Analyze this project and suggest improvements:

PROJECT: ${project.name}
${project.description ? `DESCRIPTION: ${project.description}` : ''}

CURRENT COMPONENTS (${project.components.length} total):

ELEMENTS (${projectContext.componentsByType.elements.length}):
${projectContext.componentsByType.elements.map((e: any) => {
  return `
=== ${e.name} ===
Description: ${e.description || 'No description'}
Status: ${e.status}
Locked: ${e.locked}

Full Schema:
${JSON.stringify(e.schema, null, 2)}
`;
}).join('\n')}

DATA APIs (${projectContext.componentsByType.manipulators.length}):
${projectContext.componentsByType.manipulators.map((m: any) => `
=== ${m.name} ===
Description: ${m.description || 'No description'}
Status: ${m.status}
Full Schema:
${JSON.stringify(m.schema, null, 2)}
`).join('\n') || '(none)'}

WORKERS (${projectContext.componentsByType.workers.length}):
${projectContext.componentsByType.workers.map((w: any) => `
=== ${w.name} ===
Description: ${w.description || 'No description'}
Status: ${w.status}
Full Schema:
${JSON.stringify(w.schema, null, 2)}
`).join('\n') || '(none)'}

HELPERS (${projectContext.componentsByType.helpers.length}):
${projectContext.componentsByType.helpers.map((h: any) => `
=== ${h.name} ===
Description: ${h.description || 'No description'}
Status: ${h.status}
Full Schema:
${JSON.stringify(h.schema, null, 2)}
`).join('\n') || '(none)'}

AUDITORS (${projectContext.componentsByType.auditors.length}):
${projectContext.componentsByType.auditors.map((a: any) => `
=== ${a.name} ===
Description: ${a.description || 'No description'}
Status: ${a.status}
Full Schema:
${JSON.stringify(a.schema, null, 2)}
`).join('\n') || '(none)'}

ENFORCERS (${projectContext.componentsByType.enforcers.length}):
${projectContext.componentsByType.enforcers.map((e: any) => `
=== ${e.name} ===
Description: ${e.description || 'No description'}
Status: ${e.status}
Full Schema:
${JSON.stringify(e.schema, null, 2)}
`).join('\n') || '(none)'}

WORKFLOWS (${projectContext.componentsByType.workflows.length}):
${projectContext.componentsByType.workflows.map((w: any) => `
=== ${w.name} ===
Description: ${w.description || 'No description'}
Status: ${w.status}
Full Schema:
${JSON.stringify(w.schema, null, 2)}
`).join('\n') || '(none)'}

AUTHENTICATION (${projectContext.componentsByType.auth.length}):
${projectContext.componentsByType.auth.map((a: any) => `
=== ${a.name} ===
Description: ${a.description || 'No description'}
Status: ${a.status}
Full Schema:
${JSON.stringify(a.schema, null, 2)}
`).join('\n') || '(none)'}

Analyze this project deeply and suggest 5-10 high-value improvements that will make this system production-ready and robust.

CRITICAL: Check the lists above carefully - if a component type already exists (like Authentication), DO NOT suggest adding it again!`;

    console.log('[MagicImprove] Calling OpenAI for analysis...');
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const analysisJson = completion.choices[0]?.message?.content;
    if (!analysisJson) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(analysisJson);
    console.log('[MagicImprove] ✅ Analysis complete');
    console.log(`[MagicImprove] Found ${analysis.improvements?.length || 0} improvement suggestions`);

    res.json({
      success: true,
      analysis,
      projectContext: {
        name: project.name,
        totalComponents: project.components.length,
        componentCounts: {
          elements: projectContext.componentsByType.elements.length,
          apis: projectContext.componentsByType.manipulators.length,
          workers: projectContext.componentsByType.workers.length,
          helpers: projectContext.componentsByType.helpers.length,
          auditors: projectContext.componentsByType.auditors.length,
          enforcers: projectContext.componentsByType.enforcers.length,
          workflows: projectContext.componentsByType.workflows.length,
          auth: projectContext.componentsByType.auth.length,
        },
      },
    });
  } catch (error: any) {
    console.error('[MagicImprove] ❌ Error:', error);
    res.status(500).json({
      error: 'Failed to analyze project',
      details: error.message,
    });
  }
});

/**
 * POST /api/generate/apply-improvement
 * Apply a single improvement to the project (for real-time progress tracking)
 */
router.post('/apply-improvement', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { projectId, improvement } = req.body;

    if (!projectId || !improvement) {
      res.status(400).json({ error: 'projectId and improvement required' });
      return;
    }

    console.log(`[ApplyImprovement] Applying: ${improvement.title} to project ${projectId}`);

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { components: true },
    });

    if (!project || project.userId !== req.user!.id) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const openai = getOpenAIClient();
    const action = improvement.action;
    
    console.log(`[ApplyImprovement] Action type: ${action.type}`);
    console.log(`[ApplyImprovement] Action details:`, JSON.stringify(action.details, null, 2));

    try {
      if (action.type === 'add_component') {
        const componentType = action.details?.componentType;
        const componentName = action.details?.name;
        const componentDescription = action.details?.description || improvement.description;

        if (!componentType || !componentName) {
          res.json({
            success: false,
            error: `Missing component type or name. Got: ${JSON.stringify(action.details)}`,
          });
          return;
        }

        const schemaPrompt = `Generate a detailed schema for this component:

Type: ${componentType}
Name: ${componentName}
Description: ${componentDescription}
Purpose: ${improvement.impact}

${action.details.linkedElement ? `Linked to Element: ${action.details.linkedElement}` : ''}
${action.details.relatedComponents ? `Related Components: ${action.details.relatedComponents.join(', ')}` : ''}

Generate a complete, production-ready schema that addresses the improvement need.`;

        const schemaResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: getSystemPrompt(componentType) },
            { role: 'user', content: schemaPrompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const schema = JSON.parse(schemaResponse.choices[0].message.content || '{}');

        const component = await prisma.component.create({
          data: {
            projectId,
            type: componentType,
            name: componentName,
            description: componentDescription,
            schema,
            position: { x: 100 + (Math.random() * 200), y: 100 + (Math.random() * 200) },
            status: 'ready',
          },
        });

        console.log(`[ApplyImprovement] ✅ Created component: ${componentName}`);
        res.json({
          success: true,
          type: 'component_created',
          component: { id: component.id, type: component.type, name: component.name },
        });

      } else if (action.type === 'add_field') {
        const targetComponent = project.components.find(
          (c: any) => c.name === action.targetComponent || c.id === action.targetComponent
        );

        if (!targetComponent) {
          res.json({ success: false, error: `Component "${action.targetComponent}" not found` });
          return;
        }

        const newField = action.details?.field;
        if (!newField) {
          res.json({ success: false, error: `Missing field details. Got: ${JSON.stringify(action.details)}` });
          return;
        }

        const currentSchema = targetComponent.schema as any;
        const existingProperties = (currentSchema.properties || []).filter((p: any) => p !== undefined && p !== null);

        const updatedSchema = {
          ...currentSchema,
          properties: [...existingProperties, newField],
        };

        await prisma.component.update({
          where: { id: targetComponent.id },
          data: { schema: updatedSchema },
        });

        console.log(`[ApplyImprovement] ✅ Added field ${newField.name} to ${targetComponent.name}`);
        res.json({ success: true, type: 'field_added', component: targetComponent.name, field: newField.name });

      } else if (action.type === 'add_relationship') {
        const sourceComponent = project.components.find(
          (c: any) => c.name === action.targetComponent || c.id === action.targetComponent
        );

        if (!sourceComponent) {
          res.json({ success: false, error: `Component "${action.targetComponent}" not found` });
          return;
        }

        const newRelationship = action.details?.relationship;
        if (!newRelationship) {
          res.json({ success: false, error: `Missing relationship details. Got: ${JSON.stringify(action.details)}` });
          return;
        }

        const currentSchema = sourceComponent.schema as any;
        const existingRelationships = (currentSchema.relationships || []).filter((r: any) => r !== undefined && r !== null);

        const updatedSchema = {
          ...currentSchema,
          relationships: [...existingRelationships, newRelationship],
        };

        await prisma.component.update({
          where: { id: sourceComponent.id },
          data: { schema: updatedSchema },
        });

        console.log(`[ApplyImprovement] ✅ Added relationship to ${sourceComponent.name}`);
        res.json({ success: true, type: 'relationship_added', component: sourceComponent.name });

      } else if (action.type === 'add_hook') {
        const targetComponent = project.components.find(
          (c: any) => c.name === action.targetComponent || c.id === action.targetComponent
        );

        if (!targetComponent) {
          res.json({ success: false, error: `Component "${action.targetComponent}" not found` });
          return;
        }

        const newHook = action.details?.hook;
        if (!newHook) {
          res.json({ success: false, error: `Missing hook details. Got: ${JSON.stringify(action.details)}` });
          return;
        }

        const currentSchema = targetComponent.schema as any;
        const existingBehaviors = (currentSchema.behaviors || []).filter((b: any) => b !== undefined && b !== null);

        const updatedSchema = {
          ...currentSchema,
          behaviors: [...existingBehaviors, newHook],
        };

        await prisma.component.update({
          where: { id: targetComponent.id },
          data: { schema: updatedSchema },
        });

        console.log(`[ApplyImprovement] ✅ Added hook to ${targetComponent.name}`);
        res.json({ success: true, type: 'hook_added', component: targetComponent.name });

      } else if (action.type === 'update_component') {
        const targetComponent = project.components.find(
          (c: any) => c.name === action.targetComponent || c.id === action.targetComponent
        );

        if (!targetComponent) {
          res.json({ success: false, error: `Component "${action.targetComponent}" not found` });
          return;
        }

        const currentSchema = targetComponent.schema as any;
        const updates = action.details?.updates || {};

        const updatedSchema = {
          ...currentSchema,
          ...updates,
        };

        await prisma.component.update({
          where: { id: targetComponent.id },
          data: { schema: updatedSchema },
        });

        console.log(`[ApplyImprovement] ✅ Updated ${targetComponent.name}`);
        res.json({ success: true, type: 'component_updated', component: targetComponent.name });

      } else {
        res.json({ success: false, error: `Unknown action type: ${action.type}` });
      }

    } catch (error: any) {
      console.error(`[ApplyImprovement] Error:`, error);
      res.json({ success: false, error: error.message });
    }

  } catch (error: any) {
    console.error('[ApplyImprovement] ❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/generate/apply-improvements
 * Apply selected improvements to the project (batch - legacy endpoint)
 */
router.post('/apply-improvements', async (req: AuthRequest, res): Promise<void> => {
  try {
    const { projectId, improvements } = req.body;

    if (!projectId || !improvements || !Array.isArray(improvements)) {
      res.status(400).json({ error: 'projectId and improvements array required' });
      return;
    }

    console.log(`[ApplyImprovements] Applying ${improvements.length} improvements to project ${projectId}`);

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { components: true },
    });

    if (!project || project.userId !== req.user!.id) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const results: any[] = [];
    const openai = getOpenAIClient();

    for (const improvement of improvements) {
      try {
        const action = improvement.action;
        console.log(`[ApplyImprovements] Processing: ${improvement.title} (${action.type})`);
        
        // Debug: Log the action details structure
        console.log(`[ApplyImprovements] Action details:`, JSON.stringify(action.details, null, 2));

        if (action.type === 'add_component') {
          // Generate schema for the new component
          const componentType = action.details?.componentType;
          const componentName = action.details?.name;
          const componentDescription = action.details?.description || improvement.description;

          // Validate required fields
          if (!componentType || !componentName) {
            console.error(`[ApplyImprovements] Missing required fields for add_component:`);
            console.error(`  - Expected: componentType, name`);
            console.error(`  - Got: ${JSON.stringify(action.details)}`);
            results.push({
              success: false,
              error: `Missing component type or name. Got: ${JSON.stringify(action.details)}`,
              improvement: improvement.title,
            });
            continue;
          }

          const schemaPrompt = `Generate a detailed schema for this component:

Type: ${componentType}
Name: ${componentName}
Description: ${componentDescription}
Purpose: ${improvement.impact}

${action.details.linkedElement ? `Linked to Element: ${action.details.linkedElement}` : ''}
${action.details.relatedComponents ? `Related Components: ${action.details.relatedComponents.join(', ')}` : ''}

Generate a complete, production-ready schema that addresses the improvement need.`;

          const schemaResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: getSystemPrompt(componentType) },
              { role: 'user', content: schemaPrompt },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
          });

          const schema = JSON.parse(schemaResponse.choices[0].message.content || '{}');

          // Create the component
          const component = await prisma.component.create({
            data: {
              projectId,
              type: componentType,
              name: componentName,
              description: componentDescription,
              schema,
              position: { x: 100 + (results.length * 250), y: 100 },
              status: 'ready',
            },
          });

          results.push({
            success: true,
            type: 'component_created',
            component: {
              id: component.id,
              type: component.type,
              name: component.name,
            },
            improvement: improvement.title,
          });

          console.log(`[ApplyImprovements] ✅ Created component: ${componentName}`);

        } else if (action.type === 'add_field') {
          // Find the component and add field to schema
          const targetComponent = project.components.find(
            (c: any) => c.name === action.targetComponent || c.id === action.targetComponent
          );

          if (targetComponent) {
            const currentSchema = targetComponent.schema as any;
            const newField = action.details?.field;

            if (!newField) {
              console.error(`[ApplyImprovements] Missing field details for add_field:`);
              console.error(`  - Expected: { field: { name, type, ... } }`);
              console.error(`  - Got: ${JSON.stringify(action.details)}`);
              results.push({
                success: false,
                error: `Missing field details. Got: ${JSON.stringify(action.details)}`,
                improvement: improvement.title,
              });
              continue;
            }

            // Filter out any undefined values from existing properties
            const existingProperties = (currentSchema.properties || []).filter((p: any) => p !== undefined && p !== null);

            const updatedSchema = {
              ...currentSchema,
              properties: [
                ...existingProperties,
                newField,
              ],
            };

            await prisma.component.update({
              where: { id: targetComponent.id },
              data: { schema: updatedSchema },
            });

            results.push({
              success: true,
              type: 'field_added',
              component: targetComponent.name,
              field: newField.name,
              improvement: improvement.title,
            });

            console.log(`[ApplyImprovements] ✅ Added field ${newField.name} to ${targetComponent.name}`);
          } else {
            console.error(`[ApplyImprovements] Target component not found: ${action.targetComponent}`);
          }

        } else if (action.type === 'add_relationship') {
          // Find the source component and add relationship
          const sourceComponent = project.components.find(
            (c: any) => c.name === action.targetComponent || c.id === action.targetComponent
          );

          if (sourceComponent) {
            const currentSchema = sourceComponent.schema as any;
            const newRelationship = action.details?.relationship;

            if (!newRelationship) {
              console.error(`[ApplyImprovements] Missing relationship details for add_relationship:`);
              console.error(`  - Expected: { relationship: { from, to, type, fieldName, ... } }`);
              console.error(`  - Got: ${JSON.stringify(action.details)}`);
              results.push({
                success: false,
                error: `Missing relationship details. Got: ${JSON.stringify(action.details)}`,
                improvement: improvement.title,
              });
              continue;
            }

            // Filter out any undefined values from existing relationships
            const existingRelationships = (currentSchema.relationships || []).filter((r: any) => r !== undefined && r !== null);

            const updatedSchema = {
              ...currentSchema,
              relationships: [
                ...existingRelationships,
                newRelationship,
              ],
            };

            await prisma.component.update({
              where: { id: sourceComponent.id },
              data: { schema: updatedSchema },
            });

            results.push({
              success: true,
              type: 'relationship_added',
              component: sourceComponent.name,
              relationship: `${newRelationship.type} ${newRelationship.to}`,
              improvement: improvement.title,
            });

            console.log(`[ApplyImprovements] ✅ Added relationship to ${sourceComponent.name}`);
          } else {
            console.error(`[ApplyImprovements] Source component not found: ${action.targetComponent}`);
          }

        } else if (action.type === 'add_hook') {
          // Find the component and add lifecycle hook
          const targetComponent = project.components.find(
            (c: any) => c.name === action.targetComponent || c.id === action.targetComponent
          );

          if (targetComponent) {
            const currentSchema = targetComponent.schema as any;
            const newHook = action.details?.hook;
            
            if (!newHook) {
              console.error(`[ApplyImprovements] Missing hook details for add_hook:`);
              console.error(`  - Expected: { hook: { type, trigger, action, target, ... } }`);
              console.error(`  - Got: ${JSON.stringify(action.details)}`);
              results.push({
                success: false,
                error: `Missing hook details. Got: ${JSON.stringify(action.details)}`,
                improvement: improvement.title,
              });
              continue;
            }

            const updatedSchema = {
              ...currentSchema,
              behaviors: [
                ...(currentSchema.behaviors || []),
                newHook,
              ],
            };

            await prisma.component.update({
              where: { id: targetComponent.id },
              data: { schema: updatedSchema },
            });

            results.push({
              success: true,
              type: 'hook_added',
              component: targetComponent.name,
              hook: `${newHook.trigger} -> ${newHook.action}`,
              improvement: improvement.title,
            });

            console.log(`[ApplyImprovements] ✅ Added hook to ${targetComponent.name}`);
          }

        } else if (action.type === 'update_component') {
          // Update existing component schema
          const targetComponent = project.components.find(
            (c: any) => c.name === action.targetComponent || c.id === action.targetComponent
          );

          if (targetComponent) {
            const currentSchema = targetComponent.schema as any;
            const updates = action.details.updates || {};

            const updatedSchema = {
              ...currentSchema,
              ...updates,
            };

            await prisma.component.update({
              where: { id: targetComponent.id },
              data: { schema: updatedSchema },
            });

            results.push({
              success: true,
              type: 'component_updated',
              component: targetComponent.name,
              improvement: improvement.title,
            });

            console.log(`[ApplyImprovements] ✅ Updated ${targetComponent.name}`);
          }
        }

      } catch (error: any) {
        console.error(`[ApplyImprovements] Error applying improvement:`, error);
        results.push({
          success: false,
          error: error.message,
          improvement: improvement.title,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[ApplyImprovements] ✅ Applied ${successCount}/${improvements.length} improvements`);

    res.json({
      success: true,
      results,
      summary: {
        total: improvements.length,
        successful: successCount,
        failed: improvements.length - successCount,
      },
    });

  } catch (error: any) {
    console.error('[ApplyImprovements] ❌ Error:', error);
    res.status(500).json({
      error: 'Failed to apply improvements',
      details: error.message,
    });
  }
});

export { router as generateRouter };

