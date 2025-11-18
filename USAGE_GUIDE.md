# Worldbuilder - Usage Guide

## 🎯 Quick Start

### Creating Components

1. **Drag a component** from the sidebar onto the canvas
2. **Fill in the description** using natural language
3. **AI generates the schema** automatically
4. **Review and save** the component

### Editing Components

- **Single-click** a component to view its details in the right panel
- **Double-click** a component to edit it
  - Modify the description
  - Regenerate the schema with AI
  - Save changes

### Defining Relationships

To connect two elements (e.g., "Task belongs to Owner"):

1. **Click and drag** from the bottom handle of one element
2. **Drop on the top handle** of another element  
3. **Choose relationship type**:
   - `belongsTo` - One-to-one inverse (Task → Owner)
   - `hasOne` - One-to-one (Owner → Profile)
   - `hasMany` - One-to-many (Owner → Tasks)
   - `manyToMany` - Many-to-many (Task ↔ Tags)
4. **Name the field** (e.g., "owner", "ownerId")
5. **Save** - the relationship is added to the schema!

## 🔷 Component Types

### Element
Data entities with properties, validations, and relationships.

**Example**: Task
```
A Task has a name, slug, description, deadline, and sort order. 
Name is required, slug should be unique and auto-generated.
```

### Data API
REST API endpoints that expose Element data.

- Automatically links to an Element
- **Auto-syncs**: When you edit the Element's schema, the API automatically reflects changes at code generation time
- Configure which operations to expose (CRUD)
- Set authentication per endpoint

### Worker ⚙️
Background job processors for async operations.

**Example**: Order Processing Worker
```
Process orders: validate inventory → charge payment → create shipment → send email
```

### Helper 🔧
Utility services and integrations (Email, Payment, Storage, etc.)

**Example**: Email Helper (SendGrid), Payment Helper (Stripe), Storage Helper (Supabase)

### Auth 🔐
Complete authentication system with role-based access control.

**Features:**
- Email/password, magic links, OAuth
- Multi-factor authentication
- Password reset flow
- Email verification
- Role hierarchy (guest < user < manager < admin)
- RBAC middleware

**Example**:
```
Authentication with Supabase
Roles: admin, manager, user
Features: email/password, password reset, email verification
```

**Generated:**
- Auth endpoints (/auth/signup, /auth/login, etc.)
- RBAC middleware (requireRole, requireAdmin)
- Permission checks
- Role-based route protection

### Auditor 📋
Tracks all changes and enforces validation rules.

**Purpose**: 
- **Passive tracking** - Records who changed what and when
- Stores before/after snapshots
- Compliance and audit trails
- Validation hooks (optional)

**Example**: Task Auditor
```
Track all changes to Tasks. Log who created, updated, or deleted tasks with timestamps. Keep audit logs for 7 years for compliance.
```

**Generated**:
- Audit log table in database
- Before/after hooks on create/update/delete
- Query API to view audit history
- Validation middleware (optional)

### Enforcer ✅
Enforces business rules and workflows between components.

**Purpose**:
- **Active enforcement** - Prevents invalid operations
- Cross-component validation
- Workflow state machines
- Permission rules

**Example**: Order Rules
```
Can't delete User with active Orders. Order workflow: pending → payment_confirmed → shipped → delivered (can't skip steps). Only admin can cancel shipped orders. Check inventory before Order is confirmed.
```

**Generated**:
- Validation middleware
- Business rule engine
- Permission checks
- Workflow state enforcement
- Runs on create/update/delete operations

### Workflow 🔄
Multi-step process orchestration that connects multiple components.

**Purpose**:
- Orchestrates complex flows
- Step-by-step execution
- Error handling (retry/skip/abort)
- Rollback support
- 4 trigger types (HTTP, Event, Schedule, Manual)

**Example**: Order Fulfillment
```
Trigger: HTTP /orders/fulfill
Steps: validate inventory → charge payment → create shipment → send confirmation email → update analytics
```

