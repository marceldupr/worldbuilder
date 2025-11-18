# Worldbuilder - Testing Strategy

## Testing Philosophy

**"Every component is born with tests, and tests lock behavior permanently"**

Worldbuilder automatically generates comprehensive test suites for every component. The "Enforcer" component type enables users to "lock" critical behaviors, preventing regressions.

---

## Test Pyramid

```
        /\
       /E2E\         End-to-End Tests
      /──────\       (12-15% of tests)
     /  Inte  \      Integration Tests
    /   gration\     (25-30% of tests)
   /────────────\
  /     Unit      \  Unit Tests
 /      Tests      \ (55-60% of tests)
/──────────────────\
```

---

## Unit Tests

### Automatically Generated

For every **Element**, generate unit tests for:
- Property validation
- Required fields
- Data type enforcement
- Min/max constraints
- Enum validation
- State transitions
- Behaviors/methods

### Example: Product Element Tests

```typescript
// src/elements/product/__tests__/product.service.test.ts
describe('Product Service', () => {
  let service: ProductService;
  let prisma: PrismaClient;
  let auditor: ProductAuditor;

  beforeEach(() => {
    prisma = new PrismaClient();
    auditor = new ProductAuditor(prisma);
    service = new ProductService(prisma, auditor);
  });

  describe('create', () => {
    it('should create product with valid data', async () => {
      const dto = {
        name: 'Test Product',
        price: 19.99,
        inventory: 10,
      };

      const product = await service.create(dto, 'user-id');

      expect(product.id).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.price).toBe(19.99);
      expect(product.status).toBe('active');
    });

    it('should reject empty name', async () => {
      await expect(
        service.create({ name: '', price: 10, inventory: 5 }, 'user-id')
      ).rejects.toThrow('Name is required');
    });

    it('should reject negative price', async () => {
      await expect(
        service.create({ name: 'Test', price: -10, inventory: 5 }, 'user-id')
      ).rejects.toThrow('Price must be positive');
    });

    it('should reject negative inventory', async () => {
      await expect(
        service.create({ name: 'Test', price: 10, inventory: -5 }, 'user-id')
      ).rejects.toThrow('Inventory cannot be negative');
    });

    it('should default status to active', async () => {
      const product = await service.create(
        { name: 'Test', price: 10, inventory: 5 },
        'user-id'
      );
      expect(product.status).toBe('active');
    });
  });

  describe('transitions', () => {
    it('should transition to out_of_stock when inventory is 0', async () => {
      const product = await service.create(
        { name: 'Test', price: 10, inventory: 1 },
        'user-id'
      );

      await service.decrementInventory(product.id, 1, 'user-id');

      const updated = await service.findById(product.id);
      expect(updated.inventory).toBe(0);
      expect(updated.status).toBe('out_of_stock');
    });

    it('should transition to active when restocked from out_of_stock', async () => {
      const product = await service.create(
        { name: 'Test', price: 10, inventory: 0 },
        'user-id'
      );

      // Manually set to out_of_stock
      await service.update(
        product.id,
        { status: 'out_of_stock' },
        'user-id'
      );

      await service.restock(product.id, 10, 'user-id');

      const updated = await service.findById(product.id);
      expect(updated.inventory).toBe(10);
      expect(updated.status).toBe('active');
    });
  });

  describe('behaviors', () => {
    it('should restock correctly', async () => {
      const product = await service.create(
        { name: 'Test', price: 10, inventory: 5 },
        'user-id'
      );

      await service.restock(product.id, 10, 'user-id');

      const updated = await service.findById(product.id);
      expect(updated.inventory).toBe(15);
    });

    it('should reject restocking with negative quantity', async () => {
      const product = await service.create(
        { name: 'Test', price: 10, inventory: 5 },
        'user-id'
      );

      await expect(
        service.restock(product.id, -5, 'user-id')
      ).rejects.toThrow('Quantity must be positive');
    });
  });

  describe('audit trail', () => {
    it('should create audit log on creation', async () => {
      const product = await service.create(
        { name: 'Test', price: 10, inventory: 5 },
        'user-id'
      );

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'Product',
          entityId: product.id,
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('CREATE');
      expect(auditLogs[0].userId).toBe('user-id');
    });
  });
});
```

---

## Integration Tests

### API Endpoint Tests

For every **Manipulator**, generate integration tests:

