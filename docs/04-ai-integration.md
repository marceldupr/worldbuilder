# Worldbuilder - AI Integration

## AI-Driven Development Philosophy

Worldbuilder leverages AI to bridge the gap between human intent and machine implementation. Users describe what they want in natural language, and AI translates this into structured schemas that drive code generation.

---

## AI Pipeline

```
User Description → AI Interpretation → Schema Generation → Validation → Code Generation
```

### Stage 1: User Description Capture

User provides natural language description with contextual hints:

**Example Input**:
```
Component Type: Element
Description: "I need a Product entity with a name, price, and inventory count. 
When inventory hits zero, it should automatically mark as out of stock. 
Products should be searchable by name and filterable by status."
```

### Stage 2: AI Interpretation (OpenAI GPT-4)

Structured prompt sent to OpenAI:

```typescript
const systemPrompt = `You are a system architect AI that translates natural 
language descriptions into structured schemas for a microservice generator.

You will receive a component type and description. Generate a detailed JSON schema 
that includes all necessary properties, validations, relationships, and behaviors.

Component Types:
- Element: Data entities with properties, transitions, and behaviors
- Helper: Stateless utility functions and integrations
- Worker: Async job processors with queue management
- Manipulator: API endpoints for CRUD and custom operations
- Auditor: Validation rules and audit trail management
- Enforcer: Test generation and behavior locking

Follow these principles:
1. Infer best practices even if not explicitly stated
2. Add security measures by default (auth, validation)
3. Include observability (logging, monitoring hooks)
4. Follow RESTful conventions for APIs
5. Use appropriate data types (UUID for IDs, timestamps, etc.)
6. Include relationships between entities
7. Generate comprehensive validation rules

Output valid JSON only.`;

const userPrompt = `
Component Type: ${componentType}
Description: ${userDescription}
Context: ${existingComponents}

Generate a complete schema for this component.`;
```

### Stage 3: Schema Generation

AI returns structured JSON schema:

```json
{
  "component": {
    "type": "element",
    "name": "Product",
    "persistence": "persisted",
    "properties": [
      {
        "name": "id",
        "type": "uuid",
        "primary": true,
        "generated": true,
        "indexed": true
      },
      {
        "name": "name",
        "type": "string",
        "required": true,
        "minLength": 1,
        "maxLength": 255,
        "indexed": true,
        "searchable": true
      },
      {
        "name": "price",
        "type": "decimal",
        "precision": 10,
        "scale": 2,
        "required": true,
        "min": 0,
        "validation": "must be positive"
      },
      {
        "name": "inventory",
        "type": "integer",
        "required": true,
        "default": 0,
        "min": 0,
        "onChange": "checkOutOfStock"
      },
      {
        "name": "status",
        "type": "enum",
        "values": ["active", "inactive", "out_of_stock"],
        "default": "active",
        "indexed": true
      },
      {
        "name": "createdAt",
        "type": "timestamp",
        "generated": true,
        "immutable": true
      },
      {
        "name": "updatedAt",
        "type": "timestamp",
        "generated": true,
        "autoUpdate": true
      }
    ],
    "transitions": [
      {
        "name": "markOutOfStock",
        "from": ["active"],
        "to": "out_of_stock",
        "condition": "inventory === 0",
        "automatic": true
      },
      {
        "name": "reactivate",
        "from": ["out_of_stock", "inactive"],
        "to": "active",
        "condition": "inventory > 0",
        "manual": true
      }
    ],
    "behaviors": [
      {
        "name": "restock",
        "parameters": [
          { "name": "quantity", "type": "integer", "min": 1 }
        ],
        "logic": "increment inventory, trigger reactivate if out of stock",
        "audit": true
      },
      {
        "name": "decrementInventory",
        "parameters": [
          { "name": "quantity", "type": "integer", "min": 1 }
        ],
        "logic": "decrement inventory, trigger markOutOfStock if zero",
        "audit": true
      }
    ],
    "indexes": [
      { "fields": ["name"], "type": "btree" },
      { "fields": ["status"], "type": "btree" },
      { "fields": ["name"], "type": "fulltext" }
    ],
    "requiredComponents": [
      {
        "type": "manipulator",
        "reason": "CRUD operations needed for searchability and filtering"
      },
      {
        "type": "auditor",
        "reason": "Track inventory changes for business intelligence"
      }
    ]
  }
}
```

