# Worldbuilder - Core Components

## Component Types

Worldbuilder provides six fundamental building blocks that can be combined to create any system architecture.

---

## 1. Element

**Purpose**: Core data entities with state, behavior, and lifecycle management

**Characteristics**:
- Has properties (fields/attributes)
- Supports state transitions
- Can have behaviors (methods/actions)
- Can be persisted (database) or transient (in-memory)

### Properties

**Example User Input**:
```
"A Product with name (string), price (number), inventory (integer), 
and status (active/inactive/out-of-stock)"
```

**Generated Schema**:
```json
{
  "type": "element",
  "name": "Product",
  "persistence": "persisted",
  "properties": [
    { "name": "id", "type": "uuid", "primary": true, "generated": true },
    { "name": "name", "type": "string", "required": true, "maxLength": 255 },
    { "name": "price", "type": "decimal", "required": true, "min": 0 },
    { "name": "inventory", "type": "integer", "required": true, "min": 0 },
    { 
      "name": "status", 
      "type": "enum", 
      "values": ["active", "inactive", "out_of_stock"],
      "default": "active"
    },
    { "name": "createdAt", "type": "timestamp", "generated": true },
    { "name": "updatedAt", "type": "timestamp", "generated": true }
  ]
}
```

**Generated Artifacts**:
- Prisma schema definition
- TypeScript types/interfaces
- CRUD API endpoints
- Validation rules
- Database migration
- Unit tests

### Transitions

State changes with validation and side effects.

**Example**:
```
"When inventory reaches 0, automatically set status to out-of-stock"
```

**Generated**:
- State machine logic
- Transition validators
- Audit logging
- Event triggers

### Behaviors

Actions that can be performed on the element.

**Example**:
```
"Product can be restocked with a quantity, adding to current inventory"
```

**Generated**:
```typescript
async restock(quantity: number): Promise<Product> {
  // Validation
  if (quantity <= 0) {
    throw new ValidationError('Quantity must be positive');
  }
  
  // Update
  this.inventory += quantity;
  
  // Transition if needed
  if (this.status === 'out_of_stock' && this.inventory > 0) {
    await this.transitionTo('active');
  }
  
  // Audit
  await this.audit('restock', { quantity });
  
  return this;
}
```

### Persisted vs Transient

- **Persisted**: Stored in database, survives restarts
- **Transient**: In-memory only, for sessions, caches, temporary state

---

## 2. Helper

**Purpose**: Reusable utilities and integrations that assist in task completion

**Characteristics**:
- Stateless functions
- Integration adapters
- Utility operations
- No direct database access

### Use Cases

**Example User Inputs**:
```
"Email Helper - sends transactional emails via SendGrid"
"Payment Helper - processes payments through Stripe"
"PDF Helper - generates invoices as PDF documents"
"Geocoding Helper - converts addresses to coordinates"
```

**Generated Schema**:
```json
{
  "type": "helper",
  "name": "EmailHelper",
  "integration": "sendgrid",
  "methods": [
    {
      "name": "sendTransactional",
      "parameters": [
        { "name": "to", "type": "string", "required": true },
        { "name": "template", "type": "string", "required": true },
        { "name": "data", "type": "object" }
      ],
      "returns": { "type": "boolean" }
    }
  ],
  "configuration": {
    "apiKey": "${SENDGRID_API_KEY}",
    "fromEmail": "${FROM_EMAIL}"
  }
}
```

**Generated Artifacts**:
- Service class
- Configuration management
- Error handling
- Retry logic
- Integration tests
- Mock implementations (for testing)

---

## 3. Worker

**Purpose**: Asynchronous job processor with queue management

**Characteristics**:
- Processes background jobs
- Queue-based execution
- Job status tracking
- Retry and failure handling
- Progress notifications

### Job Queue Pattern

**Example User Input**:
```
"Order Processing Worker - validates inventory, charges payment, 
creates shipment, sends confirmation email. Retry 3 times if payment fails."
```

**Generated Schema**:
```json
{
  "type": "worker",
  "name": "OrderProcessingWorker",
  "queue": "orders",
  "concurrency": 5,
  "jobDefinition": {
    "input": {
      "orderId": "uuid",
      "userId": "uuid"
    },
    "steps": [
      { "action": "validateInventory", "helper": null },
      { "action": "chargePayment", "helper": "PaymentHelper" },
      { "action": "createShipment", "helper": "ShipmentHelper" },
      { "action": "sendConfirmation", "helper": "EmailHelper" }
    ],
    "retry": {
      "attempts": 3,
      "backoff": "exponential"
    },
    "timeout": 300000
  }
}
```

