# Worldbuilder - Technology Stack

## Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│  React + TypeScript + Tailwind + React Flow                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 WORLDBUILDER BACKEND                         │
│  Node.js + Express + OpenAI + Code Generator                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  GENERATED SYSTEMS                           │
│  Node.js + Express + Prisma + BullMQ + Supabase             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                            │
│  Railway + Docker + PostgreSQL + Redis                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Worldbuilder Platform Stack

### Frontend

#### React + TypeScript
**Why**: Industry standard, massive ecosystem, excellent TypeScript support

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "@types/react": "^18.2.0"
}
```

**Key Features**:
- Component-based architecture
- Virtual DOM for performance
- Hooks for state management
- Rich ecosystem of libraries

#### React Flow
**Why**: Best-in-class library for building node-based UIs

```json
{
  "reactflow": "^11.0.0"
}
```

**Key Features**:
- Drag-and-drop canvas
- Custom nodes and edges
- Auto-layout algorithms
- Mini-map and controls
- Touch support

**Alternative Considered**: Canvas API (too low-level), D3.js (overkill)

#### Tailwind CSS + Shadcn/ui
**Why**: Rapid UI development with consistency

```json
{
  "tailwindcss": "^3.3.0",
  "@radix-ui/react-*": "^1.0.0"
}
```

**Key Features**:
- Utility-first CSS
- No runtime overhead
- Responsive by default
- Dark mode support
- Accessible components (Radix UI)

#### Zustand
**Why**: Simple, lightweight state management

```json
{
  "zustand": "^4.4.0"
}
```

**Key Features**:
- Minimal boilerplate
- No providers needed
- TypeScript-first
- DevTools support
- Middleware for persistence

**Alternative Considered**: Redux (too complex), Context API (performance issues)

#### Zod
**Why**: Schema validation with TypeScript inference

```json
{
  "zod": "^3.22.0"
}
```

**Key Features**:
- Type-safe validation
- Composable schemas
- Error messages
- Transform pipelines
- Parse and validate in one step

---

### Worldbuilder Backend

#### Node.js 20 LTS
**Why**: JavaScript everywhere, huge ecosystem, async I/O

```json
{
  "node": ">=20.0.0"
}
```

**Key Features**:
- Non-blocking I/O
- NPM ecosystem
- Easy scaling
- Fast execution (V8)
- Native TypeScript support improving

#### Express.js
**Why**: Mature, minimal, flexible web framework

```json
{
  "express": "^4.18.0"
}
```

**Key Features**:
- Middleware architecture
- Robust routing
- Large ecosystem
- Simple to extend
- Well-documented

**Alternative Considered**: Fastify (less mature ecosystem), Koa (smaller community)

#### Prisma ORM
**Why**: Type-safe database access with excellent DX

```json
{
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0"
}
```

**Key Features**:
- Auto-generated types
- Migration system
- Query builder with IntelliSense
- Connection pooling
- Multi-database support

**Alternative Considered**: TypeORM (less type-safe), Drizzle (newer, less proven)

#### OpenAI SDK
**Why**: Best-in-class LLM for code generation

```json
{
  "openai": "^4.0.0"
}
```

**Models Used**:
- **GPT-4**: Complex schema generation, initial interpretations
- **GPT-3.5-turbo**: Refinements, simple updates
- **Future**: Fine-tuned models for worldbuilder-specific tasks

**Alternative Considered**: Anthropic Claude (good but API less mature), Local models (not powerful enough yet)

#### Handlebars
**Why**: Logic-less templates for code generation

```json
{
  "handlebars": "^4.7.0"
}
```

**Key Features**:
- Simple syntax
- Partials and helpers
- Precompilation
- Security (auto-escaping)
- No code execution in templates

**Alternative Considered**: EJS (too much logic), Template literals (no helpers)

---

## Generated System Stack

### Runtime

#### Node.js 20 LTS + Express
**Why**: Same as platform for consistency and best practices

**Key Features**:
- Proven at scale
- Easy to hire for
- Rich middleware ecosystem
- Good performance
- Familiar to most developers

#### TypeScript (Strict Mode)
**Why**: Type safety prevents entire classes of bugs

```json
{
  "typescript": "^5.0.0",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "esModuleInterop": true
  }
}
```

**Key Features**:
- Compile-time type checking
- Better IDE support
- Self-documenting code
- Refactoring safety
- Scales to large codebases

---

### Database & Storage

#### Supabase (PostgreSQL)
**Why**: Full backend-as-a-service with PostgreSQL at its core

```json
{
  "@supabase/supabase-js": "^2.38.0"
}
```

**Key Features**:
- PostgreSQL database (battle-tested)
- Built-in auth (JWT, OAuth, Magic Links)
- Row Level Security (RLS)
- Storage (S3-compatible)
- Real-time subscriptions
- Auto-generated REST API
- Edge functions
- Free tier generous

**What We Use**:
- **Database**: Primary data store
- **Auth**: User authentication and authorization
- **Storage**: File uploads (images, documents)
- **RLS**: Tenant isolation

**Why Not Others**:
- **Firebase**: NoSQL limitations, vendor lock-in, pricing
- **AWS RDS**: More complex setup, no built-in auth
- **PlanetScale**: MySQL not as feature-rich as PostgreSQL
- **Self-hosted PostgreSQL**: More ops overhead

#### Prisma (Database Access)
**Why**: Best ORM for TypeScript + PostgreSQL

**Key Features**:
- Type-safe queries
- Automatic migrations
- Schema as source of truth
- Query builder, not SQL
- Great error messages
- Connection pooling

**Example Generated Schema**:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(255)
  price     Decimal  @db.Decimal(10, 2)
  inventory Int      @default(0)
  status    Status   @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([name])
  @@map("products")
}

enum Status {
  ACTIVE
  INACTIVE
  OUT_OF_STOCK
}
```

