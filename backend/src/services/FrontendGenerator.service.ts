/**
 * Frontend Code Generator Service
 * Generates React + TypeScript + Material-UI frontend
 */

import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { templateHelpers } from '../utils/templateHelpers.js';

// Register Handlebars helpers
Object.entries(templateHelpers).forEach(([name, fn]) => {
  Handlebars.registerHelper(name, fn);
});

interface GeneratedFile {
  path: string;
  content: string;
}

export class FrontendGeneratorService {
  private templatesDir: string;

  constructor() {
    // Path to frontend templates directory
    this.templatesDir = path.join(process.cwd(), '..', 'templates', 'frontend');
  }

  /**
   * Generate complete frontend for a project
   */
  async generateFrontend(project: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    const elements = project.components.filter((c: any) => c.type === 'element');
    const manipulators = project.components.filter((c: any) => c.type === 'manipulator');
    
    const context = {
      project: {
        name: project.name,
        description: project.description,
      },
      elements,
      manipulators,
    };

    // Generate package.json
    files.push(await this.generateFromTemplate('shared/package.json.hbs', 'package.json', context));

    // Generate tsconfig files
    files.push(await this.generateFromTemplate('shared/tsconfig.json.hbs', 'tsconfig.json', context));
    files.push({
      path: 'tsconfig.node.json',
      content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`,
    });

    // Generate index.html
    files.push(await this.generateFromTemplate('shared/index.html.hbs', 'index.html', context));

    // Generate vite.config.ts
    files.push(await this.generateFromTemplate('shared/vite.config.ts.hbs', 'vite.config.ts', context));

    // Generate .env.example
    files.push({
      path: '.env.example',
      content: `# ${project.name} Frontend - Environment Variables\n\n# API URL (backend server)\nVITE_API_URL=http://localhost:3001\n`,
    });

    // Generate src files
    try {
      files.push(await this.generateFromTemplate('shared/main.tsx.hbs', 'src/main.tsx', context));
      files.push(await this.generateFromTemplate('shared/theme.ts.hbs', 'src/lib/theme.ts', context));
      files.push(await this.generateFromTemplate('shared/app-router.tsx.hbs', 'src/lib/router.tsx', context));
      files.push(await this.generateFromTemplate('shared/api-client.ts.hbs', 'src/lib/api-client.ts', context));

      // Generate layouts
      files.push(await this.generateFromTemplate('layouts/app-layout.tsx.hbs', 'src/layouts/AppLayout.tsx', context));

      // Generate auth pages
      files.push(await this.generateFromTemplate('auth/login-page.tsx.hbs', 'src/auth/LoginPage.tsx', context));

      // Generate dashboard
      files.push(await this.generateFromTemplate('dashboard/dashboard-page.tsx.hbs', 'src/dashboard/DashboardPage.tsx', context));

      // Generate shared components
      files.push(await this.generateFromTemplate('components/RelationshipField.tsx.hbs', 'src/components/RelationshipField.tsx', context));
    } catch (error: any) {
      console.error('[FrontendGen] Error generating core files:', error.message);
      console.error('[FrontendGen] Stack:', error.stack);
      throw error; // Re-throw to prevent partial frontend generation
    }

    // Generate pages for each element with a manipulator (API)
    for (const element of elements) {
      // Improved API detection - check schema.linkedElement, linkedElementId, or name pattern
      const hasApi = manipulators.some((m: any) => {
        if (m.schema?.linkedElement === element.name) return true;
        if (m.schema?.linkedElementId === element.id) return true;
        // Check name pattern: "Task API" should match "Task" element
        const apiNameWithoutSuffix = m.name.replace(/\s+API$/i, '').trim();
        if (apiNameWithoutSuffix.toLowerCase() === element.name.toLowerCase()) return true;
        return false;
      });

      if (hasApi) {
        try {
          const elementContext = {
            ...context,
            name: element.name,
            schema: element.schema,
          };

          console.log(`[FrontendGen] Generating pages for ${element.name}`);

          // List page
          files.push(await this.generateFromTemplate(
            'pages/list-page.tsx.hbs',
            `src/pages/${templateHelpers.pascalCase(element.name)}ListPage.tsx`,
            elementContext
          ));

          // Detail page
          files.push(await this.generateFromTemplate(
            'pages/detail-page.tsx.hbs',
            `src/pages/${templateHelpers.pascalCase(element.name)}DetailPage.tsx`,
            elementContext
          ));

          // Form page (create/edit)
          files.push(await this.generateFromTemplate(
            'pages/form-page.tsx.hbs',
            `src/pages/${templateHelpers.pascalCase(element.name)}FormPage.tsx`,
            elementContext
          ));

          console.log(`[FrontendGen] ✓ Generated 3 pages for ${element.name}`);
        } catch (error: any) {
          console.error(`[FrontendGen] ✗ Error generating pages for ${element.name}:`, error.message);
          // Continue with other elements even if one fails
        }
      }
    }

    // Generate .gitignore
    files.push({
      path: '.gitignore',
      content: `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
build
dist
dist-ssr
*.local

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`,
    });

    // Generate README
    files.push({
      path: 'README.md',
      content: `# ${project.name} - Frontend

${project.description || 'Generated by Worldbuilder'}

## Setup

\`\`\`bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run lint\` - Run ESLint

## Features

${elements.length > 0 ? '### Pages\n\n' + elements
  .filter((e: any) => manipulators.some((m: any) => 
    m.schema?.linkedElement === e.name ||
    m.name.toLowerCase().includes(e.name.toLowerCase())
  ))
  .map((e: any) => `- **${templateHelpers.pluralize(e.name)}** - List, View, Create, Edit`)
  .join('\n') : 'No pages generated yet.'}

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **React Router** - Routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Vite** - Build tool

---

Generated with ❤️ by [Worldbuilder](https://worldbuilder.dev)
`,
    });

    return files;
  }

  /**
   * Generate file from template
   */
  private async generateFromTemplate(
    templatePath: string,
    outputPath: string,
    context: any
  ): Promise<GeneratedFile> {
    try {
      const template = await this.loadTemplate(templatePath);
      const content = this.compileTemplate(template, context);
      return {
        path: outputPath,
        content,
      };
    } catch (error: any) {
      console.error(`Error generating ${outputPath} from template ${templatePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Load template file
   */
  private async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(this.templatesDir, templatePath);
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Template not found: ${templatePath} (${fullPath})`);
    }
  }

  /**
   * Compile Handlebars template
   */
  private compileTemplate(template: string, data: any): string {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }
}