**Generated Artifacts**:
- BullMQ worker implementation
- Job processor logic
- Queue management endpoints
- Status tracking
- Failure handling
- Dead letter queue
- Worker tests

**Generated Code Structure**:
```typescript
class OrderProcessingWorker {
  private queue: Queue;
  private worker: Worker;
  
  async addJob(data: JobInput): Promise<Job> {
    return await this.queue.add('process-order', data);
  }
  
  async processJob(job: Job): Promise<JobResult> {
    // Step-by-step execution
    // Progress updates
    // Error handling
  }
  
  onCompleted(job: Job, result: JobResult): void {
    // Notification logic
  }
  
  onFailed(job: Job, error: Error): void {
    // Error handling
  }
}
```

---

## 4. Manipulator

**Purpose**: API layer that exposes operations to external consumers

**Characteristics**:
- RESTful or GraphQL endpoints
- Request validation
- Response formatting
- Authentication/authorization
- Rate limiting
- API documentation

### CRUD Operations

**Example User Input**:
```
"Product Manipulator - expose CRUD operations, allow filtering by status, 
searching by name, and custom restock endpoint"
```

**Generated Schema**:
```json
{
  "type": "manipulator",
  "name": "ProductManipulator",
  "element": "Product",
  "operations": {
    "create": {
      "enabled": true,
      "auth": "authenticated",
      "validation": "strict"
    },
    "read": {
      "enabled": true,
      "auth": "public",
      "filters": ["status", "name"],
      "pagination": true,
      "search": ["name"]
    },
    "update": {
      "enabled": true,
      "auth": "authenticated",
      "authorization": "owner"
    },
    "delete": {
      "enabled": true,
      "auth": "admin"
    }
  },
  "customEndpoints": [
    {
      "name": "restock",
      "method": "POST",
      "path": "/products/:id/restock",
      "auth": "authenticated"
    }
  ]
}
```

**Generated Artifacts**:
- Express route handlers
- Request validators (Zod schemas)
- Response serializers
- Swagger/OpenAPI documentation
- Integration tests
- Postman collection

### Job Submission

Workers are accessed through Manipulator endpoints:

```typescript
router.post('/orders/process', async (req, res) => {
  const job = await orderProcessingWorker.addJob(req.body);
  res.json({ 
    jobId: job.id, 
    status: 'queued',
    statusUrl: `/jobs/${job.id}/status`
  });
});
```

---

## 5. Auditor

**Purpose**: Validation, business rules enforcement, and audit trail management

**Characteristics**:
- Pre-transition validation
- Post-transition logging
- Business rule engine
- Audit trail storage
- Compliance reporting

### Validation Rules

**Example User Input**:
```
"Before an Order transitions to 'confirmed', verify that inventory is available 
and payment is valid. Log all status changes with user and timestamp."
```

**Generated Schema**:
```json
{
  "type": "auditor",
  "name": "OrderAuditor",
  "element": "Order",
  "rules": [
    {
      "trigger": "before_transition",
      "from": "pending",
      "to": "confirmed",
      "validations": [
        {
          "name": "checkInventory",
          "condition": "inventory.available >= order.quantity",
          "errorMessage": "Insufficient inventory"
        },
        {
          "name": "checkPayment",
          "condition": "payment.status === 'succeeded'",
          "errorMessage": "Payment not completed"
        }
      ]
    }
  ],
  "auditEvents": [
    "created",
    "updated",
    "deleted",
    "state_changed"
  ],
  "retention": "7 years"
}
```

**Generated Artifacts**:
- Validation middleware
- Audit log schema
- Business rule engine
- Audit query API
- Compliance reports

**Generated Code**:
```typescript
class OrderAuditor {
  async beforeTransition(
    order: Order, 
    from: string, 
    to: string
  ): Promise<ValidationResult> {
    // Run validation rules
    // Throw error if validation fails
  }
  
  async afterTransition(
    order: Order,
    from: string,
    to: string,
    user: User
  ): Promise<void> {
    await AuditLog.create({
      entityType: 'Order',
      entityId: order.id,
      action: 'state_transition',
      before: { status: from },
      after: { status: to },
      userId: user.id,
      timestamp: new Date(),
      metadata: { ... }
    });
  }
}
```

---

## 6. Enforcer

