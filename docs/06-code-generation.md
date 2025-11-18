# Worldbuilder - Code Generation

## Code Generation Pipeline

```
AI Schema → Template Selection → Code Generation → Validation → Testing → Commit
```

---

## Generation Architecture

### Template-Based Generation

**Blueprint Structure**:
```
templates/
├── element/
│   ├── entity.template.ts
│   ├── service.template.ts
│   ├── dto.template.ts
│   ├── validator.template.ts
│   ├── test.template.ts
│   └── migration.template.sql
├── manipulator/
│   ├── controller.template.ts
│   ├── routes.template.ts
│   ├── swagger.template.ts
│   └── test.template.ts
├── worker/
│   ├── processor.template.ts
│   ├── queue.template.ts
│   └── test.template.ts
├── helper/
│   ├── service.template.ts
│   └── test.template.ts
├── auditor/
│   ├── auditor.template.ts
│   ├── rules.template.ts
│   └── test.template.ts
└── shared/
    ├── types.template.ts
    ├── errors.template.ts
    └── utils.template.ts
```

### Code Generator Engine

```typescript
class CodeGenerator {
  async generate(schema: ComponentSchema): Promise<GeneratedCode> {
    // 1. Select templates
    const templates = this.selectTemplates(schema.type);
    
    // 2. Prepare context
    const context = this.buildContext(schema);
    
    // 3. Generate code from templates
    const files = await this.renderTemplates(templates, context);
    
    // 4. Post-processing
    const formatted = await this.formatCode(files);
    const validated = await this.validateCode(formatted);
    
    // 5. Generate tests
    const tests = await this.generateTests(schema, formatted);
    
    return {
      sourceFiles: validated,
      testFiles: tests,
      migrations: this.generateMigrations(schema),
      documentation: this.generateDocs(schema)
    };
  }
}
```

---

## Element Code Generation

### Example Schema
```json
{
  "type": "element",
  "name": "Product",
  "persistence": "persisted",
  "properties": [
    { "name": "id", "type": "uuid", "primary": true },
    { "name": "name", "type": "string", "required": true },
    { "name": "price", "type": "decimal", "required": true, "min": 0 }
  ]
}
```

### Generated: Prisma Schema
```prisma
// prisma/schema.prisma
model Product {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(255)
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("products")
  @@index([name])
}
```

### Generated: TypeScript Entity
```typescript
// src/elements/product/product.entity.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
```

### Generated: Service Layer
```typescript
// src/elements/product/product.service.ts
import { PrismaClient } from '@prisma/client';
import { CreateProductDto, UpdateProductDto, Product } from './product.entity';
import { ProductAuditor } from './product.auditor';

export class ProductService {
  constructor(
    private prisma: PrismaClient,
    private auditor: ProductAuditor
  ) {}

  async create(data: CreateProductDto, userId: string): Promise<Product> {
    // Pre-create validation
    await this.auditor.beforeCreate(data);

    const product = await this.prisma.product.create({
      data,
    });

    // Post-create audit
    await this.auditor.afterCreate(product, userId);

    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return await this.prisma.product.findUnique({
      where: { id },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
  }): Promise<Product[]> {
    return await this.prisma.product.findMany(params);
  }

  async update(
    id: string,
    data: UpdateProductDto,
    userId: string
  ): Promise<Product> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    await this.auditor.beforeUpdate(existing, data);

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    await this.auditor.afterUpdate(existing, updated, userId);

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    await this.auditor.beforeDelete(existing);

    await this.prisma.product.delete({
      where: { id },
    });

    await this.auditor.afterDelete(existing, userId);
  }
}
```

### Generated: Tests
```typescript
// src/elements/product/__tests__/product.service.test.ts
import { ProductService } from '../product.service';
import { prismaMock } from '../../../test/prisma-mock';
import { ProductAuditor } from '../product.auditor';

describe('ProductService', () => {
  let service: ProductService;
  let auditor: ProductAuditor;

  beforeEach(() => {
    auditor = new ProductAuditor(prismaMock);
    service = new ProductService(prismaMock, auditor);
  });

  describe('create', () => {
    it('should create a product with valid data', async () => {
      const createDto = {
        name: 'Test Product',
        price: 19.99,
      };

      prismaMock.product.create.mockResolvedValue({
        id: 'uuid',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createDto, 'user-id');

      expect(result.name).toBe('Test Product');
      expect(result.price).toBe(19.99);
    });

    it('should reject negative prices', async () => {
      const createDto = {
        name: 'Test Product',
        price: -10,
      };

      await expect(
        service.create(createDto, 'user-id')
      ).rejects.toThrow('Price must be positive');
    });

    it('should reject empty names', async () => {
      const createDto = {
        name: '',
        price: 19.99,
      };

      await expect(
        service.create(createDto, 'user-id')
      ).rejects.toThrow('Name is required');
    });
  });

  // ... more tests
});
```

