# 🚀 Worldbuilder - Comprehensive Improvement Plan

## Executive Summary

This document outlines a strategic improvement plan for Worldbuilder, transforming it from an MVP code generator into a comprehensive, production-ready platform for building enterprise applications. The improvements focus on enhancing AI capabilities, improving user experience, and adding essential features for real-world applications.

---

## Current State Assessment

### ✅ What We Have (MVP Complete - 95%)

**Core Infrastructure:**
- React + TypeScript frontend with React Flow canvas
- Node.js + Express backend with Prisma ORM
- Supabase PostgreSQL database and authentication
- OpenAI GPT-4 integration for schema generation
- Component storage and management
- Basic code generation with Handlebars templates

**Component Types (Partially Implemented):**
- ✅ Element: Data entities with properties and relationships
- ✅ Manipulator: REST API endpoints
- ✅ Worker: Background job processors
- ✅ Helper: Utility integrations (SendGrid, Stripe, Twilio)
- ✅ Auditor: Validation and audit trails
- ✅ Enforcer: Test generation and locking
- ✅ Workflow: Component orchestration

**Current Capabilities:**
- Drag-and-drop component creation on canvas
- Natural language component descriptions
- AI-generated schemas with user review
- Code generation for all component types
- GitHub integration (basic)
- Railway deployment preparation
- Auto-suggestion of related components
- Automatic relationship detection

### 🚧 Current Limitations & Pain Points

**1. Component Management:**
- ❌ Cannot rename AI-suggested components before creation
- ❌ No way to link suggested components to existing ones
- ❌ Duplicate components created when AI suggests existing entities
- ❌ No component library or reusable component catalog

**2. AI Code Generation:**
- ❌ Generated code contains TODO placeholders
- ❌ Logic not fully implemented (especially for Workers, Enforcers, Auditors)
- ❌ AI doesn't consider full system context when generating logic
- ❌ No "Magic Mode" - manual work required to complete implementation
- ❌ Custom methods and lifecycle hooks are scaffolds, not implementations

**3. Workflow & Build Process:**
- ❌ Components created one-by-one, not from single comprehensive prompt
- ❌ No multi-component approval workflow
- ❌ No build progress tracking
- ❌ Cannot test or preview generated code in platform
- ❌ No live preview or sandbox environment

**4. UI/Frontend:**
- ❌ No UI builder for generating frontend code
- ❌ Only backend generation currently
- ❌ No component-to-UI mapping
- ❌ No form generator for admin interfaces

**5. Documentation:**
- ❌ No automatic API documentation export
- ❌ No architecture diagram generation
- ❌ No system documentation from canvas
- ❌ Limited OpenAPI/Swagger generation

**6. RBAC & Security:**
- ❌ Basic RBAC only (admin/user roles)
- ❌ No custom role creation
- ❌ No permission granularity
- ❌ No row-level security configuration

**7. Data Operations:**
- ❌ No bulk data operations
- ❌ No ETL task support
- ❌ No data import/export helpers
- ❌ No batch processing workflows

**8. Integration Patterns:**
- ❌ No input connectors (webhooks, scanners, OCR)
- ❌ No output connectors (logging, printers, FCM, webhooks)
- ❌ Limited helper templates
- ❌ No event-driven architecture support

---

## Improvement Roadmap

### Phase 1: Enhanced Component Management (4-6 weeks)

**Priority: CRITICAL**

#### 1.1 Component Naming & Linking System

**Goal:** Allow users to rename suggested components and link to existing ones before creation.

**Implementation:**

```typescript
// New ComponentSuggestionModal.tsx
interface SuggestedComponent {
  id: string;
  type: ComponentType;
  name: string;
  suggestedName: string;
  description: string;
  schema: any;
  action: 'create' | 'link';
  linkedTo?: string; // ID of existing component
  newName?: string; // User's renamed version
}

interface ComponentSuggestionReviewProps {
  suggestions: SuggestedComponent[];
  existingComponents: Component[];
  onApprove: (approved: SuggestedComponent[]) => void;
  onReject: () => void;
}
```

**UI Features:**
- **Suggestion Review Screen**
  - List all AI-suggested components
  - Show which ones already exist (highlighted)
  - Rename input for each suggested component
  - "Link to Existing" dropdown to select existing component
  - "Create New" / "Use Existing" toggle
  - Bulk approval with checkboxes
  
- **Smart Matching**
  - Fuzzy matching to detect similar existing components
  - "Did you mean: UserAccount?" suggestions
  - Show schema diff between suggested and existing
  - Confidence score for matches

**Backend Changes:**

```typescript
// New endpoint: POST /api/components/validate-suggestions
interface ValidateSuggestionsRequest {
  projectId: string;
  suggestions: ComponentSuggestion[];
}

interface ValidateSuggestionsResponse {
  suggestions: Array<{
    suggestion: ComponentSuggestion;
    existingMatch?: Component;
    confidence: number;
    recommendation: 'create' | 'link' | 'review';
  }>;
}
```

**Database Changes:**

```prisma
model Component {
  // ... existing fields
  aliases       String[] // Alternative names for matching
  linkedFrom    Component[] @relation("ComponentLinks")
  linkedTo      Component[] @relation("ComponentLinks")
}
```

**Deliverables:**
- [ ] Component suggestion review modal
- [ ] Fuzzy matching algorithm
- [ ] Link to existing component functionality
- [ ] Rename before creation
- [ ] Validation API endpoint
- [ ] Unit tests for matching logic
- [ ] E2E tests for user flow

**Success Metrics:**
- Zero duplicate components created
- >90% user satisfaction with naming control
- <5 seconds to review suggestions

---

#### 1.2 Component Library & Templates

**Goal:** Create reusable component templates and a searchable library.

**Implementation:**

**Features:**
- **Template Library**
  - Pre-built components (User, Product, Order, Payment, etc.)
  - Industry templates (E-commerce, SaaS, CMS)
  - Custom templates saved from user's components
  - Template versioning
  
- **Component Marketplace (Future)**
  - Share templates with community
  - Ratings and reviews
  - Import from marketplace

**UI:**

```typescript
interface ComponentLibrary {
  categories: Array<{
    name: string;
    icon: string;
    templates: ComponentTemplate[];
  }>;
}

interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  type: ComponentType;
  schema: any;
  preview: string; // Visual preview
  tags: string[];
  usageCount: number;
  rating?: number;
}
```

**Database Changes:**

```prisma
model ComponentTemplate {
  id          String   @id @default(uuid())
  name        String
  description String?
  type        String
  schema      Json
  isPublic    Boolean  @default(false)
  createdBy   String   @map("created_by")
  category    String?
  tags        String[]
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("component_templates")
}
```

**Deliverables:**
- [ ] Template library UI
- [ ] Template CRUD APIs
- [ ] Pre-built templates (20+ common components)
- [ ] Template import/export
- [ ] Search and filter functionality

---

### Phase 2: AI Logic Generation & "Magic Mode" (6-8 weeks)

**Priority: CRITICAL - This is the killer feature**

#### 2.1 Full System Context for AI

**Goal:** AI has complete understanding of entire project when generating code.

**Implementation:**

```typescript
interface SystemContext {
  project: {
    id: string;
    name: string;
    description: string;
  };
  
  components: {
    elements: ElementComponent[];
    manipulators: ManipulatorComponent[];
    workers: WorkerComponent[];
    helpers: HelperComponent[];
    auditors: AuditorComponent[];
    enforcers: EnforcerComponent[];
    workflows: WorkflowComponent[];
  };
  
  relationships: Array<{
    from: string;
    to: string;
    type: RelationType;
  }>;
  
  integrations: {
    email: boolean;
    payment: boolean;
    storage: boolean;
    sms: boolean;
  };
  
  patterns: {
    authMethod: 'jwt' | 'session';
    database: 'postgresql' | 'mysql';
    hasRBAC: boolean;
    hasMultiTenancy: boolean;
  };
}

// Enhanced AI prompt with full context
function buildAIPrompt(
  component: Component,
  context: SystemContext,
  mode: 'scaffold' | 'magic'
): string {
  if (mode === 'magic') {
    return `
You are generating PRODUCTION-READY code for a ${component.type}.

FULL SYSTEM CONTEXT:
${JSON.stringify(context, null, 2)}

COMPONENT TO IMPLEMENT:
${JSON.stringify(component, null, 2)}