### Stage 4: Schema Validation

Worldbuilder validates the AI-generated schema:

```typescript
class SchemaValidator {
  validate(schema: any, componentType: ComponentType): ValidationResult {
    // 1. Structure validation
    this.validateStructure(schema, componentType);
    
    // 2. Type checking
    this.validateTypes(schema);
    
    // 3. Relationship validation
    this.validateRelationships(schema);
    
    // 4. Security checks
    this.validateSecurity(schema);
    
    // 5. Best practices
    this.validateBestPractices(schema);
    
    return {
      valid: true,
      warnings: [],
      suggestions: []
    };
  }
}
```

### Stage 5: User Review & Refinement

Present schema to user in readable format:

```
✓ Product Element

Properties:
  • id (UUID) - Auto-generated identifier
  • name (String, 1-255 chars) - Required, Searchable
  • price (Decimal) - Required, Must be positive
  • inventory (Integer) - Required, Default: 0
  • status (Enum: active/inactive/out_of_stock) - Default: active
  • createdAt (Timestamp) - Auto-generated
  • updatedAt (Timestamp) - Auto-updated

Automatic Behaviors:
  → When inventory reaches 0, status changes to "out_of_stock"
  → When restocked from out_of_stock, status changes to "active"

API Endpoints (suggested):
  • POST /products - Create product
  • GET /products - List products (with search & filter)
  • GET /products/:id - Get product details
  • PUT /products/:id - Update product
  • DELETE /products/:id - Delete product
  • POST /products/:id/restock - Restock inventory

[Approve] [Refine] [Regenerate]
```

User can:
- **Approve**: Generate code
- **Refine**: Modify description and regenerate
- **Edit Schema**: Manually adjust specific fields

---

## AI Prompt Engineering

### Element Generation Prompt

```typescript
const elementPrompt = `
Generate an Element schema for a microservice architecture.

Requirements:
1. Always include id (uuid), createdAt, updatedAt
2. Infer appropriate data types from description
3. Add validation constraints where reasonable
4. Suggest indexes for searchable/filterable fields
5. Identify state transitions from description
6. Create behaviors for state changes
7. Flag security concerns (PII, sensitive data)
8. Suggest related components (Auditor for compliance, etc.)

Input:
${userInput}

Output Format:
{
  "component": { ... }
}
`;
```

### Worker Generation Prompt

```typescript
const workerPrompt = `
Generate a Worker schema for async job processing.

Requirements:
1. Define clear job input schema
2. Break job into discrete steps
3. Identify which steps need Helpers
4. Set appropriate retry strategy
5. Define failure handling
6. Set reasonable timeouts
7. Determine concurrency limits
8. Add progress tracking if job is long-running

Consider:
- Network calls should have retries
- Payment operations need idempotency
- Email sending should be fault-tolerant
- Database operations should be transactional

Input:
${userInput}

Output Format:
{
  "component": { ... }
}
`;
```

### Manipulator Generation Prompt

```typescript
const manipulatorPrompt = `
Generate a Manipulator (API) schema.

Requirements:
1. Follow RESTful conventions
2. Determine auth requirements per endpoint
3. Add validation for all inputs
4. Include pagination for list endpoints
5. Add filtering and search where mentioned
6. Define response formats
7. Set appropriate rate limits
8. Generate OpenAPI/Swagger documentation

Security:
- Public endpoints: read-only, safe operations
- Authenticated: user-specific operations
- Admin: destructive or sensitive operations

Input:
${userInput}

Output Format:
{
  "component": { ... }
}
`;
```