---

### Queue & Background Jobs

#### Redis + BullMQ
**Why**: Reliable, fast, feature-rich job queue

```json
{
  "ioredis": "^5.3.0",
  "bullmq": "^5.0.0"
}
```

**Why Redis**:
- In-memory speed
- Persistence options
- Pub/sub support
- Atomic operations
- Battle-tested

**Why BullMQ**:
- Built on Redis
- Retries and backoff
- Job priority
- Delayed jobs
- Progress tracking
- Events and hooks
- UI dashboard (Bull Board)
- TypeScript support

**Alternative Considered**:
- **RabbitMQ**: More complex setup, less Node.js friendly
- **Kafka**: Overkill for most use cases
- **SQS**: Vendor lock-in, slower

---

### API Documentation

#### Swagger / OpenAPI 3.0
**Why**: Industry standard for API documentation

```json
{
  "swagger-jsdoc": "^6.2.0",
  "swagger-ui-express": "^5.0.0"
}
```

**Key Features**:
- Interactive API docs
- Auto-generated from code
- Try-it-out functionality
- Schema validation
- Client SDK generation
- Industry standard

**Generated for Every Project**:
- All endpoints documented
- Request/response schemas
- Authentication requirements
- Example requests
- Error responses

---

### Testing

#### Jest
**Why**: Zero-config, feature-complete testing framework

```json
{
  "jest": "^29.0.0",
  "ts-jest": "^29.0.0",
  "@types/jest": "^29.0.0"
}
```

**Key Features**:
- Fast with parallelization
- Snapshot testing
- Code coverage
- Mocking built-in
- Watch mode
- TypeScript support

#### Supertest
**Why**: HTTP assertion library for API testing

```json
{
  "supertest": "^6.3.0"
}
```

**Key Features**:
- Express integration
- Chainable assertions
- HTTP verb methods
- No server start needed

#### Playwright
**Why**: Best E2E testing framework for modern web

```json
{
  "@playwright/test": "^1.40.0"
}
```

**Key Features**:
- Cross-browser testing
- Auto-wait for elements
- Network interception
- Video recording
- Screenshots
- Parallel execution
- Debug mode

**Alternative Considered**: Cypress (slower, less stable), Selenium (outdated)

---

### Validation

#### Zod
**Why**: Runtime validation with TypeScript inference

```json
{
  "zod": "^3.22.0"
}
```

**Example Usage**:
```typescript
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  inventory: z.number().int().min(0),
});

// Type is automatically inferred
type CreateProductDto = z.infer<typeof CreateProductSchema>;
```

**Key Features**:
- Type inference
- Composable schemas
- Transform pipelines
- Custom error messages
- Parse and validate
- Works client and server

**Alternative Considered**: Joi (no TypeScript inference), Yup (less powerful)

---

### Security

#### Helmet.js
**Why**: Security headers for Express

```json
{
  "helmet": "^7.0.0"
}
```

**Sets Headers**:
- Content-Security-Policy
- X-DNS-Prefetch-Control
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

#### express-rate-limit
**Why**: Rate limiting to prevent abuse

```json
{
  "express-rate-limit": "^7.0.0"
}
```

**Default Configuration**:
```typescript
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests'
}
```

#### bcrypt
**Why**: Password hashing (if needed beyond Supabase)

```json
{
  "bcrypt": "^5.1.0"
}
```

---

### Logging & Monitoring

#### Winston
**Why**: Feature-rich logging library

```json
{
  "winston": "^3.11.0"
}
```

**Key Features**:
- Multiple transports
- Log levels
- Formatting
- JSON logging
- Stream support
- Profiling

#### Sentry (Optional)
**Why**: Error tracking and monitoring

```json
{
  "@sentry/node": "^7.0.0"
}
```

**Key Features**:
- Error tracking
- Performance monitoring
- Release tracking
- Breadcrumbs
- User feedback
- Source maps