```typescript
// src/manipulators/product/__tests__/product.controller.test.ts
import request from 'supertest';
import { app } from '../../../app';
import { PrismaClient } from '@prisma/client';

describe('Product API', () => {
  let prisma: PrismaClient;
  let authToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    // Create test user and get token
    authToken = await createTestUserAndGetToken();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.product.deleteMany();
  });

  describe('POST /products', () => {
    it('should create product with authentication', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          price: 19.99,
          inventory: 10,
        })
        .expect(201);

      expect(response.body.name).toBe('Test Product');
      expect(response.body.id).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/products')
        .send({
          name: 'Test Product',
          price: 19.99,
          inventory: 10,
        })
        .expect(401);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          price: -10,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /products', () => {
    it('should list all products', async () => {
      // Create test products
      await prisma.product.createMany({
        data: [
          { name: 'Product 1', price: 10, inventory: 5 },
          { name: 'Product 2', price: 20, inventory: 10 },
        ],
      });

      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should support pagination', async () => {
      // Create 15 products
      await prisma.product.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          name: `Product ${i}`,
          price: 10,
          inventory: 5,
        })),
      });

      const response = await request(app)
        .get('/products?page=2&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.page).toBe(2);
    });

    it('should support search', async () => {
      await prisma.product.createMany({
        data: [
          { name: 'Red Shirt', price: 10, inventory: 5 },
          { name: 'Blue Pants', price: 20, inventory: 10 },
        ],
      });

      const response = await request(app)
        .get('/products?search=shirt')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Red Shirt');
    });

    it('should support filtering', async () => {
      await prisma.product.createMany({
        data: [
          { name: 'Product 1', price: 10, inventory: 5, status: 'active' },
          { name: 'Product 2', price: 20, inventory: 0, status: 'out_of_stock' },
        ],
      });

      const response = await request(app)
        .get('/products?status=active')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });
  });

  describe('PUT /products/:id', () => {
    it('should update product', async () => {
      const product = await prisma.product.create({
        data: { name: 'Old Name', price: 10, inventory: 5 },
      });

      const response = await request(app)
        .put(`/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body.name).toBe('New Name');
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete product', async () => {
      const product = await prisma.product.create({
        data: { name: 'To Delete', price: 10, inventory: 5 },
      });

      await request(app)
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const deleted = await prisma.product.findUnique({
        where: { id: product.id },
      });

      expect(deleted).toBeNull();
    });
  });
});
```

### Worker Tests

For every **Worker**, generate integration tests:

```typescript
// src/workers/order-processing/__tests__/order-processing.worker.test.ts
describe('Order Processing Worker', () => {
  let worker: OrderProcessingWorker;
  let orderService: OrderService;
  let paymentHelper: PaymentHelper;
  let emailHelper: EmailHelper;

  beforeEach(() => {
    orderService = new OrderService(prisma, auditor);
    paymentHelper = new PaymentHelper();
    emailHelper = new EmailHelper();
    worker = new OrderProcessingWorker(
      orderService,
      paymentHelper,
      emailHelper
    );
  });

  afterEach(async () => {
    await worker.close();
  });

  it('should process order successfully', async () => {
    const order = await createTestOrder();
    
    const job = await worker.addJob({
      orderId: order.id,
      userId: 'user-id',
    });

    // Wait for job completion
    await job.waitUntilFinished();

    const updated = await orderService.findById(order.id);
    expect(updated.status).toBe('confirmed');
  });

  it('should retry on payment failure', async () => {
    const order = await createTestOrder();
    
    // Mock payment to fail twice, succeed third time
    let attempts = 0;
    jest.spyOn(paymentHelper, 'charge').mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Payment failed');
      }
      return { success: true };
    });

    const job = await worker.addJob({
      orderId: order.id,
      userId: 'user-id',
    });

    await job.waitUntilFinished();

    expect(attempts).toBe(3);
    const updated = await orderService.findById(order.id);
    expect(updated.status).toBe('confirmed');
  });

  it('should move to dead letter queue after max retries', async () => {
    const order = await createTestOrder();
    
    jest.spyOn(paymentHelper, 'charge').mockImplementation(() => {
      throw new Error('Payment failed');
    });

    const job = await worker.addJob({
      orderId: order.id,
      userId: 'user-id',
    });

    await job.waitUntilFinished();

    const state = await job.getState();
    expect(state).toBe('failed');
  });
});
```

---

## End-to-End Tests

### Full User Journey Tests

Generated using **Playwright** for realistic browser testing:

```typescript
// tests/e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order Fulfillment Flow', () => {
  test('complete order from product selection to confirmation', async ({ page }) => {
    // 1. User logs in
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 2. Browse products
    await page.goto('/products');
    await expect(page.locator('.product-card')).toHaveCount(10);

    // 3. Search for product
    await page.fill('[name="search"]', 'Red Shirt');
    await page.waitForTimeout(500); // debounce
    await expect(page.locator('.product-card')).toHaveCount(1);

    // 4. Add to cart
    await page.click('.product-card:first-child .add-to-cart');
    await expect(page.locator('.cart-badge')).toHaveText('1');

    // 5. Go to cart
    await page.click('.cart-icon');
    await expect(page).toHaveURL('/cart');

    // 6. Proceed to checkout
    await page.click('button:has-text("Checkout")');
    await expect(page).toHaveURL('/checkout');

    // 7. Enter payment details
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');

    // 8. Place order
    await page.click('button:has-text("Place Order")');

    // 9. Wait for processing
    await expect(page.locator('.order-processing')).toBeVisible();
    await page.waitForSelector('.order-success', { timeout: 30000 });

    // 10. Verify order confirmation
    await expect(page.locator('h1')).toHaveText('Order Confirmed!');
    
    const orderNumber = await page.locator('.order-number').textContent();
    expect(orderNumber).toMatch(/^ORD-\d+$/);

    // 11. Verify email was sent (check backend)
    // In real scenario, check email service or mock
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    await page.goto('/checkout');
    
    // Use test card that fails
    await page.fill('[name="cardNumber"]', '4000000000000002');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');

    await page.click('button:has-text("Place Order")');

    await expect(page.locator('.error-message')).toHaveText(
      'Payment failed. Please try another card.'
    );
  });
});
```

---

## Test Locking (Enforcer)

### The "Lock" Feature

When a user clicks "Lock" on a component or workflow:
1. Current behavior is captured in tests
2. Tests are marked as "enforced"
3. Any code changes that break these tests are rejected
4. Enforced tests appear in UI with 🔒 icon

### Implementation

```typescript
// Generated enforcer metadata
{
  "enforcedTests": [
    {
      "id": "product-create-validation",
      "component": "Product",
      "testFile": "src/elements/product/__tests__/product.service.test.ts",
      "testName": "should reject negative prices",
      "lockedAt": "2024-01-15T10:30:00Z",
      "lockedBy": "user-id",
      "checksum": "abc123def456"
    }
  ]
}
```

### Pre-Deploy Validation

```typescript
async function validateEnforcedTests(): Promise<boolean> {
  const enforcedTests = await loadEnforcedTests();
  
  for (const test of enforcedTests) {
    const result = await runSpecificTest(test.testFile, test.testName);
    
    if (!result.passed) {
      throw new Error(
        `Enforced test failed: ${test.testName}. ` +
        `This test was locked by ${test.lockedBy} on ${test.lockedAt}. ` +
        `Deploy blocked to prevent regression.`
      );
    }
  }
  
  return true;
}
```

---

## Test Coverage Requirements

### Minimum Coverage Thresholds

Generated `.jest.config.js`:
```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Coverage Report in UI