REQUIREMENTS:
1. Generate COMPLETE, WORKING implementations (NO TODOs)
2. Use existing components where appropriate
3. Include proper error handling
4. Add logging with Winston
5. Implement all custom methods with real business logic
6. Lifecycle hooks should actually call other components
7. Use TypeScript strict mode
8. Add JSDoc comments
9. Follow SOLID principles
10. Include input validation

AVAILABLE COMPONENTS:
${context.components.helpers.map(h => `- ${h.name}: ${h.description}`).join('\n')}
${context.components.workers.map(w => `- ${w.name}: ${w.description}`).join('\n')}
${context.components.auditors.map(a => `- ${a.name}: ${a.description}`).join('\n')}

RELATIONSHIPS:
${context.relationships.map(r => `- ${r.from} ${r.type} ${r.to}`).join('\n')}

Generate complete, production-ready TypeScript code.
`;
  }
  
  // Scaffold mode - current behavior
  return buildScaffoldPrompt(component);
}
```

**AI Enhancements:**

```typescript
class MagicModeGenerator {
  async generateWithMagic(
    component: Component,
    project: Project
  ): Promise<GeneratedCode> {
    // 1. Build comprehensive context
    const context = await this.buildSystemContext(project);
    
    // 2. Generate with GPT-4 (higher token limit)
    const prompt = buildAIPrompt(component, context, 'magic');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Better for code generation
      messages: [
        { role: 'system', content: MAGIC_MODE_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2, // Lower for deterministic code
      max_tokens: 4000, // Allow longer responses
    });
    
    // 3. Parse and validate generated code
    const code = this.parseGeneratedCode(response);
    
    // 4. Run linting
    const linted = await this.lintCode(code);
    
    // 5. Validate against system context
    const validated = await this.validateAgainstContext(linted, context);
    
    return validated;
  }
  
  private async buildSystemContext(project: Project): Promise<SystemContext> {
    const components = await prisma.component.findMany({
      where: { projectId: project.id }
    });
    
    // Organize by type
    const grouped = _.groupBy(components, 'type');
    
    // Extract relationships
    const relationships = this.extractRelationships(components);
    
    // Detect patterns
    const patterns = this.detectPatterns(components);
    
    // Detect integrations
    const integrations = this.detectIntegrations(components);
    
    return {
      project,
      components: grouped,
      relationships,
      patterns,
      integrations,
    };
  }
}
```

**Deliverables:**
- [ ] System context builder
- [ ] Enhanced AI prompts with full context
- [ ] Magic Mode toggle in UI
- [ ] Code validation against context
- [ ] Integration testing for generated code
- [ ] Magic Mode documentation

---

#### 2.2 Intelligent Logic Generation for Each Component Type

**Worker Logic Generation:**

```typescript
// AI generates ACTUAL worker logic
class OrderProcessingWorker {
  async processJob(job: Job<OrderData>): Promise<void> {
    const { orderId } = job.data;
    
    // AI knows to use existing services
    const order = await orderService.findById(orderId);
    
    // Step 1: Validate inventory (AI generates actual logic)
    await job.updateProgress(20);
    for (const item of order.items) {
      const product = await productService.findById(item.productId);
      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }
      await productService.decrementInventory(item.productId, item.quantity);
    }
    
    // Step 2: Charge payment (AI knows PaymentHelper exists)
    await job.updateProgress(40);
    const paymentHelper = new PaymentHelper();
    const paymentResult = await paymentHelper.charge({
      amount: order.total,
      currency: 'usd',
      customerId: order.customerId,
    });
    
    if (!paymentResult.success) {
      // AI generates proper rollback
      await this.rollbackInventory(order);
      throw new Error('Payment failed');
    }
    
    // Step 3: Update order status (AI uses auditor)
    await job.updateProgress(60);
    await orderService.updateStatus(orderId, 'confirmed');
    
    // Step 4: Send email (AI uses EmailHelper)
    await job.updateProgress(80);
    const emailHelper = new EmailHelper();
    await emailHelper.sendTransactional({
      to: order.customerEmail,
      template: 'order-confirmation',
      data: { order, items: order.items },
    });
    
    await job.updateProgress(100);
  }
  
  // AI generates rollback logic
  private async rollbackInventory(order: Order): Promise<void> {
    for (const item of order.items) {
      await productService.incrementInventory(item.productId, item.quantity);
    }
  }
}
```

**Auditor Logic Generation:**

```typescript
// AI generates REAL validation rules
class OrderAuditor {
  async beforeCreate(data: CreateOrderDto): Promise<void> {
    // AI generates actual business rules
    if (data.items.length === 0) {
      throw new ValidationError('Order must have at least one item');
    }
    
    // Check total matches item prices
    const calculatedTotal = data.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    if (Math.abs(calculatedTotal - data.total) > 0.01) {
      throw new ValidationError('Order total does not match items');
    }
    
    // Verify customer exists
    const customer = await userService.findById(data.customerId);
    if (!customer) {
      throw new ValidationError('Customer not found');
    }
    
    // Check inventory availability
    for (const item of data.items) {
      const product = await productService.findById(item.productId);
      if (product.inventory < item.quantity) {
        throw new ValidationError(
          `Insufficient inventory for ${product.name}`
        );
      }
    }
  }
  
  async beforeTransition(
    order: Order,
    from: OrderStatus,
    to: OrderStatus
  ): Promise<void> {
    // AI generates state transition rules
    if (from === 'pending' && to === 'confirmed') {
      // Verify payment was successful
      if (!order.paymentId) {
        throw new ValidationError('Cannot confirm order without payment');
      }
      
      const payment = await paymentService.findById(order.paymentId);
      if (payment.status !== 'succeeded') {
        throw new ValidationError('Payment not successful');
      }
    }
    
    if (from === 'confirmed' && to === 'shipped') {
      // Verify shipment was created
      if (!order.shipmentId) {
        throw new ValidationError('Cannot ship order without shipment');
      }
    }
    
    // Can't cancel after shipping
    if (from === 'shipped' && to === 'cancelled') {
      throw new ValidationError('Cannot cancel order after shipping');
    }
  }
}
```

**Manipulator Logic Generation:**

```typescript
// AI generates COMPLETE API endpoints
class OrderController {
  // AI generates proper error handling
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validated = CreateOrderSchema.parse(req.body);
      
      // AI knows to use auditor
      await orderAuditor.beforeCreate(validated);
      
      // AI knows to use service
      const order = await orderService.create(validated, req.user!.id);
      
      // AI knows to trigger worker
      await orderProcessingWorker.addJob({
        orderId: order.id,
        userId: req.user!.id,
      });
      
      res.status(201).json({
        order,
        message: 'Order created and queued for processing',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Order creation failed:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
  
  // AI generates complex queries
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as OrderStatus;
      const userId = req.query.userId as string;
      
      const where: any = {};
      
      // AI generates proper filtering
      if (status) {
        where.status = status;
      }
      
      // AI respects RBAC
      if (req.user!.role !== 'admin') {
        where.userId = req.user!.id;
      } else if (userId) {
        where.userId = userId;
      }
      
      const [orders, total] = await Promise.all([
        orderService.findAll({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            items: {
              include: {
                product: true,
              },
            },
            customer: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        }),
        orderService.count({ where }),
      ]);
      
      res.json({
        data: orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Order listing failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // AI generates custom endpoints
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const order = await orderService.findById(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // AI generates proper authorization
      if (req.user!.role !== 'admin' && order.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // AI uses custom service method
      const cancelled = await orderService.cancel(id, reason, req.user!.id);
      
      res.json({ order: cancelled });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Order cancellation failed:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
```

**Workflow Logic Generation:**