**Purpose**: Automated test generation and behavior locking

**Characteristics**:
- Unit test generation
- Integration test creation
- E2E test orchestration
- Test locking mechanism
- Regression prevention

### Test Generation

**Example User Input**:
```
"Lock the Product creation behavior - ensure name is required, 
price is positive, and status defaults to active"
```

**Generated Tests**:

```typescript
// Unit test
describe('Product Creation', () => {
  it('should require name', async () => {
    await expect(
      Product.create({ price: 10.00, inventory: 5 })
    ).rejects.toThrow('Name is required');
  });
  
  it('should require positive price', async () => {
    await expect(
      Product.create({ name: 'Test', price: -10, inventory: 5 })
    ).rejects.toThrow('Price must be positive');
  });
  
  it('should default status to active', async () => {
    const product = await Product.create({
      name: 'Test',
      price: 10.00,
      inventory: 5
    });
    expect(product.status).toBe('active');
  });
});
```

### Flow Locking

**Example**:
```
"Lock the order fulfillment flow - create order → process payment → 
ship order → send confirmation"
```

**Generated Integration Test**:
```typescript
describe('Order Fulfillment Flow', () => {
  it('should complete full order lifecycle', async () => {
    // Create order
    const order = await api.post('/orders').send({...});
    expect(order.status).toBe('pending');
    
    // Process payment
    const job = await api.post(`/orders/${order.id}/process-payment`);
    await waitForJobCompletion(job.id);
    
    // Verify order confirmed
    const updated = await api.get(`/orders/${order.id}`);
    expect(updated.status).toBe('confirmed');
    
    // Ship order
    await api.post(`/orders/${order.id}/ship`);
    
    // Verify email sent
    expect(mockEmailHelper.sendTransactional).toHaveBeenCalled();
  });
});
```

### E2E Locking

Playwright tests for full user journeys through the UI.

---

## 7. Workflow

**Purpose**: Orchestrates interactions between components

**Characteristics**:
- Visual flow definition
- Component connections
- Data flow mapping
- Error handling paths
- Event choreography

### Workflow Definition

**Example User Input** (Visual Canvas):
```
User Registration Flow:
1. User submits form (Manipulator)
2. Create User element (Element)
3. Validate email uniqueness (Auditor)
4. Send welcome email (Helper)
5. Queue onboarding job (Worker)
```

**Generated Schema**:
```json
{
  "type": "workflow",
  "name": "UserRegistrationWorkflow",
  "trigger": {
    "type": "http",
    "endpoint": "/auth/register"
  },
  "steps": [
    {
      "name": "validateInput",
      "component": "UserManipulator",
      "action": "validate"
    },
    {
      "name": "checkUniqueness",
      "component": "UserAuditor",
      "action": "validateUnique"
    },
    {
      "name": "createUser",
      "component": "User",
      "action": "create"
    },
    {
      "name": "sendWelcome",
      "component": "EmailHelper",
      "action": "sendTransactional"
    },
    {
      "name": "queueOnboarding",
      "component": "OnboardingWorker",
      "action": "addJob"
    }
  ],
  "errorHandling": {
    "uniquenessFailure": "return 409",
    "emailFailure": "log and continue"
  }
}
```

---

## Component Interaction Matrix

| From → To | Element | Helper | Worker | Manipulator | Auditor | Enforcer |
|-----------|---------|--------|--------|-------------|---------|----------|
| **Element** | ✓ | ✓ | ✓ | — | ✓ | — |
| **Helper** | ✓ | ✓ | — | — | — | — |
| **Worker** | ✓ | ✓ | ✓ | — | ✓ | — |
| **Manipulator** | ✓ | ✓ | ✓ | — | ✓ | — |
| **Auditor** | ✓ | ✓ | — | — | — | — |
| **Enforcer** | ✓ | ✓ | ✓ | ✓ | ✓ | — |

✓ = Common interaction pattern
— = Rare or avoided

---

## Blueprint System

Each component type has pre-built blueprints:

### Blueprint Structure
```
components/
├── element/
│   ├── base.template.ts
│   ├── validation.template.ts
│   ├── test.template.ts
│   └── migration.template.ts
├── worker/
│   ├── queue.template.ts
│   ├── processor.template.ts
│   └── test.template.ts
└── ...
```

### Blueprint Customization

AI fills in the blueprint with user-specific logic while maintaining:
- Code quality standards
- Security best practices
- Error handling
- Testing patterns
- Documentation