```
┌─────────────────────────────────────┐
│  Test Coverage                      │
├─────────────────────────────────────┤
│  Overall: 94% ✅                    │
│                                     │
│  By Component:                      │
│  Product Element      97% ✅        │
│  Order Element        92% ✅        │
│  Product API          89% ✅        │
│  Order Worker         95% ✅        │
│  Email Helper         87% ✅        │
│                                     │
│  Uncovered Lines:                   │
│  • order.service.ts:145-150        │
│  • email.helper.ts:78              │
│                                     │
│  [Generate Missing Tests]           │
└─────────────────────────────────────┘
```

---

## Continuous Testing

### Pre-Commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:changed",
      "pre-push": "npm run test:all"
    }
  }
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Check coverage
        run: npm run test:coverage
      
      - name: Validate enforced tests
        run: npm run test:enforced
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Test Data Management

### Factories & Fixtures

Automatically generated:

```typescript
// tests/factories/product.factory.ts
import { faker } from '@faker-js/faker';
import { CreateProductDto } from '../../src/elements/product/product.entity';

export class ProductFactory {
  static create(overrides?: Partial<CreateProductDto>): CreateProductDto {
    return {
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      inventory: faker.number.int({ min: 0, max: 100 }),
      ...overrides,
    };
  }

  static createMany(count: number): CreateProductDto[] {
    return Array.from({ length: count }, () => this.create());
  }
}
```

---

## Performance Testing

### Load Tests

```typescript
// tests/performance/product-api.perf.ts
import autocannon from 'autocannon';

describe('Product API Performance', () => {
  it('should handle 1000 requests/second', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/products',
      connections: 100,
      duration: 30,
    });

    expect(result.requests.average).toBeGreaterThan(1000);
    expect(result.latency.p99).toBeLessThan(100);
  });
});
```

---

## Test Maintenance

### Automatic Test Updates

When user modifies a component:
1. Detect schema changes
2. Update affected tests
3. Add new test cases for new properties
4. Mark outdated tests for review
5. Preserve enforced tests

### Test Health Monitoring

```
⚠️  Warning: 3 tests are flaky (passed < 95% of last 100 runs)
   • order.service.test.ts:145
   • payment.helper.test.ts:89
   • email.worker.test.ts:56

   [Investigate] [Disable] [Regenerate]
```

---

## Best Practices Enforcement

All generated tests follow:
- AAA pattern (Arrange, Act, Assert)
- Descriptive test names
- One assertion per test (when possible)
- Proper mocking
- Database cleanup
- No flaky tests (deterministic)
- Fast execution (< 10s for unit, < 1m for integration)

