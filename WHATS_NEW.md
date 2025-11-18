# 🎉 What's New in Worldbuilder

## ✨ Latest Updates

### 🔒 Test Locking System

**Lock critical tests to prevent regressions!**

- Click any Element or Data API component
- Click "🔓 Lock Tests" button
- System automatically generates and stores test definitions
- Component shows 🔒 icon on canvas
- View all locked tests in the component details panel
- Tests are generated in code output

**Test Types Generated:**
- Unit tests (property validation, required fields, constraints, defaults)
- Integration tests (API operations)
- Includes vitest configuration

### 📋 Auditor Component (NEW!)

**Track every change with audit trails**

**What it does:**
- Records who changed what and when
- Stores before/after snapshots
- Compliance and audit logging
- Optional validation rules

**How to use:**
1. Drag "Auditor" 📋 onto canvas
2. Link to an Element
3. Select which events to track (create, update, delete, state changes)
4. Set retention period (e.g., 7 years for compliance)
5. Enable validation rules (optional)

**Generated code:**
- AuditLog database table
- Auditor class with before/after hooks
- Query API to view audit history
- Automatic tracking on all operations

**Example:**
```
Task Auditor
- Tracks all Task changes
- Logs who created/updated/deleted
- Stores timestamps
- 7 year retention
```

### ✅ Enforcer Component (NEW!)

**Enforce business rules between components**

**What it does:**
- Prevents invalid operations at runtime
- Enforces workflows (state transitions)
- Cross-component validation
- Permission rules

**How to use:**
1. Drag "Enforcer" ✅ onto canvas
2. Describe your business rules in natural language
3. AI generates enforcement logic
4. Review generated rules
5. Save!

**Rule Types:**
- 🔄 **Workflow Rules** - "Order must have payment before shipping"
- 🔗 **Data Constraints** - "Can't delete User with active Orders"
- 🔐 **Permission Rules** - "Only admin can delete Products"
- ✓ **Cross-Component Validation** - "Check inventory before creating Order"

**Generated code:**
- Enforcer class with business logic
- Validation middleware
- Permission checks
- Workflow state enforcement
- Runs automatically on create/update/delete

**Example:**
```
Order Rules Enforcer

Business Rules:
- Can't delete User if they have active Orders
- Order workflow: pending → payment_confirmed → shipped → delivered
- Cannot skip steps or go backwards
- Only admin can cancel shipped Orders
- Check inventory before confirming Order
```

### 🔗 Relationship System

**Connect Elements visually!**

- Drag from one Element to another
- Choose relationship type (belongsTo, hasOne, hasMany, manyToMany)
- Name the field
- Set if required
- Relationship automatically included in generated code

**Generated:**
- Foreign keys in database
- TypeScript types include relationships
- Prisma relations configured
- API endpoints include related data

### 🎨 Better Component Names

**Renamed "Manipulator" → "Data API"**

More intuitive for non-technical users! Internal type remains `manipulator` for compatibility.

### 🧪 Test Generation

**Automatic test file generation!**

Every Element and Data API now generates comprehensive tests:

**Element Tests:**
- ✅ Create with valid data
- ✅ Reject missing required fields
- ✅ Validate min/max constraints  
- ✅ Test default values
- ✅ CRUD operations

**Data API Tests:**
- ✅ Integration tests for each operation
- ✅ Authentication checks
- ✅ Request validation
- ✅ Pagination support

**Generated Files:**
- 🧪 `src/entities/__tests__/[name].service.test.ts`
- 🧪 `src/controllers/__tests__/[name].controller.test.ts`
- ⚙️ `vitest.config.ts`
- 📋 `tests/setup.ts`

**Run tests in generated project:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode  
npm run test:coverage # Coverage report
npm run test:ui       # Visual UI
```

### 🐛 Bug Fixes

- ✅ Fixed OpenAI model to use `gpt-4o-mini` (JSON mode support)
- ✅ Fixed Prisma connection pooling (single client instance)
- ✅ Fixed rate limiting (increased for development)
- ✅ Fixed auto-save debouncing (prevents request spam)
- ✅ Added defensive null checks to template helpers
- ✅ Removed `outputs/` folder from git tracking
- ✅ Cleaned up 10 redundant markdown files

### 📝 Documentation

- ✅ Created comprehensive USAGE_GUIDE.md
- ✅ Updated README.md with new component types
- ✅ Cleaned up root directory (removed progress tracking files)
- ✅ Added test locking documentation
- ✅ Added Auditor/Enforcer examples

---

## 🎯 Complete Component Library (ALL 6 TYPES!)

1. **Element** 🔷 - Data entities
2. **Data API** 🌐 - REST endpoints (was "Manipulator")  
3. **Worker** ⚙️ - Background jobs
4. **Helper** 🔧 - Utilities & integrations
5. **Auditor** 📋 - Audit trails & validation (NEW!)
6. **Enforcer** ✅ - Business rules & workflows (NEW!)

---

## 🚀 Ready to Use!

All 6 component types are now fully functional with:
- ✅ Visual canvas creation
- ✅ AI-powered schema generation
- ✅ Code generation with templates
- ✅ Test generation
- ✅ Component editing
- ✅ Relationships
- ✅ Test locking
- ✅ Audit logging
- ✅ Business rule enforcement

**Start building:** `npm run dev`

---

Built with ❤️ for creators everywhere