---

## Manipulator Code Generation

### Generated: Controller
```typescript
// src/manipulators/product/product.controller.ts
import { Router, Request, Response } from 'express';
import { ProductService } from '../../elements/product/product.service';
import { CreateProductSchema, UpdateProductSchema } from '../../elements/product/product.entity';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

export class ProductController {
  public router: Router;

  constructor(private productService: ProductService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /products:
     *   post:
     *     summary: Create a new product
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateProduct'
     *     responses:
     *       201:
     *         description: Product created successfully
     */
    this.router.post(
      '/products',
      authenticate,
      validateRequest(CreateProductSchema),
      this.create.bind(this)
    );

    /**
     * @swagger
     * /products:
     *   get:
     *     summary: List all products
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: List of products
     */
    this.router.get('/products', this.findAll.bind(this));

    this.router.get('/products/:id', this.findById.bind(this));
    this.router.put(
      '/products/:id',
      authenticate,
      validateRequest(UpdateProductSchema),
      this.update.bind(this)
    );
    this.router.delete(
      '/products/:id',
      authenticate,
      this.delete.bind(this)
    );
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.productService.create(
        req.body,
        req.user!.id
      );
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  private async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const products = await this.productService.findAll({
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({
        data: products,
        page,
        limit,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ... other methods
}
```

---

## Worker Code Generation

### Generated: Worker
```typescript
// src/workers/order-processing/order-processing.worker.ts
import { Queue, Worker, Job } from 'bullmq';
import { OrderService } from '../../elements/order/order.service';
import { PaymentHelper } from '../../helpers/payment/payment.helper';
import { EmailHelper } from '../../helpers/email/email.helper';

export interface OrderProcessingJobData {
  orderId: string;
  userId: string;
}

export class OrderProcessingWorker {
  private queue: Queue<OrderProcessingJobData>;
  private worker: Worker<OrderProcessingJobData>;

  constructor(
    private orderService: OrderService,
    private paymentHelper: PaymentHelper,
    private emailHelper: EmailHelper
  ) {
    this.queue = new Queue('order-processing', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    this.worker = new Worker(
      'order-processing',
      this.processJob.bind(this),
      {
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        concurrency: 5,
      }
    );

    this.worker.on('completed', this.onCompleted.bind(this));
    this.worker.on('failed', this.onFailed.bind(this));
  }

  async addJob(data: OrderProcessingJobData): Promise<Job> {
    return await this.queue.add('process-order', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  private async processJob(
    job: Job<OrderProcessingJobData>
  ): Promise<void> {
    const { orderId, userId } = job.data;

    // Step 1: Validate inventory
    await job.updateProgress(20);
    await this.orderService.validateInventory(orderId);

    // Step 2: Charge payment
    await job.updateProgress(40);
    const order = await this.orderService.findById(orderId);
    const paymentResult = await this.paymentHelper.charge({
      amount: order.total,
      currency: 'usd',
      customerId: order.customerId,
    });

    if (!paymentResult.success) {
      throw new Error('Payment failed');
    }

    // Step 3: Update order status
    await job.updateProgress(60);
    await this.orderService.updateStatus(orderId, 'confirmed');

    // Step 4: Create shipment
    await job.updateProgress(80);
    await this.orderService.createShipment(orderId);

    // Step 5: Send confirmation email
    await job.updateProgress(90);
    await this.emailHelper.sendTransactional({
      to: order.customerEmail,
      template: 'order-confirmation',
      data: { order },
    });

    await job.updateProgress(100);
  }

  private onCompleted(job: Job<OrderProcessingJobData>): void {
    console.log(`Order ${job.data.orderId} processed successfully`);
    // Could trigger additional events here
  }

  private onFailed(job: Job<OrderProcessingJobData>, error: Error): void {
    console.error(`Order ${job.data.orderId} processing failed:`, error);
    // Could send notification to admin
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      progress: await job.progress(),
      state: await job.getState(),
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }
}
```

---

## Helper Code Generation

### Generated: Helper Service
```typescript
// src/helpers/email/email.helper.ts
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  template: string;
  data: Record<string, any>;
}

export class EmailHelper {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is required');
    }
    sgMail.setApiKey(apiKey);
  }

  async sendTransactional(options: EmailOptions): Promise<boolean> {
    try {
      const msg = {
        to: options.to,
        from: process.env.FROM_EMAIL!,
        templateId: this.getTemplateId(options.template),
        dynamicTemplateData: options.data,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  private getTemplateId(templateName: string): string {
    const templates: Record<string, string> = {
      'order-confirmation': process.env.SENDGRID_TEMPLATE_ORDER_CONFIRMATION!,
      'welcome': process.env.SENDGRID_TEMPLATE_WELCOME!,
      // ... more templates
    };

    const templateId = templates[templateName];
    if (!templateId) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    return templateId;
  }
}
```