```typescript
// AI generates COMPLETE workflow orchestration
class UserRegistrationWorkflow {
  constructor(
    private userService: UserService,
    private emailHelper: EmailHelper,
    private onboardingWorker: OnboardingWorker,
    private userAuditor: UserAuditor
  ) {}
  
  async execute(data: UserRegistrationData): Promise<WorkflowResult> {
    const context: WorkflowContext = {
      data,
      results: {},
      errors: [],
    };
    
    try {
      // Step 1: Validate input (AI knows about auditor)
      await this.validateInput(context);
      
      // Step 2: Check uniqueness (AI generates query)
      await this.checkUniqueness(context);
      
      // Step 3: Create user (AI uses service)
      await this.createUser(context);
      
      // Step 4: Send welcome email (AI uses helper)
      await this.sendWelcomeEmail(context);
      
      // Step 5: Queue onboarding (AI uses worker)
      await this.queueOnboarding(context);
      
      return {
        success: true,
        user: context.results.user,
      };
    } catch (error) {
      // AI generates proper error handling
      await this.handleError(context, error);
      throw error;
    }
  }
  
  private async validateInput(context: WorkflowContext): Promise<void> {
    // AI generates validation
    const { email, password, name } = context.data;
    
    if (!email || !email.includes('@')) {
      throw new ValidationError('Invalid email address');
    }
    
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    
    // AI uses auditor
    await this.userAuditor.beforeCreate(context.data);
  }
  
  private async checkUniqueness(context: WorkflowContext): Promise<void> {
    // AI generates database query
    const existing = await this.userService.findByEmail(context.data.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }
  }
  
  private async createUser(context: WorkflowContext): Promise<void> {
    // AI uses service
    const user = await this.userService.create(context.data);
    context.results.user = user;
  }
  
  private async sendWelcomeEmail(context: WorkflowContext): Promise<void> {
    // AI uses helper with proper error handling
    try {
      await this.emailHelper.sendTransactional({
        to: context.results.user.email,
        template: 'welcome',
        data: {
          name: context.results.user.name,
          verificationUrl: `${process.env.APP_URL}/verify/${context.results.user.id}`,
        },
      });
    } catch (error) {
      // AI makes email failure non-critical
      logger.warn('Welcome email failed:', error);
      context.errors.push({
        step: 'sendWelcomeEmail',
        error: error.message,
        critical: false,
      });
    }
  }
  
  private async queueOnboarding(context: WorkflowContext): Promise<void> {
    // AI uses worker
    await this.onboardingWorker.addJob({
      userId: context.results.user.id,
    });
  }
  
  private async handleError(
    context: WorkflowContext,
    error: Error
  ): Promise<void> {
    // AI generates rollback logic
    if (context.results.user) {
      try {
        await this.userService.delete(context.results.user.id);
        logger.info('User creation rolled back');
      } catch (rollbackError) {
        logger.error('Rollback failed:', rollbackError);
      }
    }
  }
}
```

**Deliverables:**
- [ ] Enhanced AI prompts for each component type
- [ ] Context-aware code generation
- [ ] Logic validation framework
- [ ] Component interaction validation
- [ ] Comprehensive testing of generated code
- [ ] Magic Mode UI toggle
- [ ] Before/after comparison view

---

#### 2.3 Single-Prompt Multi-Component Generation

**Goal:** Generate entire system from single comprehensive description.

**Implementation:**

```typescript
interface MultiComponentPrompt {
  description: string; // "Build an e-commerce platform with products, orders, payments"
  requirements?: string[];
  features?: string[];
  integrations?: string[];
}

interface GenerationPlan {
  components: Array<{
    type: ComponentType;
    name: string;
    description: string;
    dependencies: string[];
    priority: number;
  }>;
  relationships: Relationship[];
  workflows: Workflow[];
  estimatedTime: number; // seconds
}

class MultiComponentGenerator {
  async planFromPrompt(prompt: MultiComponentPrompt): Promise<GenerationPlan> {
    // AI analyzes prompt and creates comprehensive plan
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: MULTI_COMPONENT_PLANNER_PROMPT },
        { role: 'user', content: JSON.stringify(prompt) }
      ],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(aiResponse.choices[0].message.content);
  }
  
  async generateFromPlan(
    plan: GenerationPlan,
    projectId: string,
    onProgress: (progress: GenerationProgress) => void
  ): Promise<GenerationResult> {
    const results: ComponentResult[] = [];
    const total = plan.components.length;
    let completed = 0;
    
    // Sort by priority and dependencies
    const sorted = this.topologicalSort(plan.components);
    
    for (const componentPlan of sorted) {
      try {
        onProgress({
          phase: 'generation',
          current: completed + 1,
          total,
          component: componentPlan.name,
          message: `Generating ${componentPlan.type}: ${componentPlan.name}...`,
        });
        
        // Generate with full context
        const component = await this.generateComponent(
          componentPlan,
          projectId,
          results // Previously generated components
        );
        
        results.push(component);
        completed++;
        
      } catch (error) {
        onProgress({
          phase: 'error',
          current: completed + 1,
          total,
          component: componentPlan.name,
          message: `Failed to generate ${componentPlan.name}: ${error.message}`,
          error: true,
        });
        
        // Continue with other components
        results.push({
          name: componentPlan.name,
          success: false,
          error: error.message,
        });
      }
    }
    
    return {
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }
}
```

**UI Flow:**

1. **Prompt Input Screen**
   ```
   ┌─────────────────────────────────────────────────┐
   │  🪄 Build Your Application                      │
   ├─────────────────────────────────────────────────┤
   │                                                  │
   │  Describe your application:                     │
   │  ┌─────────────────────────────────────────┐   │
   │  │ I need an e-commerce platform with       │   │
   │  │ products, categories, shopping cart,     │   │
   │  │ orders, and payment processing via       │   │
   │  │ Stripe. Users should be able to browse,  │   │
   │  │ search products, add to cart, and        │   │
   │  │ checkout. Admin panel for managing       │   │
   │  │ inventory.                                │   │
   │  └─────────────────────────────────────────┘   │
   │                                                  │
   │  Additional Requirements (optional):             │
   │  ☑ Email notifications                         │
   │  ☑ Inventory management                        │
   │  ☑ Order tracking                              │
   │  ☐ Customer reviews                            │
   │  ☐ Wishlist                                    │
   │                                                  │
   │  [🧠 Analyze & Plan]                            │
   └─────────────────────────────────────────────────┘
   ```

2. **Generation Plan Review**
   ```
   ┌─────────────────────────────────────────────────┐
   │  📋 Proposed Architecture                       │
   ├─────────────────────────────────────────────────┤
   │                                                  │
   │  The AI will create 23 components:              │
   │                                                  │
   │  📦 Elements (7)                                │
   │    ✓ Product (name, price, inventory, category)│
   │    ✓ Category (name, description)              │
   │    ✓ CartItem (product, quantity, user)        │
   │    ✓ Order (items, total, status, user)        │
   │    ✓ OrderItem (product, quantity, price)      │
   │    ✓ User (email, name, role)                  │
   │    ✓ Payment (order, amount, status, stripeId) │
   │                                                  │
   │  🌐 APIs (7)                                    │
   │    ✓ Product API (CRUD, search, filter)        │
   │    ✓ Category API (CRUD, products)             │
   │    ✓ Cart API (add, remove, update, clear)     │
   │    ✓ Order API (create, list, track)           │
   │    ✓ Payment API (process, refund)             │
   │    ... see all                                  │
   │                                                  │
   │  ⚙️ Workers (3)                                 │
   │    ✓ Order Processing Worker                   │
   │    ✓ Inventory Sync Worker                     │
   │    ✓ Email Notification Worker                 │
   │                                                  │
   │  🔧 Helpers (3)                                 │
   │    ✓ Stripe Payment Helper                     │
   │    ✓ SendGrid Email Helper                     │
   │    ✓ Image Upload Helper                       │
   │                                                  │
   │  📋 Auditors (2)                                │
   │    ✓ Order Auditor                             │
   │    ✓ Product Auditor                           │
   │                                                  │
   │  🔄 Workflows (1)                               │
   │    ✓ Checkout Workflow                         │
   │                                                  │
   │  ⏱️  Estimated Generation Time: 3-5 minutes     │
   │                                                  │
   │  [✓ Approve All] [✏️ Customize] [🚫 Cancel]    │
   └─────────────────────────────────────────────────┘
   ```

3. **Generation Progress**
   ```
   ┌─────────────────────────────────────────────────┐
   │  🔨 Generating Your Application...              │
   ├─────────────────────────────────────────────────┤
   │                                                  │
   │  Progress: 8 / 23 components (35%)              │
   │  ████████░░░░░░░░░░░░░░░░░░                     │
   │                                                  │
   │  Current: Generating Worker: Order Processing   │
   │                                                  │
   │  Recently Completed:                            │
   │  ✅ Element: Product                            │
   │  ✅ Element: Category                           │
   │  ✅ Element: CartItem                           │
   │  ✅ Element: Order                              │
   │  ✅ Element: OrderItem                          │
   │  ✅ Element: User                               │
   │  ✅ Element: Payment                            │
   │  ✅ API: Product API                            │
   │                                                  │
   │  [View Details] [Cancel Generation]             │
   └─────────────────────────────────────────────────┘
   ```

