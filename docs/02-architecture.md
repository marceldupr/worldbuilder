# Worldbuilder - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Canvas     │  │  Component   │  │   Preview    │      │
│  │   Editor     │  │   Library    │  │   Panel      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI INTERPRETATION LAYER                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OpenAI     │  │   Schema     │  │  Validation  │      │
│  │  Integration │  │  Generator   │  │   Engine     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CODE GENERATION LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Component   │  │    Test      │  │  Container   │      │
│  │  Generator   │  │  Generator   │  │  Generator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT & RUNTIME LAYER                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    GitHub    │  │   Railway    │  │  Monitoring  │      │
│  │ Integration  │  │  Deployment  │  │  & Logging   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Generated System Architecture (Per User Project)

Each user project generates a complete microservice architecture:

```
USER PROJECT
│
├── API Gateway (Express)
│   ├── Authentication middleware
│   ├── Rate limiting
│   └── Request routing
│
├── Microservices (one per major component group)
│   ├── Elements Service
│   │   ├── CRUD endpoints
│   │   ├── Validation logic
│   │   └── Business rules
│   │
│   ├── Workers Service
│   │   ├── BullMQ consumers
│   │   ├── Job processors
│   │   └── Status updates
│   │
│   └── Helper Service
│       ├── Utility functions
│       └── Integration adapters
│
├── Shared Infrastructure
│   ├── Redis (BullMQ, caching)
│   ├── Supabase (PostgreSQL, storage, auth)
│   └── Message Queue
│
├── Testing Suite
│   ├── Unit tests (Jest)
│   ├── Integration tests
│   └── E2E tests (Playwright)
│
└── DevOps
    ├── Docker compose
    ├── Kubernetes configs
    └── CI/CD pipeline
```

## Data Flow

### 1. Component Creation Flow

```
User describes component on canvas
         ↓
Natural language description captured
         ↓
OpenAI interprets description
         ↓
Generates canonical schema
         ↓
Schema validated against rules
         ↓
User reviews and approves
         ↓
Code generation triggered
         ↓
Tests generated and locked
         ↓
Component added to project
```

### 2. Runtime Flow (Generated System)

```
HTTP Request → API Gateway
                   ↓
         Authentication/Authorization
                   ↓
            Route to Manipulator
                   ↓
         Auditor validates request
                   ↓
    Element updated / Worker job queued
                   ↓
         Auditor logs changes
                   ↓
    Worker processes job (if async)
                   ↓
         Helper performs tasks
                   ↓
         Enforcer validates behavior
                   ↓
            Response returned
```

## Technology Stack Details

### Frontend (Worldbuilder Platform)
- **Framework**: React + TypeScript
- **Canvas**: React Flow or Canvas API
- **State Management**: Zustand or Redux Toolkit
- **UI Components**: Tailwind CSS + Shadcn/ui
- **Forms**: React Hook Form + Zod validation

### Backend (Worldbuilder Platform)
- **API**: Node.js + Express
- **AI Integration**: OpenAI API (GPT-4)
- **Code Generation**: Template engine (Handlebars) + AST manipulation
- **Storage**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

### Generated Code (User Projects)
- **Runtime**: Node.js v20+
- **Framework**: Express
- **Database**: Supabase PostgreSQL
- **Queue**: Redis + BullMQ
- **ORM**: Prisma
- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest + Supertest + Playwright
- **Containerization**: Docker
- **Orchestration**: Docker Compose / Kubernetes

### DevOps
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions
- **Deployment**: Railway
- **Monitoring**: Railway metrics + Sentry
- **Logging**: Winston + Elasticsearch (optional)

## Security Architecture

### Authentication & Authorization
- Supabase Auth with JWT tokens
- Row Level Security (RLS) in PostgreSQL
- API key management for service-to-service
- Rate limiting per user/endpoint

### Code Generation Security
- Input sanitization before AI interpretation
- Schema validation before code generation
- Dependency scanning (npm audit)
- Secret management (environment variables)
- SQL injection prevention (Prisma parameterized queries)

### Runtime Security (Generated Systems)
- HTTPS only
- CORS configuration
- Helmet.js security headers
- Request validation (Joi/Zod)
- SQL injection protection (ORM)
- XSS prevention
- CSRF tokens

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Load balancing (Railway handles this)
- Redis for shared state
- Database connection pooling

### Vertical Optimization
- Efficient database queries
- Caching strategy (Redis)
- Lazy loading
- Background job processing

### Database Strategy
- Proper indexing
- Query optimization
- Read replicas (future)
- Connection pooling

## Disaster Recovery

### Backups
- Supabase automated backups
- GitHub repository versioning
- Redis persistence configuration
- Docker image versioning

### Monitoring
- Health check endpoints
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring

## Multi-Tenancy

Each user project is isolated:
- Separate GitHub repository
- Separate database schema or instance
- Separate deployment
- Independent scaling

## Future Architecture Considerations

### Phase 2
- Multi-language support (Python, Go)
- GraphQL option
- Real-time features (WebSocket)
- Event sourcing pattern

### Phase 3
- Multi-cloud deployment
- Edge computing options
- Advanced ML model fine-tuning
- Custom component marketplace