**Generated:**
- Workflow orchestrator class
- Step execution engine
- Error recovery
- Timeout management
- Uses actual component names

---

## 📸 **File Uploads - The Intuitive Way**

### How It Works (Seamlessly!)

**Step 1: Create Element with File Fields**
```
Element: Product
Description: A Product with name, price, description, and images (array of image URLs for product photos)
```

**AI recognizes "images" as file field and sets type to "image"**

**Step 2: Create Data API**
When you create a Data API for Product:
- ✅ **System auto-detects** the "images" field (type: image)
- ✅ **Automatically enables** file upload
- ✅ **Pre-fills** upload fields with "images"
- ✅ Shows notification: "Auto-detected file fields: images"

**Step 3: Add Storage Helper** (if not exists)
```
Drag Helper → Select "Storage Helper (Supabase)"
```

**Step 4: Generate Code**
System automatically generates:
- Upload endpoint: `POST /products/upload`
- Multipart form-data handling
- Integration with Storage Helper
- File validation (size, type)
- URL storage in database

### Complete Example

**1. Create Product Element:**
```
A Product with:
- name (string, required)
- price (decimal, required)
- description (text)
- images (array of image URLs) - for product photos
- thumbnail (image URL) - for list view
```

**AI generates:**
```json
{
  "properties": [
    { "name": "name", "type": "string", "required": true },
    { "name": "price", "type": "decimal", "required": true },
    { "name": "description", "type": "string" },
    { "name": "images", "type": "image", "isArray": true },
    { "name": "thumbnail", "type": "image" }
  ]
}
```

**2. Create Product API:**
- System detects `images` and `thumbnail` fields
- Auto-enables file uploads ✓
- Pre-fills: "images, thumbnail"
- You just click Create!

**3. Add Storage Helper:**
- Drag Helper 🔧 to canvas
- Select "Storage Helper (Supabase)"
- Done!

**4. Generate Code:**
```typescript
// Generated upload endpoint
router.post('/products/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const productId = req.body.productId;
  
  // Upload to Supabase Storage
  const url = await storageHelper.uploadFile(
    'products',
    `${productId}/${file.originalname}`,
    file.buffer
  );
  
  // Update product with image URL
  await productService.update(productId, {
    images: [...product.images, url]
  });
  
  res.json({ url });
});
```

### Supported File Types

**In Element creation, use these types:**
- `image` - For photos, avatars, thumbnails
- `file` - For general files
- `document` - For PDFs, Word docs

**AI understands these keywords:**
- "avatar", "photo", "picture", "thumbnail" → type: image
- "document", "PDF", "file", "attachment" → type: document/file
- Always mention "for upload" or "URL" in description

### Field Arrays

For multiple files:
```
- images (array of image URLs) - for product gallery
- attachments (array of file URLs) - for multiple documents
```

AI will set `isArray: true` automatically.

## 🔗 How Relationships Work

When you connect components:

1. The relationship is stored in the **source component's schema**
2. At code generation time:
   - Database foreign keys are created
   - TypeScript types include the relationship
   - Prisma schema reflects the relationship

### Example: Task belongs to Owner

```typescript
// Generated schema for Task
{
  properties: [...],
  relationships: [
    {
      type: "belongsTo",
      from: "Task",
      to: "Owner",
      fieldName: "owner",
      required: true
    }
  ]
}

// Generated Prisma schema
model Task {
  id       String  @id @default(uuid())
  name     String
  ownerId  String
  owner    Owner   @relation(fields: [ownerId], references: [id])
}

model Owner {
  id    String @id @default(uuid())
  name  String
  tasks Task[]
}
```

## 📎 Data API Auto-Sync

Data APIs reference Elements by ID rather than copying their schema:

```typescript
// Data API schema
{
  linkedElementId: "uuid-of-task-element",
  operations: { create: true, read: true, ... }
}
```

**Benefits**:
- ✅ Edit Task properties → API endpoints automatically reflect changes
- ✅ Add/remove fields → No need to manually update the API
- ✅ Add relationships → API includes related data
- ✅ Always in sync at code generation time