4. **Completion Summary**
   ```
   ┌─────────────────────────────────────────────────┐
   │  ✅ Application Generated Successfully!         │
   ├─────────────────────────────────────────────────┤
   │                                                  │
   │  23 / 23 components created                     │
   │  0 errors                                        │
   │  Time taken: 4 minutes 32 seconds              │
   │                                                  │
   │  Your application is ready:                     │
   │  • All components on canvas                     │
   │  • Relationships configured                     │
   │  • Full implementations generated               │
   │  • Tests created                                │
   │                                                  │
   │  Next Steps:                                    │
   │  [👁️ View Canvas] [⚙️ Configure] [🚀 Deploy]  │
   └─────────────────────────────────────────────────┘
   ```

**Deliverables:**
- [ ] Multi-component prompt analyzer
- [ ] Generation plan creator
- [ ] Topological sort for dependencies
- [ ] Progress tracking UI
- [ ] Error recovery and partial generation
- [ ] Plan customization before generation
- [ ] Generation summary and stats

---

### Phase 3: Build, Test & Preview System (6-8 weeks)

**Priority: HIGH**

#### 3.1 Integrated Build System

**Goal:** Build and test generated code within the platform.

**Implementation:**

```typescript
interface BuildSystem {
  build(projectId: string): Promise<BuildResult>;
  test(projectId: string): Promise<TestResult>;
  preview(projectId: string): Promise<PreviewEnvironment>;
}

interface BuildResult {
  success: boolean;
  duration: number; // ms
  output: string[];
  errors: BuildError[];
  warnings: BuildWarning[];
  artifacts: {
    sourceFiles: number;
    testFiles: number;
    size: number; // bytes
  };
}

interface TestResult {
  success: boolean;
  duration: number;
  tests: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  failures: TestFailure[];
}

interface PreviewEnvironment {
  url: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  logs: string[];
  health: {
    database: boolean;
    redis: boolean;
    app: boolean;
  };
}
```

**Backend Service:**

```typescript
class BuildService {
  async build(projectId: string): Promise<BuildResult> {
    const startTime = Date.now();
    
    try {
      // 1. Generate code
      const files = await codeGenerator.generateProject(projectId);
      
      // 2. Create temporary directory
      const buildDir = await this.createBuildDirectory(projectId);
      
      // 3. Write files
      await this.writeFiles(buildDir, files);
      
      // 4. Install dependencies
      await this.installDependencies(buildDir);
      
      // 5. Generate Prisma client
      await this.generatePrisma(buildDir);
      
      // 6. Run TypeScript compiler
      const compileResult = await this.compile(buildDir);
      
      if (!compileResult.success) {
        return {
          success: false,
          duration: Date.now() - startTime,
          output: compileResult.output,
          errors: compileResult.errors,
          warnings: compileResult.warnings,
          artifacts: { sourceFiles: 0, testFiles: 0, size: 0 },
        };
      }
      
      // 7. Calculate artifacts
      const artifacts = await this.calculateArtifacts(buildDir);
      
      return {
        success: true,
        duration: Date.now() - startTime,
        output: compileResult.output,
        errors: [],
        warnings: compileResult.warnings,
        artifacts,
      };
      
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        output: [],
        errors: [{ message: error.message, file: null, line: null }],
        warnings: [],
        artifacts: { sourceFiles: 0, testFiles: 0, size: 0 },
      };
    }
  }
  
  private async compile(buildDir: string): Promise<CompileResult> {
    return new Promise((resolve) => {
      const tsc = spawn('npx', ['tsc', '--noEmit'], { cwd: buildDir });
      
      const output: string[] = [];
      const errors: BuildError[] = [];
      
      tsc.stdout.on('data', (data) => {
        output.push(data.toString());
      });
      
      tsc.stderr.on('data', (data) => {
        const error = this.parseTypeScriptError(data.toString());
        errors.push(error);
      });
      
      tsc.on('close', (code) => {
        resolve({
          success: code === 0,
          output,
          errors,
          warnings: [],
        });
      });
    });
  }
}

class TestService {
  async runTests(projectId: string): Promise<TestResult> {
    const startTime = Date.now();
    const buildDir = this.getBuildDirectory(projectId);
    
    try {
      // Run Vitest
      const result = await this.runVitest(buildDir);
      
      return {
        success: result.success,
        duration: Date.now() - startTime,
        tests: result.tests,
        coverage: result.coverage,
        failures: result.failures,
      };
      
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
        coverage: { lines: 0, functions: 0, branches: 0, statements: 0 },
        failures: [{ test: 'Setup', error: error.message }],
      };
    }
  }
  
  private async runVitest(buildDir: string): Promise<VitestResult> {
    return new Promise((resolve) => {
      const vitest = spawn('npx', ['vitest', 'run', '--coverage'], {
        cwd: buildDir,
      });
      
      let output = '';
      
      vitest.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      vitest.on('close', (code) => {
        const parsed = this.parseVitestOutput(output);
        resolve({
          success: code === 0,
          ...parsed,
        });
      });
    });
  }
}

class PreviewService {
  private environments = new Map<string, PreviewEnvironment>();
  
  async start(projectId: string): Promise<PreviewEnvironment> {
    // Stop existing preview if any
    await this.stop(projectId);
    
    const buildDir = this.getBuildDirectory(projectId);
    
    // Start database (Docker)
    await this.startDatabase(projectId);
    
    // Start Redis if needed
    const hasWorkers = await this.projectHasWorkers(projectId);
    if (hasWorkers) {
      await this.startRedis(projectId);
    }
    
    // Run migrations
    await this.runMigrations(buildDir);
    
    // Start application
    const port = await this.getAvailablePort();
    const app = spawn('npm', ['run', 'dev'], {
      cwd: buildDir,
      env: {
        ...process.env,
        PORT: port.toString(),
        DATABASE_URL: this.getDatabaseUrl(projectId),
        ...(hasWorkers && { REDIS_URL: this.getRedisUrl(projectId) }),
      },
    });
    
    const environment: PreviewEnvironment = {
      url: `http://localhost:${port}`,
      status: 'starting',
      logs: [],
      health: {
        database: false,
        redis: !hasWorkers,
        app: false,
      },
    };
    
    // Collect logs
    app.stdout.on('data', (data) => {
      const log = data.toString();
      environment.logs.push(log);
      
      // Check if app is ready
      if (log.includes('running on port')) {
        environment.status = 'running';
        environment.health.app = true;
      }
    });
    
    app.stderr.on('data', (data) => {
      environment.logs.push(`ERROR: ${data.toString()}`);
    });
    
    app.on('close', () => {
      environment.status = 'stopped';
    });
    
    this.environments.set(projectId, environment);
    
    // Wait for health check
    await this.waitForHealthy(environment);
    
    return environment;
  }
  
  async stop(projectId: string): Promise<void> {
    const env = this.environments.get(projectId);
    if (!env) return;
    
    // Stop application
    // Stop database
    // Stop Redis
    
    this.environments.delete(projectId);
  }
}
```

**UI Components:**

```typescript
// BuildPanel.tsx
interface BuildPanelProps {
  projectId: string;
}

export function BuildPanel({ projectId }: BuildPanelProps) {
  const [buildStatus, setBuildStatus] = useState<BuildResult | null>(null);
  const [testStatus, setTestStatus] = useState<TestResult | null>(null);
  const [previewEnv, setPreviewEnv] = useState<PreviewEnvironment | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const handleBuild = async () => {
    setIsBuilding(true);
    try {
      const result = await api.build(projectId);
      setBuildStatus(result);
      
      if (result.success) {
        toast.success('Build completed successfully');
      } else {
        toast.error('Build failed - see details');
      }
    } finally {
      setIsBuilding(false);
    }
  };
  
  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await api.test(projectId);
      setTestStatus(result);
      
      if (result.success) {
        toast.success(`All ${result.tests.passed} tests passed`);
      } else {
        toast.error(`${result.tests.failed} tests failed`);
      }
    } finally {
      setIsTesting(false);
    }
  };
  
  const handlePreview = async () => {
    try {
      const env = await api.preview.start(projectId);
      setPreviewEnv(env);
      toast.success('Preview environment started');
    } catch (error) {
      toast.error('Failed to start preview');
    }
  };
  
  return (
    <div className="build-panel">
      <div className="actions">
        <Button
          onClick={handleBuild}
          loading={isBuilding}
          icon={<HammerIcon />}
        >
          Build
        </Button>
        
        <Button
          onClick={handleTest}
          loading={isTesting}
          disabled={!buildStatus?.success}
          icon={<TestTubeIcon />}
        >
          Test
        </Button>
        
        <Button
          onClick={handlePreview}
          disabled={!buildStatus?.success}
          icon={<PlayIcon />}
        >
          Preview
        </Button>
      </div>
      
      {buildStatus && (
        <BuildResults result={buildStatus} />
      )}
      
      {testStatus && (
        <TestResults result={testStatus} />
      )}
      
      {previewEnv && (
        <PreviewPanel environment={previewEnv} />
      )}
    </div>
  );
}
```

**Deliverables:**
- [ ] Build service implementation
- [ ] Test runner integration
- [ ] Preview environment manager
- [ ] Docker orchestration for preview
- [ ] Build status UI
- [ ] Test results visualization
- [ ] Live preview iframe
- [ ] Log streaming
- [ ] Health monitoring

---

### Phase 4: UI Builder & Frontend Generation (8-10 weeks)

**Priority: HIGH**

#### 4.1 Admin UI Auto-Generation

**Goal:** Generate React admin interfaces for CRUD operations.

**Implementation:**

```typescript
interface UIGenerationOptions {
  framework: 'react' | 'vue' | 'angular';
  library: 'material-ui' | 'chakra' | 'ant-design' | 'tailwind';
  features: {
    tables: boolean;
    forms: boolean;
    charts: boolean;
    authentication: boolean;
  };
}