---

## Auditor Code Generation

### Generated: Auditor
```typescript
// src/auditors/product/product.auditor.ts
import { PrismaClient } from '@prisma/client';
import { Product, CreateProductDto, UpdateProductDto } from '../../elements/product/product.entity';

export class ProductAuditor {
  constructor(private prisma: PrismaClient) {}

  async beforeCreate(data: CreateProductDto): Promise<void> {
    // Validation rules
    if (data.price < 0) {
      throw new Error('Price must be positive');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Name is required');
    }
  }

  async afterCreate(product: Product, userId: string): Promise<void> {
    await this.createAuditLog({
      entityType: 'Product',
      entityId: product.id,
      action: 'CREATE',
      userId,
      before: null,
      after: product,
    });
  }

  async beforeUpdate(
    existing: Product,
    updates: UpdateProductDto
  ): Promise<void> {
    if (updates.price !== undefined && updates.price < 0) {
      throw new Error('Price must be positive');
    }
  }

  async afterUpdate(
    before: Product,
    after: Product,
    userId: string
  ): Promise<void> {
    await this.createAuditLog({
      entityType: 'Product',
      entityId: after.id,
      action: 'UPDATE',
      userId,
      before,
      after,
    });
  }

  async beforeDelete(product: Product): Promise<void> {
    // Business rule: Can't delete products with active orders
    const activeOrders = await this.prisma.order.count({
      where: {
        productId: product.id,
        status: { in: ['pending', 'confirmed'] },
      },
    });

    if (activeOrders > 0) {
      throw new Error('Cannot delete product with active orders');
    }
  }

  async afterDelete(product: Product, userId: string): Promise<void> {
    await this.createAuditLog({
      entityType: 'Product',
      entityId: product.id,
      action: 'DELETE',
      userId,
      before: product,
      after: null,
    });
  }

  private async createAuditLog(data: {
    entityType: string;
    entityId: string;
    action: string;
    userId: string;
    before: any;
    after: any;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        ...data,
        timestamp: new Date(),
      },
    });
  }
}
```

---

## Project Structure Generation

### Complete Generated Project
```
generated-project/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── Dockerfile
├── README.md
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── ...
│
├── src/
│   ├── index.ts
│   ├── app.ts
│   │
│   ├── elements/
│   │   ├── product/
│   │   │   ├── product.entity.ts
│   │   │   ├── product.service.ts
│   │   │   ├── product.auditor.ts
│   │   │   └── __tests__/
│   │   │       └── product.service.test.ts
│   │   └── ...
│   │
│   ├── manipulators/
│   │   ├── product/
│   │   │   ├── product.controller.ts
│   │   │   └── __tests__/
│   │   │       └── product.controller.test.ts
│   │   └── ...
│   │
│   ├── workers/
│   │   ├── order-processing/
│   │   │   ├── order-processing.worker.ts
│   │   │   └── __tests__/
│   │   │       └── order-processing.worker.test.ts
│   │   └── ...
│   │
│   ├── helpers/
│   │   ├── email/
│   │   │   ├── email.helper.ts
│   │   │   └── __tests__/
│   │   │       └── email.helper.test.ts
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── error-handler.ts
│   │   └── rate-limit.ts
│   │
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── swagger.ts
│   │
│   └── utils/
│       ├── logger.ts
│       └── errors.ts
│
├── tests/
│   ├── integration/
│   │   └── ...
│   ├── e2e/
│   │   └── ...
│   └── setup.ts
│
└── docs/
    ├── api/
    │   └── swagger.json
    └── README.md
```

---

## Code Quality Standards

### Generated Code Follows
1. **TypeScript strict mode**
2. **ESLint rules** (Airbnb base)
3. **Prettier formatting**
4. **100% type safety**
5. **JSDoc comments**
6. **Error handling** (try-catch, custom errors)
7. **Logging** (Winston)
8. **Input validation** (Zod)
9. **Security best practices** (helmet, cors, rate limiting)

### Generated Tests Include
1. **Unit tests** (Jest)
2. **Integration tests** (Supertest)
3. **E2E tests** (Playwright)
4. **Mocks** for external services
5. **Test coverage** reporting

---

## Continuous Code Generation

### Incremental Updates

When user modifies component:
1. **Identify changes** (diff schema)
2. **Regenerate affected files**
3. **Preserve custom code** (using comments markers)
4. **Update tests**
5. **Run tests** to ensure no breakage

### Custom Code Protection

```typescript
// @worldbuilder:custom-start
// User's custom code here is preserved
function myCustomLogic() {
  // ...
}
// @worldbuilder:custom-end
```

---

## Performance Optimization

### Fast Generation
- Template caching
- Parallel file generation
- Incremental updates only
- AST manipulation for speed

### Code Splitting
- Lazy loading
- Tree shaking
- Bundle optimization
- Docker layer caching

