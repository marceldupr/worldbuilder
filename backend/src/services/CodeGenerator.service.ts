import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../utils/prisma.js';
import { templateHelpers } from '../utils/templateHelpers.js';

// Register Handlebars helpers
Object.entries(templateHelpers).forEach(([name, fn]) => {
  Handlebars.registerHelper(name, fn);
});

interface GeneratedFile {
  path: string;
  content: string;
}

export class CodeGeneratorService {
  private templatesDir: string;

  constructor() {
    // Path to templates directory from backend
    this.templatesDir = path.join(process.cwd(), '..', 'templates');
  }

  /**
   * Generate code for a project
   */
  async generateProject(projectId: string): Promise<GeneratedFile[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { components: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const files: GeneratedFile[] = [];

    // Generate package.json
    files.push(await this.generatePackageJson(project));

    // Generate README
    files.push(await this.generateReadme(project));

    // Generate .env.example
    files.push(this.generateEnvExample());

    // Generate Prisma schema
    const prismaSchema = await this.generatePrismaSchema(project.components);
    files.push(prismaSchema);

    // Generate each component
    for (const component of project.components) {
      const componentFiles = await this.generateComponent(component);
      files.push(...componentFiles);
    }

    // Generate main server file
    files.push(await this.generateServerFile(project));

    // Generate Dockerfile
    files.push(this.generateDockerfile());

    // Generate docker-compose.yml
    files.push(this.generateDockerCompose());

    // Generate test configuration files
    files.push(this.generateVitestConfig());
    files.push(this.generateTestSetup());

    return files;
  }

  /**
   * Generate code for a single component
   */
  async generateComponent(component: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    switch (component.type) {
      case 'element':
        files.push(...(await this.generateElementFiles(component)));
        break;
      case 'manipulator':
        files.push(...(await this.generateManipulatorFiles(component)));
        break;
      case 'worker':
        files.push(...(await this.generateWorkerFiles(component)));
        break;
      case 'helper':
        files.push(...(await this.generateHelperFiles(component)));
        break;
    }

    return files;
  }

  /**
   * Generate Element component files
   */
  private async generateElementFiles(component: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const schema = component.schema;
    const name = component.name;

    // Entity file
    const entityTemplate = await this.loadTemplate('element/entity.ts.hbs');
    const entityContent = this.compileTemplate(entityTemplate, { ...schema, name });
    files.push({
      path: `src/entities/${templateHelpers.kebabCase(name)}.entity.ts`,
      content: entityContent,
    });

    // Service file
    const serviceTemplate = await this.loadTemplate('element/service.ts.hbs');
    const serviceContent = this.compileTemplate(serviceTemplate, { ...schema, name });
    files.push({
      path: `src/services/${templateHelpers.kebabCase(name)}.service.ts`,
      content: serviceContent,
    });

    // Test file (always generate tests)
    try {
      const testTemplate = await this.loadTemplate('element/test.ts.hbs');
      const testContent = this.compileTemplate(testTemplate, { ...schema, name });
      files.push({
        path: `src/entities/__tests__/${templateHelpers.kebabCase(name)}.service.test.ts`,
        content: testContent,
      });
    } catch (error) {
      console.error(`Error generating test for ${name}:`, error);
    }

    return files;
  }

  /**
   * Generate Manipulator (API) files
   */
  private async generateManipulatorFiles(component: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const schema = component.schema;

    const controllerTemplate = await this.loadTemplate('manipulator/controller.ts.hbs');
    const controllerContent = this.compileTemplate(controllerTemplate, schema);
    
    files.push({
      path: `src/controllers/${templateHelpers.kebabCase(schema.linkedElement)}.controller.ts`,
      content: controllerContent,
    });

    // Test file (always generate tests)
    try {
      const testTemplate = await this.loadTemplate('manipulator/test.ts.hbs');
      const testContent = this.compileTemplate(testTemplate, schema);
      files.push({
        path: `src/controllers/__tests__/${templateHelpers.kebabCase(schema.linkedElement)}.controller.test.ts`,
        content: testContent,
      });
    } catch (error) {
      console.error(`Error generating test for ${schema.linkedElement} API:`, error);
    }

    return files;
  }

  /**
   * Generate Worker files
   */
  private async generateWorkerFiles(component: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const schema = component.schema;
    const name = component.name;

    try {
      // Queue setup
      const queueTemplate = await this.loadTemplate('worker/queue.ts.hbs');
      const queueContent = this.compileTemplate(queueTemplate, { ...schema, name });
      files.push({
        path: `src/queues/${templateHelpers.kebabCase(name)}.queue.ts`,
        content: queueContent,
      });

      // Worker processor
      const processorTemplate = await this.loadTemplate('worker/processor.ts.hbs');
      const processorContent = this.compileTemplate(processorTemplate, { ...schema, name });
      files.push({
        path: `src/workers/${templateHelpers.kebabCase(name)}.worker.ts`,
        content: processorContent,
      });
    } catch (error) {
      console.error(`Error generating worker files for ${name}:`, error);
    }

    return files;
  }

  /**
   * Generate Helper files
   */
  private async generateHelperFiles(component: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const schema = component.schema;
    const name = component.name;

    try {
      const serviceTemplate = await this.loadTemplate('helper/service.ts.hbs');
      const serviceContent = this.compileTemplate(serviceTemplate, { ...schema, name });
      files.push({
        path: `src/helpers/${templateHelpers.kebabCase(name)}.helper.ts`,
        content: serviceContent,
      });
    } catch (error) {
      console.error(`Error generating helper files for ${name}:`, error);
    }

    return files;
  }

  /**
   * Generate Prisma schema from components
   */
  private async generatePrismaSchema(components: any[]): Promise<GeneratedFile> {
    const elements = components.filter((c) => c.type === 'element');
    
    let schemaContent = `// This is your Prisma schema file
// Generated by Worldbuilder

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    for (const element of elements) {
      try {
        const template = await this.loadTemplate('element/prisma-model.hbs');
        const modelContent = this.compileTemplate(template, element.schema);
        schemaContent += modelContent + '\n\n';
      } catch (error) {
        console.error(`Error generating Prisma model for ${element.name}:`, error);
      }
    }

    return {
      path: 'prisma/schema.prisma',
      content: schemaContent,
    };
  }

  /**
   * Generate package.json
   */
  private async generatePackageJson(project: any): Promise<GeneratedFile> {
    const hasWorkers = project.components.some((c: any) => c.type === 'worker');
    const helpers = project.components.filter((c: any) => c.type === 'helper');
    
    // Detect which helper integrations are used
    const hasEmail = helpers.some((h: any) => h.schema.integration === 'sendgrid');
    const hasPayment = helpers.some((h: any) => h.schema.integration === 'stripe');
    const hasSMS = helpers.some((h: any) => h.schema.integration === 'twilio');
    const hasStorage = helpers.some((h: any) => h.schema.integration === 'supabase');

    const dependencies: Record<string, string> = {
      express: '^4.18.2',
      '@prisma/client': '^5.7.1',
      cors: '^2.8.5',
      helmet: '^7.1.0',
      dotenv: '^16.3.1',
      zod: '^3.22.4',
      winston: '^3.11.0',
    };

    // Add worker dependencies
    if (hasWorkers) {
      dependencies['bullmq'] = '^5.1.0';
      dependencies['ioredis'] = '^5.3.2';
    }

    // Add helper dependencies
    if (hasEmail) {
      dependencies['@sendgrid/mail'] = '^7.7.0';
    }
    if (hasPayment) {
      dependencies['stripe'] = '^14.10.0';
    }
    if (hasSMS) {
      dependencies['twilio'] = '^4.20.0';
    }
    if (hasStorage) {
      dependencies['@supabase/supabase-js'] = '^2.38.4';
    }

    const pkg = {
      name: templateHelpers.kebabCase(project.name),
      version: '1.0.0',
      description: project.description || '',
      type: 'module',
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
        'db:generate': 'prisma generate',
        'db:push': 'prisma db push',
        'db:migrate': 'prisma migrate dev',
        test: 'vitest run',
        'test:watch': 'vitest',
        'test:coverage': 'vitest run --coverage',
        'test:ui': 'vitest --ui',
        ...(hasWorkers && {
          'worker:dev': 'tsx watch src/workers/*.worker.ts',
        }),
      },
      dependencies,
      devDependencies: {
        '@types/express': '^4.17.21',
        '@types/cors': '^2.8.17',
        '@types/node': '^20.10.5',
        '@vitest/ui': '^1.0.4',
        '@vitest/coverage-v8': '^1.0.4',
        'supertest': '^6.3.3',
        '@types/supertest': '^6.0.2',
        typescript: '^5.3.3',
        tsx: '^4.7.0',
        prisma: '^5.7.1',
        vitest: '^1.0.4',
      },
    };

    return {
      path: 'package.json',
      content: JSON.stringify(pkg, null, 2),
    };
  }

  /**
   * Generate README
   */
  private async generateReadme(project: any): Promise<GeneratedFile> {
    const content = `# ${project.name}

${project.description || 'Generated by Worldbuilder'}

## Setup

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
\`\`\`

## API Endpoints

See the generated controllers in \`src/controllers/\`

## Generated Components

${project.components?.map((c: any) => `- ${c.name} (${c.type})`).join('\n') || 'None'}

---

Generated with ❤️ by [Worldbuilder](https://worldbuilder.dev)
`;

    return {
      path: 'README.md',
      content,
    };
  }

  /**
   * Generate .env.example
   */
  private generateEnvExample(): GeneratedFile {
    return {
      path: '.env.example',
      content: `DATABASE_URL=postgresql://user:password@localhost:5432/database
PORT=3001
NODE_ENV=development
`,
    };
  }

  /**
   * Generate main server file
   */
  private async generateServerFile(project: any): Promise<GeneratedFile> {
    const content = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: '${project.name}' });
});

// TODO: Import and use generated controllers

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 ${project.name} running on port \${PORT}\`);
});

export default app;
`;

    return {
      path: 'src/index.ts',
      content,
    };
  }

  /**
   * Generate Dockerfile
   */
  private generateDockerfile(): GeneratedFile {
    return {
      path: 'Dockerfile',
      content: `FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["npm", "start"]
`,
    };
  }

  /**
   * Generate docker-compose.yml
   */
  private generateDockerCompose(): GeneratedFile {
    return {
      path: 'docker-compose.yml',
      content: `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
`,
    };
  }

  /**
   * Generate vitest configuration
   */
  private generateVitestConfig(): GeneratedFile {
    return {
      path: 'vitest.config.ts',
      content: `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
`,
    };
  }

  /**
   * Generate test setup file
   */
  private generateTestSetup(): GeneratedFile {
    return {
      path: 'tests/setup.ts',
      content: `import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  console.log('🧪 Test setup...');
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
  console.log('🧪 Test cleanup complete');
});
`,
    };
  }

  /**
   * Load template file
   */
  private async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(this.templatesDir, templatePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Compile Handlebars template
   */
  private compileTemplate(template: string, data: any): string {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }
}