---

## Infrastructure

### Container Runtime

#### Docker
**Why**: Industry standard for containerization

**Key Features**:
- Consistent environments
- Easy deployment
- Multi-stage builds
- Layer caching
- Compose for local dev
- Works everywhere

**Generated Files**:
- `Dockerfile` (multi-stage for optimization)
- `docker-compose.yml` (local development)
- `.dockerignore` (smaller images)

---

### Deployment Platform

#### Railway
**Why**: Best DX for deploying containerized apps

**Key Features**:
- Zero-config deployments
- GitHub integration
- Auto-scaling
- Managed databases
- Environment variables
- Logs and metrics
- Fair pricing ($5/GB RAM/month)
- Generous free tier

**What Railway Provides**:
- PostgreSQL (or use Supabase)
- Redis
- Automatic HTTPS
- Custom domains
- Rollbacks
- Preview environments

**Alternative Considered**:
- **Heroku**: More expensive, less flexible
- **Vercel**: Serverless only, cold starts
- **AWS/GCP**: Too complex for target users
- **DigitalOcean**: More ops required
- **Fly.io**: Good but smaller ecosystem

---

### Version Control

#### GitHub
**Why**: Industry standard, best integrations

**Key Features**:
- Git hosting
- Actions for CI/CD
- Dependabot security updates
- Code review tools
- Project management
- Largest developer community

**What We Use**:
- Repository hosting
- GitHub Actions for CI/CD
- Branch protection
- Automated PRs for updates
- Release management

---

## Developer Experience

### Code Quality

#### ESLint
**Why**: JavaScript/TypeScript linting

```json
{
  "eslint": "^8.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0"
}
```

**Rules**: Airbnb base + TypeScript recommended

#### Prettier
**Why**: Consistent code formatting

```json
{
  "prettier": "^3.0.0"
}
```

**Configuration**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80
}
```

#### Husky + lint-staged
**Why**: Git hooks for quality checks

```json
{
  "husky": "^8.0.0",
  "lint-staged": "^15.0.0"
}
```

**Pre-commit**:
- Lint staged files
- Format with Prettier
- Type check

**Pre-push**:
- Run tests
- Check for console.logs

---

## Cost Analysis

### Development Phase

**Monthly Costs**:
- Worldbuilder platform hosting: **~$25-50** (Railway)
- Database (Supabase): **Free** tier
- OpenAI API: **~$50-200** (depends on usage)
- GitHub: **Free** (public repos) or **$4/user** (private)
- Total: **~$75-250/month**

### Generated System (Per Project)

**Small Project** (<1000 users):
- Railway (1GB RAM): **$5/month**
- Supabase: **Free** tier
- Redis (Railway): **$5/month**
- **Total: ~$10/month**

**Medium Project** (1000-10000 users):
- Railway (2GB RAM, 2 instances): **$20/month**
- Supabase Pro: **$25/month**
- Redis: **$5/month**
- **Total: ~$50/month**

**Large Project** (10000+ users):
- Railway (4GB+ RAM, autoscale): **$100-200/month**
- Supabase Pro + extra: **$50-100/month**
- Redis: **$10/month**
- **Total: ~$160-310/month**

**Much cheaper than hiring developers!**

---

## Future Considerations

### Phase 2
- **GraphQL**: Option to generate GraphQL instead of REST
- **Python support**: Generate Python + FastAPI
- **Go support**: Generate Go + Gin
- **React Native**: Generate mobile apps
- **WebSocket**: Real-time features

### Phase 3
- **Kubernetes**: For large-scale deployments
- **AWS/GCP adapters**: Deploy to any cloud
- **Self-hosted option**: On-prem deployments
- **Custom databases**: MongoDB, DynamoDB support
- **Serverless option**: Generate serverless functions

---

## Decision Matrix

### Why This Stack Wins

| Criteria | Our Stack | Alternative |
|----------|-----------|-------------|
| **Learning Curve** | Moderate | High (microservices) |
| **Cost** | Low ($10-50/mo) | High ($100+/mo) |
| **Developer Pool** | Large (JS/TS) | Small (niche) |
| **Scalability** | High (proven) | Varies |
| **Type Safety** | Excellent (TS) | Varies |
| **Ecosystem** | Huge (npm) | Smaller |
| **Deployment** | Easy (Railway) | Complex (K8s) |
| **Maintenance** | Low (managed) | High (self-host) |

### Stack Principles

1. **Boring Technology**: Proven, mature, well-documented
2. **TypeScript Everywhere**: Type safety end-to-end
3. **Developer Experience**: Fast feedback, good errors
4. **Managed Services**: Supabase, Railway (less ops)
5. **Open Source**: No vendor lock-in, full control
6. **Cost Effective**: Generous free tiers, fair pricing
7. **Scalable**: Grows with user needs
8. **Modern**: Current best practices, not legacy