class UIGenerator {
  async generateAdminUI(
    project: Project,
    options: UIGenerationOptions
  ): Promise<GeneratedUI> {
    const components = await this.getProjectComponents(project.id);
    const elements = components.filter(c => c.type === 'element');
    
    const files: GeneratedFile[] = [];
    
    // Generate layout
    files.push(...await this.generateLayout(options));
    
    // Generate navigation
    files.push(...await this.generateNavigation(elements, options));
    
    // Generate CRUD pages for each element
    for (const element of elements) {
      files.push(...await this.generateCRUDPages(element, options));
    }
    
    // Generate forms
    for (const element of elements) {
      files.push(...await this.generateForms(element, options));
    }
    
    // Generate API client
    files.push(...await this.generateAPIClient(components, options));
    
    // Generate authentication
    if (options.features.authentication) {
      files.push(...await this.generateAuth(options));
    }
    
    return {
      files,
      dependencies: this.getDependencies(options),
    };
  }
  
  private async generateCRUDPages(
    element: Component,
    options: UIGenerationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const schema = element.schema;
    const name = element.name;
    
    // List page
    const listTemplate = await this.loadUITemplate('crud/list.tsx.hbs');
    const listContent = this.compileTemplate(listTemplate, {
      ...schema,
      name,
      library: options.library,
    });
    files.push({
      path: `src/pages/${kebabCase(name)}/List.tsx`,
      content: listContent,
    });
    
    // Detail page
    const detailTemplate = await this.loadUITemplate('crud/detail.tsx.hbs');
    const detailContent = this.compileTemplate(detailTemplate, {
      ...schema,
      name,
      library: options.library,
    });
    files.push({
      path: `src/pages/${kebabCase(name)}/Detail.tsx`,
      content: detailContent,
    });
    
    // Create page
    const createTemplate = await this.loadUITemplate('crud/create.tsx.hbs');
    const createContent = this.compileTemplate(createTemplate, {
      ...schema,
      name,
      library: options.library,
    });
    files.push({
      path: `src/pages/${kebabCase(name)}/Create.tsx`,
      content: createContent,
    });
    
    // Edit page
    const editTemplate = await this.loadUITemplate('crud/edit.tsx.hbs');
    const editContent = this.compileTemplate(editTemplate, {
      ...schema,
      name,
      library: options.library,
    });
    files.push({
      path: `src/pages/${kebabCase(name)}/Edit.tsx`,
      content: editContent,
    });
    
    return files;
  }
}
```

**Generated React Admin Example:**

```typescript
// src/pages/products/List.tsx (AI Generated)
import React from 'react';
import {
  Box,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  TextField,
  MenuItem,
  Select,
  Pagination,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useProducts } from '../../hooks/useProducts';
import { useNavigate } from 'react-router-dom';

export function ProductList() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  
  const { data, isLoading, refetch } = useProducts({
    page,
    limit: 10,
    search,
    status: statusFilter,
  });
  
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      await api.products.delete(id);
      refetch();
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>Products</h1>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/products/create')}
        >
          Create Product
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="out_of_stock">Out of Stock</MenuItem>
        </Select>
      </Box>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Inventory</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.data.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>${product.price}</TableCell>
              <TableCell>{product.inventory}</TableCell>
              <TableCell>
                <StatusBadge status={product.status} />
              </TableCell>
              <TableCell>
                <IconButton
                  onClick={() => navigate(`/products/${product.id}/edit`)}
                >
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(product.id)}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Pagination
        count={data?.pagination.pages}
        page={page}
        onChange={(_, value) => setPage(value)}
        sx={{ mt: 2 }}
      />
    </Box>
  );
}
```

**Deliverables:**
- [ ] UI generator service
- [ ] React templates for CRUD
- [ ] Form generator with validation
- [ ] Table generator with filtering/sorting
- [ ] API client generator
- [ ] Authentication UI
- [ ] Responsive layouts
- [ ] Dark mode support

---

### Phase 5: Documentation & Architecture Export (3-4 weeks)

**Priority: MEDIUM**

#### 5.1 Automatic API Documentation

**Goal:** Generate comprehensive API documentation automatically.

**Implementation:**

```typescript
class APIDocGenerator {
  async generateSwaggerSpec(projectId: string): Promise<OpenAPISpec> {
    const components = await this.getProjectComponents(projectId);
    const manipulators = components.filter(c => c.type === 'manipulator');
    
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: project.name,
        description: project.description,
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:3001', description: 'Development' },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };
    
    // Generate schemas for elements
    const elements = components.filter(c => c.type === 'element');
    for (const element of elements) {
      spec.components.schemas[element.name] = this.elementToSchema(element);
    }
    
    // Generate paths for manipulators
    for (const manipulator of manipulators) {
      const paths = this.manipulatorToPaths(manipulator);
      Object.assign(spec.paths, paths);
    }
    
    return spec;
  }
  
  async generatePostmanCollection(projectId: string): Promise<PostmanCollection> {
    // Generate Postman collection for testing
  }
  
  async generateMarkdownDocs(projectId: string): Promise<string> {
    // Generate Markdown documentation
  }
}
```

#### 5.2 Architecture Diagram Export

**Goal:** Export system architecture diagrams from canvas.

**Implementation:**

```typescript
class ArchitectureExporter {
  async exportDiagram(
    projectId: string,
    format: 'png' | 'svg' | 'mermaid' | 'c4'
  ): Promise<Buffer> {
    const project = await this.getProject(projectId);
    const canvasData = project.canvasData;
    
    switch (format) {
      case 'mermaid':
        return this.toMermaid(canvasData);
      case 'c4':
        return this.toC4(canvasData);
      case 'png':
      case 'svg':
        return this.toImage(canvasData, format);
    }
  }
  
  private toMermaid(canvasData: any): string {
    let diagram = 'graph TD\n';
    
    // Add nodes
    for (const component of canvasData.components) {
      const shape = this.getShapeForType(component.type);
      diagram += `  ${component.id}${shape}${component.name}]\n`;
    }
    
    // Add relationships
    for (const edge of canvasData.edges) {
      diagram += `  ${edge.source} --> ${edge.target}\n`;
    }
    
    return diagram;
  }
  
  private toC4(canvasData: any): string {
    // Generate C4 model diagram
    return `
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

System_Boundary(api, "${canvasData.projectName}") {
  ${canvasData.components.map(c => this.toC4Component(c)).join('\n')}
}

${canvasData.edges.map(e => this.toC4Relation(e)).join('\n')}

@enduml
    `;
  }
}
```

**Deliverables:**
- [ ] OpenAPI/Swagger spec generator
- [ ] Postman collection generator
- [ ] Markdown documentation generator
- [ ] Mermaid diagram export
- [ ] C4 model export
- [ ] PNG/SVG diagram export
- [ ] Architecture documentation
- [ ] Deployment guide generator

---

### Phase 6: Advanced RBAC & Security (4-5 weeks)

**Priority: MEDIUM**

#### 6.1 Custom Roles & Permissions

**Goal:** Allow fine-grained custom role and permission configuration.

**Implementation:**

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[]; // Other role IDs
}

interface Permission {
  resource: string; // 'Product', 'Order', etc.
  actions: Action[]; // 'create', 'read', 'update', 'delete'
  conditions?: Condition[]; // When permission applies
  fields?: FieldPermission[]; // Field-level access
}

interface FieldPermission {
  field: string;
  access: 'read' | 'write' | 'none';
}

interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: any;
}

// Example: Order Manager role
const orderManager: Role = {
  id: 'order_manager',
  name: 'Order Manager',
  description: 'Can manage orders but not products',
  permissions: [
    {
      resource: 'Order',
      actions: ['create', 'read', 'update', 'delete'],
      conditions: [
        {
          field: 'status',
          operator: 'in',
          value: ['pending', 'confirmed'],
        },
      ],
    },
    {
      resource: 'Product',
      actions: ['read'], // Read-only
    },
  ],
};
```