## 🎨 UI Tips

### Canvas
- **Drag** components from the left sidebar
- **Connect** by dragging from bottom to top handles
- **Pan** by dragging the canvas
- **Zoom** with mouse wheel or controls

### Right Panel
- Shows **project stats** (component counts)
- **Single-click** a component to see details
- View **linked elements** (for Data APIs)
- View **relationships** (for Elements)
- View **properties** and **operations**

### Keyboard Shortcuts
- `Ctrl/Cmd + G` - Generate code
- `Ctrl/Cmd + S` - Save (auto-saves anyway)

## 🚀 Workflow Example

### Building a Task Management System

1. **Create Elements**
   - Owner (name, email)
   - Task (name, description, deadline)
   
2. **Define Relationships**
   - Drag from Task → Owner
   - Choose "belongsTo"
   - Field name: "owner"
   - Save

3. **Create APIs**
   - Add "Owner API" (Data API)
     - Links to Owner element
     - Exposes CRUD operations
   - Add "Task API" (Data API)
     - Links to Task element
     - Automatically includes owner relationship!

4. **Generate Code**
   - Click "Generate Code"
   - Review generated files
   - Push to GitHub
   - Deploy!

## 💡 Best Practices

1. **Start with Elements** - Define your data model first
2. **Add Relationships** - Connect related elements
3. **Then add APIs** - Data APIs auto-sync with Elements
4. **Edit freely** - Data APIs stay in sync when you change Elements
5. **Use AI descriptions** - More detail = better schema generation

## 🔒 Test Locking (Enforcer)

### What is Test Locking?

When you **lock tests** for a component, Worldbuilder:
1. ✅ Generates comprehensive unit and integration tests
2. ✅ Stores test definitions in the database
3. ✅ Marks the component with a 🔒 icon
4. ✅ Prevents regression by enforcing these tests before deployment

### How to Lock Tests

1. **Click on a component** to view details in the right panel
2. **Click "Lock Tests"** button (🔓 → 🔒)
3. **Tests are automatically generated and locked!**
4. View the list of locked tests in the purple panel

### Locked Test Types

**For Elements:**
- ✅ `should create [Name] with valid data` - Basic creation test
- ✅ `should reject missing [field]` - Required field validation
- ✅ `should reject [field] below minimum` - Min/max constraints
- ✅ `should default [field] to [value]` - Default values

**For Data APIs:**
- ✅ `should [operation] [Element] via API` - Integration tests for each enabled operation

### Test Files in Generated Code

When you generate code, you'll see:
- 🧪 `src/entities/__tests__/[name].service.test.ts` - Unit tests
- 🧪 `src/controllers/__tests__/[name].controller.test.ts` - Integration tests
- ⚙️ `vitest.config.ts` - Test configuration
- 📋 `tests/setup.ts` - Test setup/teardown

### Running Tests

In the generated project:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run test:ui       # Visual UI
```

### Unlocking Tests

To modify a component after locking:
1. Click the component
2. Click "🔒 Locked" button to unlock
3. Edit the component
4. Re-lock tests to capture new behavior

### Why Lock Tests?

- **Prevent Regressions** - Changes that break locked tests are immediately visible
- **Document Behavior** - Tests serve as living documentation
- **Deployment Safety** - Know your critical paths are protected
- **Team Confidence** - Anyone can modify code knowing tests will catch issues

## 🐛 Troubleshooting

### "You need to create an Element first"
- Data APIs require an existing Element to link to
- Create Elements before Data APIs

### Relationship not showing in generated code
- Make sure the relationship was saved successfully
- Check the Element's details panel to verify the relationship exists

### API doesn't reflect Element changes
- This is expected in the UI - changes sync at **code generation time**
- Generate code to see the latest schema reflected in API endpoints

### Tests not appearing in generated code
- Make sure templates exist in `/templates/element/test.ts.hbs`
- Check backend logs for template loading errors
- Templates are optional - basic files will still generate