---

## Context-Aware Generation

AI considers existing components when generating new ones:

```typescript
async function generateComponentWithContext(
  description: string,
  componentType: ComponentType,
  existingComponents: Component[]
) {
  const context = {
    elements: existingComponents.filter(c => c.type === 'element'),
    helpers: existingComponents.filter(c => c.type === 'helper'),
    workers: existingComponents.filter(c => c.type === 'worker'),
    // ... other types
  };
  
  const prompt = `
  Existing System Context:
  ${JSON.stringify(context, null, 2)}
  
  New Component Description:
  Type: ${componentType}
  Description: ${description}
  
  Generate a schema that:
  1. Integrates well with existing components
  2. Reuses existing Helpers where appropriate
  3. Follows established naming conventions
  4. Maintains consistency with existing patterns
  5. Identifies potential relationships
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0.3, // Lower for consistency
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

## Relationship Detection

AI automatically identifies relationships between components:

**Example**:
```
User creates: Order Element
AI detects: Related to existing "User" and "Product" elements
AI suggests:
  - Foreign keys: userId, productId
  - Auditor: OrderAuditor for state transitions
  - Worker: OrderProcessingWorker for fulfillment
  - Helper: EmailHelper for notifications
```

---

## Iterative Refinement

Users can refine AI output through conversation:

```
User: "Actually, products should have categories"

AI: Interprets as additional property
Regenerates schema with:
  - category property (string or enum)
  - OR relationship to Category element (if categories are complex)
  - Updates indexes
  - Updates Manipulator to filter by category
```

---

## AI Safety & Validation

### Input Sanitization

```typescript
function sanitizeUserInput(input: string): string {
  // Remove potential prompt injection
  // Limit length
  // Remove executable code patterns
  return sanitized;
}
```

### Output Validation

```typescript
function validateAIOutput(output: any): boolean {
  // Must be valid JSON
  // Must match schema structure
  // No executable code in strings
  // No SQL/NoSQL injection patterns
  // No hardcoded secrets
  return valid;
}
```

### Rate Limiting

```typescript
const aiRateLimiter = {
  perUser: {
    requests: 50,
    period: '1 hour'
  },
  perProject: {
    requests: 200,
    period: '1 hour'
  }
};
```

---

## AI Cost Optimization

### Token Management

```typescript
// Efficient prompts
const shortPrompt = generateMinimalPrompt(userInput);

// Streaming for UX
const stream = await openai.chat.completions.create({
  stream: true,
  // ...
});

// Caching similar requests
const cacheKey = hash(componentType + description);
const cached = await redis.get(cacheKey);
```

### Model Selection

- **GPT-4**: Complex components, initial generation
- **GPT-3.5-turbo**: Simple refinements, iterations
- **Future**: Fine-tuned models for component generation

### Batch Processing

Generate multiple components in single request when possible:

```typescript
// Instead of 3 separate requests
// Generate Element + Manipulator + Auditor in one go
const batchPrompt = `Generate three components that work together: ...`;
```

---

## AI Enhancement Opportunities

### Phase 2
- **Learn from user edits**: Fine-tune model with accepted/rejected schemas
- **Project templates**: Learn patterns from successful projects
- **Smart defaults**: Improve defaults based on common use cases

### Phase 3
- **Custom AI models**: Train on worldbuilder-specific patterns
- **Multi-modal**: Support diagrams, screenshots as input
- **Predictive**: Suggest next components based on system analysis

---

## Fallback Strategy

If AI fails or produces invalid output:

1. **Retry with clarification**: Ask user for more details
2. **Template-based generation**: Use predefined templates
3. **Manual schema entry**: Provide form for direct schema creation
4. **Support escalation**: Human review for complex cases

---

## Privacy & Security

- User descriptions are sent to OpenAI (disclosed in terms)
- No PII or secrets should be in descriptions
- Schemas are validated for security issues before code generation
- Generated code never includes hardcoded credentials
- All secrets managed via environment variables