**Database Schema:**

```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  permissions Json // Array of Permission objects
  inherits    String[] // Role IDs to inherit from
  isCustom    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       UserRole[]
  
  @@map("roles")
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  roleId    String   @map("role_id")
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  role      Role     @relation(fields: [roleId], references: [id])
  
  @@unique([userId, roleId])
  @@map("user_roles")
}

model Permission {
  id        String   @id @default(uuid())
  resource  String
  action    String
  conditions Json?
  fieldRules Json?
  
  @@map("permissions")
}
```

**Generated RBAC Middleware:**

```typescript
// Generated automatically based on roles defined in UI
class RBACMiddleware {
  private roles: Map<string, Role>;
  
  checkPermission(
    resource: string,
    action: Action
  ): express.RequestHandler {
    return async (req, res, next) => {
      const user = req.user!;
      
      // Get user's roles
      const userRoles = await this.getUserRoles(user.id);
      
      // Check if any role grants permission
      const hasPermission = userRoles.some(role =>
        this.roleHasPermission(role, resource, action, req)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: `${action} on ${resource}`,
        });
      }
      
      next();
    };
  }
  
  private roleHasPermission(
    role: Role,
    resource: string,
    action: Action,
    req: express.Request
  ): boolean {
    // Find permission for resource
    const permission = role.permissions.find(p => p.resource === resource);
    if (!permission) return false;
    
    // Check action
    if (!permission.actions.includes(action)) return false;
    
    // Check conditions
    if (permission.conditions) {
      return this.evaluateConditions(permission.conditions, req);
    }
    
    return true;
  }
  
  private evaluateConditions(
    conditions: Condition[],
    req: express.Request
  ): boolean {
    // Evaluate conditions based on request data
    return conditions.every(condition => {
      const value = _.get(req.body, condition.field);
      return this.evaluateCondition(condition, value);
    });
  }
  
  filterFields(
    resource: string,
    data: any,
    access: 'read' | 'write'
  ): express.RequestHandler {
    return async (req, res, next) => {
      const user = req.user!;
      const userRoles = await this.getUserRoles(user.id);
      
      // Get allowed fields
      const allowedFields = this.getAllowedFields(
        userRoles,
        resource,
        access
      );
      
      // Filter data
      if (access === 'read') {
        res.locals.filteredData = _.pick(data, allowedFields);
      } else {
        req.body = _.pick(req.body, allowedFields);
      }
      
      next();
    };
  }
}
```

**UI for Role Management:**

```typescript
// RoleManager.tsx
function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  return (
    <div>
      <h1>Role Management</h1>
      
      <Button onClick={() => setEditingRole(createEmptyRole())}>
        Create Role
      </Button>
      
      <Table>
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Description</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role.id}>
              <td>{role.name}</td>
              <td>{role.description}</td>
              <td>{role.permissions.length} permissions</td>
              <td>
                <Button onClick={() => setEditingRole(role)}>Edit</Button>
                <Button onClick={() => handleDelete(role.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {editingRole && (
        <RoleEditor
          role={editingRole}
          components={projectComponents}
          onSave={handleSave}
          onCancel={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}

// RoleEditor.tsx - Visual permission builder
function RoleEditor({ role, components, onSave, onCancel }: Props) {
  const [permissions, setPermissions] = useState(role.permissions);
  
  return (
    <Modal>
      <h2>{role.id ? 'Edit' : 'Create'} Role</h2>
      
      <Input
        label="Role Name"
        value={role.name}
        onChange={/* ... */}
      />
      
      <h3>Permissions</h3>
      
      {components.map(component => (
        <PermissionEditor
          key={component.id}
          component={component}
          permission={permissions.find(p => p.resource === component.name)}
          onChange={handlePermissionChange}
        />
      ))}
      
      <Button onClick={() => onSave(role)}>Save</Button>
      <Button onClick={onCancel}>Cancel</Button>
    </Modal>
  );
}
```

**Deliverables:**
- [ ] Custom role creation UI
- [ ] Permission builder interface
- [ ] Field-level permissions
- [ ] Conditional permissions
- [ ] Role inheritance
- [ ] RBAC middleware generator
- [ ] Permission testing tool
- [ ] Audit log for permission changes

---

### Phase 7: Bulk Operations & ETL (4-5 weeks)

**Priority: MEDIUM**

#### 7.1 Bulk Data Operations

**Goal:** Enable bulk create, update, delete operations with validation.

**Implementation:**

```typescript
interface BulkComponent extends Component {
  type: 'bulk_operation';
  schema: {
    targetElement: string; // Element to operate on
    operation: 'create' | 'update' | 'delete';
    source: 'csv' | 'json' | 'api' | 'database';
    validation: {
      enabled: boolean;
      rules: ValidationRule[];
    };
    transformation: {
      enabled: boolean;
      mappings: FieldMapping[];
    };
    batchSize: number;
    errorHandling: 'stop' | 'continue' | 'rollback';
  };
}

interface ETLComponent extends Component {
  type: 'etl';
  schema: {
    source: {
      type: 'database' | 'api' | 'file';
      connection: any;
      query?: string;
    };
    transformations: Transformation[];
    destination: {
      element: string;
      mode: 'insert' | 'upsert' | 'update';
    };
    schedule?: {
      enabled: boolean;
      cron: string;
    };
  };
}
```

**Generated Bulk Operation Code:**

```typescript
// Generated bulk operation worker
class ProductBulkImportWorker {
  async processJob(job: Job<BulkImportData>): Promise<BulkResult> {
    const { file, operation } = job.data;
    const batchSize = 100;
    
    // Parse file
    const records = await this.parseCSV(file);
    const total = records.length;
    
    const results: BulkResult = {
      total,
      succeeded: 0,
      failed: 0,
      errors: [],
    };
    
    // Process in batches
    for (let i = 0; i < total; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        // Validate batch
        const validated = await this.validateBatch(batch);
        
        // Transform batch
        const transformed = await this.transformBatch(validated);
        
        // Execute operation
        switch (operation) {
          case 'create':
            await this.bulkCreate(transformed);
            break;
          case 'update':
            await this.bulkUpdate(transformed);
            break;
          case 'delete':
            await this.bulkDelete(transformed);
            break;
        }
        
        results.succeeded += batch.length;
        
      } catch (error) {
        results.failed += batch.length;
        results.errors.push({
          batch: i / batchSize,
          error: error.message,
          records: batch.map(r => r.id),
        });
        
        // Error handling strategy
        if (job.data.errorHandling === 'stop') {
          throw error;
        } else if (job.data.errorHandling === 'rollback') {
          await this.rollback(results);
          throw error;
        }
        // continue: keep going
      }
      
      // Update progress
      await job.updateProgress((i + batch.length) / total * 100);
    }
    
    return results;
  }
  
  private async bulkCreate(records: any[]): Promise<void> {
    await prisma.product.createMany({
      data: records,
      skipDuplicates: true,
    });
  }
  
  private async bulkUpdate(records: any[]): Promise<void> {
    await prisma.$transaction(
      records.map(record =>
        prisma.product.update({
          where: { id: record.id },
          data: record,
        })
      )
    );
  }
}
```

**Deliverables:**
- [ ] Bulk operation component type
- [ ] CSV/JSON/Excel parser
- [ ] Batch processing logic
- [ ] Progress tracking
- [ ] Error reporting
- [ ] Rollback capability
- [ ] Validation before import
- [ ] Preview before execution

#### 7.2 ETL Pipeline Builder

**Goal:** Visual ETL pipeline builder for data integration.

**UI:**

```typescript
function ETLBuilder() {
  const [stages, setStages] = useState<ETLStage[]>([]);
  
  return (
    <div className="etl-builder">
      <h1>ETL Pipeline Builder</h1>
      
      <div className="stages">
        {/* Extract Stage */}
        <ETLStage type="extract">
          <h3>Extract</h3>
          <select>
            <option>CSV File</option>
            <option>API Endpoint</option>
            <option>Database Query</option>
            <option>Webhook</option>
          </select>
        </ETLStage>
        
        {/* Transform Stages */}
        <ETLStage type="transform">
          <h3>Transform</h3>
          <TransformationBuilder />
        </ETLStage>
        
        {/* Load Stage */}
        <ETLStage type="load">
          <h3>Load</h3>
          <select>
            <option>Product Element</option>
            <option>Order Element</option>
          </select>
        </ETLStage>
      </div>
      
      <Button onClick={handleSave}>Save Pipeline</Button>
      <Button onClick={handleTest}>Test Run</Button>
    </div>
  );
}
```

