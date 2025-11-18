# Code Generation Templates

This directory contains Handlebars templates used to generate production-ready code for user projects.

## Template Organization

```
templates/
├── element/              # Data entity templates
│   ├── prisma-model.hbs  # Prisma schema model
│   ├── entity.ts.hbs     # TypeScript types + Zod validation
│   └── service.ts.hbs    # CRUD service layer
│
├── manipulator/          # REST API templates
│   └── controller.ts.hbs # Express controllers + Swagger
│
├── worker/               # Background job templates
│   ├── queue.ts.hbs      # BullMQ queue setup
│   └── processor.ts.hbs  # Job processor logic
│
└── helper/               # Integration templates
    └── service.ts.hbs    # Helper implementations
```

## Template Helpers

All templates have access to these helper functions:

### **String Case Transformations**
- `{{pascalCase str}}` → `MyClassName`
- `{{camelCase str}}` → `myVariableName`
- `{{kebabCase str}}` → `my-file-name`
- `{{snakeCase str}}` → `my_db_column`
- `{{pluralize str}}` → `products` (from `product`)

### **Type Mappings**
- `{{mapType "string"}}` → `String` (Prisma)
- `{{zodType "string"}}` → `z.string()` (Zod)

### **Comparisons**
- `{{#if (eq a b)}}` - Equality
- `{{#if (ne a b)}}` - Not equal
- `{{#if (lt a b)}}` - Less than
- `{{#if (gt a b)}}` - Greater than

### **Logic**
- `{{#if (and a b c)}}` - AND condition
- `{{#if (or a b c)}}` - OR condition

### **Arrays**
- `{{join arr ", "}}` - Join array with separator

### **Math**
- `{{multiply a b}}` - Multiplication
- `{{divide a b}}` - Division
- `{{add a b}}` - Addition
- `{{subtract a b}}` - Subtraction

## Creating New Templates

### 1. Create Template File

```handlebars
// templates/my-component/my-template.hbs
export class {{pascalCase name}} {
  constructor() {
    console.log('{{name}} initialized');
  }

  {{#each methods}}
  async {{camelCase name}}({{parameters}}): {{returns}} {
    // Implementation
  }
  {{/each}}
}
```

### 2. Register in CodeGenerator

```typescript
// backend/src/services/CodeGenerator.service.ts
case 'mycomponent':
  files.push(...(await this.generateMyComponentFiles(component)));
  break;
```

### 3. Load and Compile

```typescript
private async generateMyComponentFiles(component: any): Promise<GeneratedFile[]> {
  const template = await this.loadTemplate('my-component/my-template.hbs');
  const content = this.compileTemplate(template, component.schema);
  
  return [{
    path: `src/my-component/${kebabCase(component.name)}.ts`,
    content,
  }];
}
```

## Template Best Practices

### **1. Always Add Comments**
```handlebars
/**
 * {{name}}
 * {{description}}
 */
```

### **2. Handle Optional Fields**
```handlebars
{{#if relationships}}
  include: {
  {{#each relationships}}
    {{camelCase name}}: true,
  {{/each}}
  }
{{/if}}
```

### **3. Use Proper Indentation**
Templates should match the expected output indentation.

### **4. Add Error Handling**
```handlebars
try {
  // Operation
} catch (error) {
  console.error('Error:', error);
  throw error;
}
```

### **5. Include TypeScript Types**
```handlebars
interface {{pascalCase name}}Input {
  {{#each properties}}
  {{camelCase name}}{{#unless required}}?{{/unless}}: {{tsType type}};
  {{/each}}
}
```

## Testing Templates

### **Test Locally:**
```typescript
import Handlebars from 'handlebars';
import { templateHelpers } from './templateHelpers';

// Register helpers
Object.entries(templateHelpers).forEach(([name, fn]) => {
  Handlebars.registerHelper(name, fn);
});

// Test template
const template = Handlebars.compile('{{pascalCase name}}');
const result = template({ name: 'my-component' });
console.log(result); // MyComponent
```

### **Test Data:**
Create test schemas in `tests/fixtures/`:
```json
{
  "name": "Product",
  "properties": [
    { "name": "name", "type": "string", "required": true },
    { "name": "price", "type": "decimal", "required": true }
  ]
}
```

## Common Patterns

### **Generate CRUD Service**
```handlebars
export class {{pascalCase name}}Service {
  async create(data: Create{{pascalCase name}}Dto) {
    return await prisma.{{camelCase name}}.create({ data });
  }

  async findById(id: string) {
    return await prisma.{{camelCase name}}.findUnique({ where: { id } });
  }

  async findAll() {
    return await prisma.{{camelCase name}}.findMany();
  }

  async update(id: string, data: Update{{pascalCase name}}Dto) {
    return await prisma.{{camelCase name}}.update({ where: { id }, data });
  }

  async delete(id: string) {
    return await prisma.{{camelCase name}}.delete({ where: { id } });
  }
}
```

### **Generate REST Controller**
```handlebars
router.post('/', async (req, res) => {
  const data = {{pascalCase name}}Schema.parse(req.body);
  const result = await service.create(data);
  res.status(201).json(result);
});
```

### **Generate Prisma Model**
```handlebars
model {{pascalCase name}} {
  id        String   @id @default(uuid())
{{#each properties}}
  {{camelCase name}}  {{mapType type}}{{#if required}}{{else}}?{{/if}}
{{/each}}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("{{snakeCase (pluralize name)}}")
}
```

## Integration-Specific Templates

### **Email (SendGrid)**
Templates automatically add SendGrid integration when helper type is `email`.

### **Payment (Stripe)**
Templates automatically add Stripe integration when helper type is `payment`.

### **Storage (Supabase)**
Templates automatically add Supabase Storage when helper type is `storage`.

### **SMS (Twilio)**
Templates automatically add Twilio integration when helper type is `sms`.

## Contributing

To add a new template:
1. Create `.hbs` file in appropriate directory
2. Use existing templates as reference
3. Register in `CodeGenerator.service.ts`
4. Test with sample data
5. Document any new helpers needed

---

**Templates are the heart of code generation!** 💙

Write once, generate thousands of times.

