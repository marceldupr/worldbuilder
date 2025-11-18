import Handlebars from 'handlebars';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { templateHelpers } from '../utils/templateHelpers.js';

const prisma = new PrismaClient();

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
    const entityContent = this.compileTemplate(entityTemplate, schema);
    files.push({
      path: `src/entities/${templateHelpers.kebabCase(name)}.entity.ts`,
      content: entityContent,
    });

    // Service file
    const serviceTemplate = await this.loadTemplate('element/service.ts.hbs');
    const serviceContent = this.compileTemplate(serviceTemplate, schema);
    files.push({
      path: `src/services/${templateHelpers.kebabCase(name)}.service.ts`,
      content: serviceContent,
    });

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

    return files;
  }

  /**
   * Generate Worker files
   */
  private async generateWorkerFiles(component: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const schema = component.schema;
    const name = component.name;

    // TODO: Implement worker templates
    files.push({
      path: `src/workers/${templateHelpers.kebabCase(name)}.worker.ts`,
      content: `// Worker: ${name}\n// TODO: Implement worker\n`,
    });

    return files;
  }

  /**
   * Generate Helper files
   */
  private async generateHelperFiles(component: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const schema = component.schema;
    const name = component.name;

    files.push({
      path: `src/helpers/${templateHelpers.kebabCase(name)}.helper.ts`,
      content: `// Helper: ${name}\n// TODO: Implement helper\n`,
    });

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
        test: 'vitest',
      },
      dependencies: {
        express: '^4.18.2',
        '@prisma/client': '^5.7.1',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        dotenv: '^16.3.1',
        zod: '^3.22.4',
        winston: '^3.11.0',
      },
      devDependencies: {
        '@types/express': '^4.17.21',
        '@types/cors': '^2.8.17',
        '@types/node': '^20.10.5',
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