**Deliverables:**
- [ ] ETL component type
- [ ] Visual pipeline builder
- [ ] Source connectors (API, DB, File)
- [ ] Transformation functions
- [ ] Destination loaders
- [ ] Scheduling
- [ ] Error handling
- [ ] Data preview at each stage

---

### Phase 8: Input/Output Connectors (5-6 weeks)

**Priority: MEDIUM**

#### 8.1 Input Connectors

**Goal:** Flexible input sources for data.

**Implementation:**

```typescript
interface InputConnector extends Component {
  type: 'input_connector';
  subtype: 'webhook' | 'scanner' | 'ocr' | 'email' | 'file_upload' | 'api_polling';
  schema: {
    endpoint?: string; // For webhooks
    authentication?: AuthConfig;
    validation?: ValidationConfig;
    transformation?: TransformationConfig;
    destination: {
      element: string;
      action: 'create' | 'update' | 'trigger_workflow';
    };
  };
}

// Example: Webhook Input Connector
class WebhookInputConnector {
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // 1. Authenticate
      await this.authenticate(req);
      
      // 2. Validate payload
      const validated = await this.validate(req.body);
      
      // 3. Transform
      const transformed = await this.transform(validated);
      
      // 4. Create element or trigger workflow
      const result = await this.createOrder(transformed);
      
      res.json({ success: true, id: result.id });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

// Example: OCR Input Connector
class OCRInputConnector {
  async processUpload(file: File): Promise<OCRResult> {
    // 1. Upload to storage
    const url = await storageHelper.upload(file);
    
    // 2. OCR processing (Tesseract or Google Vision)
    const text = await ocrService.extractText(url);
    
    // 3. Parse structured data
    const structured = await this.parseInvoice(text);
    
    // 4. Create element
    const invoice = await invoiceService.create(structured);
    
    return {
      text,
      structured,
      invoice,
    };
  }
}
```

**Available Input Connectors:**

1. **Webhook Receiver**
   - Receive POST requests from external systems
   - Authentication (API key, HMAC signature)
   - Payload validation
   - Automatic element creation

2. **File Scanner**
   - Monitor folder for new files
   - Parse CSV, JSON, XML, Excel
   - Bulk import
   - Error handling

3. **OCR Processor**
   - Upload document image
   - Extract text with OCR
   - Parse structured data (invoices, receipts)
   - Create elements from extracted data

4. **Email Listener**
   - Monitor email inbox
   - Parse email content and attachments
   - Extract structured data
   - Create elements or trigger workflows

5. **API Polling**
   - Poll external API on schedule
   - Fetch new/updated records
   - Sync to local elements
   - Incremental updates

**Deliverables:**
- [ ] Input connector component types
- [ ] Webhook receiver generator
- [ ] File scanner implementation
- [ ] OCR integration (Tesseract/Google Vision)
- [ ] Email listener
- [ ] API polling worker
- [ ] Authentication handling
- [ ] Error recovery

---

#### 8.2 Output Connectors

**Goal:** Send data to external systems and services.

**Implementation:**

```typescript
interface OutputConnector extends Component {
  type: 'output_connector';
  subtype: 'webhook' | 'printer' | 'label_printer' | 'fcm' | 'email' | 'sms' | 'slack';
  schema: {
    trigger: {
      element: string;
      event: 'create' | 'update' | 'delete' | 'custom';
    };
    configuration: any; // Connector-specific
    template?: string; // For formatting output
    errorHandling: {
      retry: boolean;
      retries: number;
      fallback?: string;
    };
  };
}

// Example: Webhook Output Connector
class WebhookOutputConnector {
  async send(event: ElementEvent): Promise<void> {
    const payload = this.formatPayload(event);
    
    try {
      await axios.post(this.config.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        timeout: 5000,
      });
    } catch (error) {
      if (this.config.errorHandling.retry) {
        await this.queueRetry(event);
      }
      throw error;
    }
  }
}

// Example: Thermal Printer Output Connector
class ThermalPrinterConnector {
  async printLabel(order: Order): Promise<void> {
    // Format label using template
    const label = this.formatLabel(order);
    
    // Generate ZPL (Zebra Programming Language)
    const zpl = this.generateZPL(label);
    
    // Send to printer
    await this.sendToPrinter(zpl);
  }
  
  private generateZPL(label: Label): string {
    return `
^XA
^FO50,50^A0N,50,50^FDOrder #${label.orderNumber}^FS
^FO50,120^A0N,30,30^FD${label.customerName}^FS
^FO50,160^A0N,25,25^FD${label.address}^FS
^BY2,3,100
^FO50,220^BCN,100,Y,N,N^FD${label.barcode}^FS
^XZ
    `;
  }
}

// Example: FCM Push Notification Connector
class FCMConnector {
  async sendNotification(user: User, data: any): Promise<void> {
    const tokens = await this.getUserDeviceTokens(user.id);
    
    const message = {
      notification: {
        title: this.config.template.title,
        body: this.interpolate(this.config.template.body, data),
      },
      data: {
        ...data,
        click_action: this.config.clickAction,
      },
      tokens,
    };
    
    await admin.messaging().sendMulticast(message);
  }
}
```

**Available Output Connectors:**

1. **Webhook Sender**
   - Send HTTP POST to external URL
   - Custom headers and authentication
   - Retry logic
   - Signature generation

2. **Thermal Printer**
   - Print shipping labels
   - Print receipts
   - ZPL/ESC/POS support
   - Network or USB connection

3. **Label Printer**
   - Generate barcodes/QR codes
   - Print product labels
   - Batch printing

4. **FCM Push Notifications**
   - Send to mobile devices
   - Custom notification templates
   - Deep linking
   - Batch sending

5. **Slack Webhook**
   - Post messages to Slack channels
   - Rich formatting
   - Interactive buttons
   - Error notifications

6. **Log Aggregator**
   - Send logs to external service
   - Elasticsearch, Datadog, etc.
   - Structured logging
   - Alert on errors

**Deliverables:**
- [ ] Output connector component types
- [ ] Webhook sender
- [ ] Printer integrations (ZPL, ESC/POS)
- [ ] FCM push notification helper
- [ ] Slack webhook helper
- [ ] Log aggregation connectors
- [ ] Template system for formatting
- [ ] Error handling and retries

---

## Implementation Timeline

### Overall Timeline: 48-58 weeks (≈1 year)

| Phase | Description | Duration | Priority | Dependencies |
|-------|-------------|----------|----------|--------------|
| **Phase 1** | Enhanced Component Management | 4-6 weeks | CRITICAL | None |
| **Phase 2** | AI Logic Generation & Magic Mode | 6-8 weeks | CRITICAL | Phase 1 |
| **Phase 3** | Build, Test & Preview System | 6-8 weeks | HIGH | Phase 2 |
| **Phase 4** | UI Builder & Frontend Generation | 8-10 weeks | HIGH | Phase 3 |
| **Phase 5** | Documentation & Architecture Export | 3-4 weeks | MEDIUM | Phase 2 |
| **Phase 6** | Advanced RBAC & Security | 4-5 weeks | MEDIUM | Phase 1 |
| **Phase 7** | Bulk Operations & ETL | 4-5 weeks | MEDIUM | Phase 1 |
| **Phase 8** | Input/Output Connectors | 5-6 weeks | MEDIUM | Phase 2 |
| **Polish** | Bug fixes, testing, optimization | 8-10 weeks | HIGH | All |

### Critical Path

```
Phase 1 (Component Mgmt) 
  → Phase 2 (Magic Mode) 
  → Phase 3 (Build/Test) 
  → Phase 4 (UI Builder) 
  → Polish
  
  Time: 32-42 weeks (≈8-10 months)
```

Phases 5, 6, 7, 8 can be developed in parallel with later phases.

---

## Resource Requirements

### Team Composition (Recommended)

**Core Team (Minimum 5 people):**
- 1x Technical Lead / Architect
- 2x Full-Stack Engineers (Frontend + Backend)
- 1x AI/ML Engineer (GPT integration, prompt engineering)
- 1x DevOps Engineer (Build system, preview environments)

**Extended Team (Ideal 9 people):**
- 1x Technical Lead / Architect
- 3x Frontend Engineers
- 2x Backend Engineers
- 1x AI/ML Engineer
- 1x DevOps Engineer
- 1x QA Engineer

**Part-Time:**
- 1x UI/UX Designer
- 1x Technical Writer

### Technology Stack

**Existing:**
- Frontend: React, TypeScript, Vite, Tailwind, React Flow
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL (Supabase)
- AI: OpenAI GPT-4
- Queue: BullMQ + Redis

**New Additions:**
- Docker (for preview environments)
- Kubernetes (optional, for scaling)
- Vitest (testing)
- Playwright (E2E testing)
- Mermaid/PlantUML (diagrams)
- Material-UI or Chakra UI (admin UI generation)
- Tesseract or Google Vision (OCR)
- Firebase Admin SDK (FCM)
- ZPL/ESC libraries (printer support)

---

## Success Metrics

### Platform Metrics

**User Adoption:**
- 500+ active users within 6 months of launch
- 50%+ week-over-week retention
- 1000+ projects created
- 500+ deployed applications

**Performance:**
- <5 seconds AI schema generation
- <30 seconds full project build
- <10 seconds preview environment startup
- >99% uptime for platform

**Code Quality:**
- >85% test coverage on generated code
- Zero critical security vulnerabilities
- <100ms P99 latency for generated APIs

### User Satisfaction

**Quantitative:**
- NPS score >40
- 4.5+ star rating
- <2% churn rate

**Qualitative:**
- "I built an app without writing code"
- "Generated code is production-ready"
- "Saved weeks of development time"

---

## Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI generates incorrect code | HIGH | MEDIUM | Enhanced validation, Magic Mode testing, user review |
| Build system too slow | MEDIUM | LOW | Caching, incremental builds, parallel processing |
| Preview environments unstable | MEDIUM | MEDIUM | Health checks, auto-restart, error recovery |
| Generated UI not production-ready | HIGH | MEDIUM | Template quality, user customization, examples |
| Complex systems break generator | HIGH | MEDIUM | Comprehensive testing, error boundaries, fallbacks |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Users don't adopt Magic Mode | HIGH | MEDIUM | Clear value prop, tutorials, before/after demos |
| AI costs too high | MEDIUM | MEDIUM | Caching, GPT-3.5 for simple tasks, fine-tuned models |
| Competitors | MEDIUM | HIGH | Speed of execution, quality, unique features |
| Users outgrow platform | LOW | HIGH | Export code, no lock-in, extensibility |

---

## Next Steps (Immediate Actions)

### Week 1-2: Planning & Preparation

- [ ] **Stakeholder Review:** Present this plan, get buy-in
- [ ] **Team Assembly:** Hire/assign engineers
- [ ] **Architecture Review:** Validate technical decisions
- [ ] **Priority Confirmation:** Confirm phase priorities
- [ ] **Budget Approval:** Secure funding for resources
- [ ] **Tooling Setup:** CI/CD, project management, monitoring

### Week 3-4: Phase 1 Kickoff

- [ ] **Sprint Planning:** Break Phase 1 into 2-week sprints
- [ ] **Design System:** Create UI mockups for new features
- [ ] **Database Migrations:** Plan schema changes
- [ ] **API Design:** Define new endpoints
- [ ] **Start Development:** Begin component naming & linking

### Monthly Milestones

**Month 1-2:** Phase 1 Complete
- Component renaming/linking functional
- Component library with templates
- Zero duplicate components created

**Month 3-4:** Phase 2 Complete
- Magic Mode generating production code
- AI considering full system context
- Single-prompt multi-component generation

**Month 5-6:** Phase 3 Complete
- Build system functional
- Testing integrated
- Preview environments working

**Month 7-9:** Phase 4 Complete
- Admin UI generator working
- React frontend code generation
- Full-stack applications possible

**Month 10-12:** Polish & Launch
- All phases complete
- Comprehensive testing
- Documentation complete
- Beta launch

---

## Conclusion

This comprehensive improvement plan transforms Worldbuilder from a promising MVP into a production-ready, enterprise-grade platform. The key differentiators are:

1. **Magic Mode** - True "no-code" with production-ready implementations
2. **Full-Stack Generation** - Backend + Frontend + Tests + Docs
3. **Visual Everything** - From description to deployed app without CLI
4. **Enterprise Features** - RBAC, ETL, Connectors, Monitoring
5. **No Lock-In** - Export everything, own your code

**The Vision:**
A non-technical founder describes their SaaS idea in plain English. Within minutes, they have a complete, tested, deployed application with a React admin panel, REST API, background jobs, payment processing, and email notifications - all production-ready code they can customize and own forever.

**This is the future of software development.** 🚀

---

## Appendix

### A. Detailed API Endpoints (New)

```typescript
// Component Suggestions
POST /api/components/analyze
POST /api/components/validate-suggestions
POST /api/components/bulk-create

// Multi-Component Generation
POST /api/generate/plan
POST /api/generate/execute
GET  /api/generate/status/:jobId

// Build System
POST /api/build/:projectId
GET  /api/build/:projectId/status
GET  /api/build/:projectId/logs

// Test System
POST /api/test/:projectId
GET  /api/test/:projectId/results

// Preview System
POST /api/preview/:projectId/start
POST /api/preview/:projectId/stop
GET  /api/preview/:projectId/status
GET  /api/preview/:projectId/logs

// UI Generation
POST /api/ui/generate
GET  /api/ui/templates

// Documentation
GET  /api/docs/:projectId/swagger
GET  /api/docs/:projectId/postman
GET  /api/docs/:projectId/markdown

// Architecture Export
GET  /api/architecture/:projectId/diagram
GET  /api/architecture/:projectId/c4

// RBAC
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id

// Bulk Operations
POST /api/bulk/import
GET  /api/bulk/status/:jobId

// Connectors
GET    /api/connectors/input
GET    /api/connectors/output
POST   /api/connectors
```

### B. Database Schema Changes

See inline Prisma schema definitions in each section.

### C. UI Component Hierarchy

```
App
├── Dashboard
├── ProjectCanvas
│   ├── ComponentLibrary
│   ├── Canvas (React Flow)
│   ├── ComponentDetails
│   └── BuildPanel
│       ├── BuildStatus
│       ├── TestResults
│       └── PreviewPanel
├── ComponentModals
│   ├── ElementModal
│   ├── ManipulatorModal
│   ├── WorkerModal
│   ├── HelperModal
│   ├── AuditorModal
│   ├── EnforcerModal
│   ├── WorkflowModal
│   ├── InputConnectorModal
│   ├── OutputConnectorModal
│   ├── BulkOperationModal
│   └── ETLModal
├── SuggestionReview
├── MultiComponentPrompt
├── GenerationProgress
├── CodePreview
├── RoleManager
├── SettingsPanel
└── Documentation
```

### D. Template Structure

```
templates/
├── element/
│   ├── entity.ts.hbs
│   ├── service.ts.hbs
│   ├── prisma-model.hbs
│   └── test.ts.hbs
├── manipulator/
│   ├── controller.ts.hbs
│   └── test.ts.hbs
├── worker/
│   ├── queue.ts.hbs
│   ├── processor.ts.hbs
│   └── test.ts.hbs
├── helper/
│   └── service.ts.hbs
├── auditor/
│   └── auditor.ts.hbs
├── enforcer/
│   └── enforcer.ts.hbs
├── workflow/
│   └── orchestrator.ts.hbs
├── input_connector/
│   ├── webhook.ts.hbs
│   ├── file_scanner.ts.hbs
│   ├── ocr.ts.hbs
│   └── email_listener.ts.hbs
├── output_connector/
│   ├── webhook.ts.hbs
│   ├── printer.ts.hbs
│   ├── fcm.ts.hbs
│   └── slack.ts.hbs
├── bulk_operation/
│   └── bulk_worker.ts.hbs
├── etl/
│   └── etl_pipeline.ts.hbs
├── ui/
│   ├── crud/
│   │   ├── list.tsx.hbs
│   │   ├── detail.tsx.hbs
│   │   ├── create.tsx.hbs
│   │   └── edit.tsx.hbs
│   ├── forms/
│   │   └── form.tsx.hbs
│   └── layout/
│       ├── layout.tsx.hbs
│       └── navigation.tsx.hbs
└── shared/
    ├── rbac-middleware.ts.hbs
    ├── error-handler.ts.hbs
    └── logger.ts.hbs
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** READY FOR REVIEW  
**Next Review:** After stakeholder approval

