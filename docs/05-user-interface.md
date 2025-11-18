# Worldbuilder - User Interface & Canvas

## Design Philosophy

**"Visual programming that feels natural, not constrained"**

The Worldbuilder UI prioritizes clarity, discoverability, and rapid iteration. Non-technical users should feel empowered, while technical users should feel efficient.

---

## Main Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Worldbuilder                    Project: E-Commerce    [⚙️ 👤]  │
├─────────────────────────────────────────────────────────────────┤
│  [📦 Components] [🔄 Workflows] [🧪 Tests] [🚀 Deploy]          │
├──────────────┬──────────────────────────────────────┬───────────┤
│              │                                      │           │
│  Component   │         Canvas Area                  │ Properties│
│  Library     │                                      │  Panel    │
│              │                                      │           │
│  🔷 Element  │     ┌──────┐      ┌──────┐          │  Product  │
│  🔧 Helper   │     │Product│─────▶│ API  │          │           │
│  ⚙️  Worker  │     └──────┘      └──────┘          │  Name     │
│  🌐 Manip    │         │             │              │  Price    │
│  📋 Auditor  │     ┌───▼──┐      ┌─▼───┐          │  Inventory│
│  ✅ Enforcer │     │Audit │      │Queue│          │           │
│  🔁 Workflow │     └──────┘      └─────┘          │  [Save]   │
│              │                                      │           │
│  [+ New]     │                                      │           │
│              │                                      │           │
└──────────────┴──────────────────────────────────────┴───────────┘
│  💬 AI Assistant: "I've generated a Product element with..."    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Library Panel

### Categorized Components

```
┌─────────────────┐
│  📦 COMPONENTS  │
├─────────────────┤
│                 │
│ 🔷 ELEMENT      │
│   Data entities │
│   [+ Add]       │
│                 │
│ 🔧 HELPER       │
│   Utilities     │
│   [+ Add]       │
│                 │
│ ⚙️  WORKER      │
│   Async jobs    │
│   [+ Add]       │
│                 │
│ 🌐 MANIPULATOR  │
│   API Layer     │
│   [+ Add]       │
│                 │
│ 📋 AUDITOR      │
│   Validation    │
│   [+ Add]       │
│                 │
│ ✅ ENFORCER     │
│   Tests         │
│   [+ Add]       │
│                 │
│ 🔁 WORKFLOW     │
│   Flows         │
│   [+ Add]       │
└─────────────────┘
```

### Component Templates

When user clicks [+ Add], show common templates:

```
┌──────────────────────────────┐
│  Add Element                 │
├──────────────────────────────┤
│  Templates:                  │
│                              │
│  📦 Basic Entity             │
│     Simple CRUD entity       │
│                              │
│  👤 User/Profile             │
│     With auth & roles        │
│                              │
│  📝 Content Item             │
│     With publishing flow     │
│                              │
│  💳 Transaction              │
│     With financial audit     │
│                              │
│  🗂️  Hierarchical Item       │
│     With parent/child        │
│                              │
│  [Start from scratch]        │
└──────────────────────────────┘
```

---

## Canvas Area

### Interactive Canvas

**Technology**: React Flow or Canvas API

**Features**:
- Drag & drop components
- Auto-layout with manual override
- Zoom & pan
- Connection drawing
- Multi-select
- Undo/redo
- Minimap

### Component Representation

```
┌─────────────────────────┐
│  🔷 Product             │
│  ───────────────────    │
│  Properties:            │
│  • id: UUID             │
│  • name: String         │
│  • price: Decimal       │
│  • inventory: Integer   │
│                         │
│  Status: ✅ Generated   │
│  Tests: ✅ 15/15 pass   │
└─────────────────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌────────────┐  ┌────────────┐
│ 📋 Auditor │  │ 🌐 API     │
│            │  │            │
│ Validates  │  │ CRUD       │
│ inventory  │  │ endpoints  │
└────────────┘  └────────────┘
```

### Connection Types

**Visual distinction for different relationships**:

- **Data Flow**: Solid arrow (Element → Manipulator)
- **Trigger**: Dashed arrow (Manipulator → Worker)
- **Validation**: Double line (Auditor → Element)
- **Uses**: Dotted line (Worker → Helper)

### Component States

**Visual indicators**:
- 🟦 **Draft**: Blue - being configured
- 🟨 **Generating**: Yellow - AI processing
- 🟩 **Ready**: Green - code generated
- 🟥 **Error**: Red - validation failed
- 🟪 **Locked**: Purple - tests enforced

---

## Component Configuration Modal

### Creation Wizard

**Step 1: Describe**
```
┌────────────────────────────────────────────────┐
│  Create Element                         [×]    │
├────────────────────────────────────────────────┤
│                                                │
│  Component Name                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Product                                  │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Describe what this component should do:      │
│  ┌──────────────────────────────────────────┐ │
│  │ I need a Product with name, price, and  │ │
│  │ inventory. When inventory hits zero,    │ │
│  │ mark as out of stock. Products should   │ │
│  │ be searchable.                          │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Storage:                                      │
│  ( ) Persisted  ( ) Transient                  │
│                                                │
│                     [Cancel] [Generate Schema] │
└────────────────────────────────────────────────┘
```

**Step 2: Review AI-Generated Schema**
```
┌────────────────────────────────────────────────┐
│  Review Product Schema                  [×]    │
├────────────────────────────────────────────────┤
│  ✨ AI Generated Schema                        │
│                                                │
│  Properties                            [+ Add] │
│  ┌──────────────────────────────────────────┐ │
│  │ ✓ id (UUID) - Primary key             ✏️│ │
│  │ ✓ name (String) - Required, Max: 255  ✏️│ │
│  │ ✓ price (Decimal) - Required, Min: 0  ✏️│ │
│  │ ✓ inventory (Integer) - Required       ✏️│ │
│  │ ✓ status (Enum) - active/inactive/... ✏️│ │
│  │ ✓ createdAt (Timestamp)                ✏️│ │
│  │ ✓ updatedAt (Timestamp)                ✏️│ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Automatic Behaviors                   [+ Add] │
│  ┌──────────────────────────────────────────┐ │
│  │ ⚡ Mark out of stock when inventory = 0 │ │
│  │ ⚡ Reactivate when restocked            │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Suggested Components                          │
│  ┌──────────────────────────────────────────┐ │
│  │ 🌐 Product API (CRUD + Search)      [+]│ │
│  │ 📋 Inventory Auditor               [+]│ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  💬 Make it more specific or add details...   │
│                                                │
│         [Regenerate] [Edit Manual] [Approve]  │
└────────────────────────────────────────────────┘
```

**Step 3: Code Generation & Preview**
```
┌────────────────────────────────────────────────┐
│  Generating Product...                  [×]    │
├────────────────────────────────────────────────┤
│                                                │
│  ✅ Database schema created                    │
│  ✅ TypeScript types generated                 │
│  ✅ Validation rules added                     │
│  ✅ CRUD operations implemented                │
│  ✅ Tests generated (15 tests)                 │
│  ⏳ Running tests...                           │
│                                                │
│  ╭────────────────────────────────╮           │
│  │ ████████████████░░░░░░  75%    │           │
│  ╰────────────────────────────────╯           │
│                                                │
│  Files Generated:                              │
│  • src/elements/product/product.entity.ts      │
│  • src/elements/product/product.schema.ts      │
│  • src/elements/product/product.service.ts     │
│  • src/elements/product/__tests__/...          │
│  • prisma/migrations/add_product_table.sql     │
│                                                │
│                                 [View Code]    │
└────────────────────────────────────────────────┘
```

---

## Properties Panel

### Contextual Properties

**When Element selected**:
```
┌──────────────────┐
│  Product         │
├──────────────────┤
│  General         │
│  Name: Product   │
│  Type: Element   │
│  Status: Ready ✅│
│                  │
│  Properties (7)  │
│  [Edit Schema]   │
│                  │
│  Behaviors (2)   │
│  [Edit]          │
│                  │
│  Connected:      │
│  → Product API   │
│  → Inv. Auditor  │
│                  │
│  Tests           │
│  ✅ 15/15 pass   │
│  [Run] [Lock]    │
│                  │
│  Actions         │
│  [Duplicate]     │
│  [Delete]        │
│  [Export]        │
└──────────────────┘
```

**When Workflow selected**:
```
┌──────────────────┐
│  Order Flow      │
├──────────────────┤
│  Trigger         │
│  POST /orders    │
│                  │
│  Steps (5)       │
│  1. Validate     │
│  2. Create Order │
│  3. Process Pay  │
│  4. Queue Ship   │
│  5. Send Email   │
│                  │
│  [Edit Flow]     │
│                  │
│  Error Handling  │
│  Payment fails → │
│    Rollback      │
│                  │
│  Tests           │
│  ✅ E2E Locked   │
└──────────────────┘
```

---

## AI Assistant Panel

### Conversational Interface

```
┌─────────────────────────────────────────────────┐
│  💬 AI Assistant                         [−][×] │
├─────────────────────────────────────────────────┤
│                                                 │
│  🤖 I've created a Product element with name,  │
│     price, and inventory tracking. I also      │
│     suggested adding a Product API for CRUD    │
│     operations and an Auditor to track         │
│     inventory changes.                         │
│                                                 │
│                                          [Add]  │
│  ───────────────────────────────────────────   │
│                                                 │
│  👤 Can products have multiple images?         │
│                                                 │
│  ───────────────────────────────────────────   │
│                                                 │
│  🤖 Yes! I'll add an images property as an     │
│     array of strings (URLs). Should I also     │
│     create an Image Upload Helper to handle    │
│     uploading to Supabase Storage?             │
│                                                 │
│                                    [Yes][No]   │
│                                                 │
├─────────────────────────────────────────────────┤
│  Type a message or describe a component...     │
└─────────────────────────────────────────────────┘
```

### Suggested Actions

Context-aware suggestions:
```
💡 Suggestions:
   • Add authentication to Product API
   • Create a Worker to sync inventory with external system
   • Lock the current flow with integration tests
```

---

## Workflow Canvas

### Visual Flow Builder

```
┌────────────────────────────────────────────────┐
│  Workflow: Order Processing               [×]  │
├────────────────────────────────────────────────┤
│                                                │
│  Start                                         │
│    ⬇️                                          │
│  [ POST /orders ]                              │
│    ⬇️                                          │
│  [ Validate Input ] ────❌──▶ [ Return 400 ]  │
│    ⬇️ ✅                                       │
│  [ Create Order ]                              │
│    ⬇️                                          │
│  [ Check Inventory ] ───❌──▶ [ Return 409 ]  │
│    ⬇️ ✅                                       │
│  [ Charge Payment ] ────❌──▶ [ Cancel Order ] │
│    ⬇️ ✅                                       │
│  [ Queue Shipment ]                            │
│    ⬇️                                          │
│  [ Send Email ] ─────❌──▶ [ Log Error ]       │
│    ⬇️ ✅                                       │
│  [ Return 201 ]                                │
│    ⬇️                                          │
│  End                                           │
│                                                │
│                          [Test] [Lock] [Save]  │
└────────────────────────────────────────────────┘
```

---

## Testing Interface

### Test Dashboard

```
┌─────────────────────────────────────────────────┐
│  🧪 Tests                                       │
├─────────────────────────────────────────────────┤
│  Overall: ✅ 89/92 passing (97%)                │
│  ⏱️  Last run: 2 minutes ago                    │
│                                                 │
│  Unit Tests          ✅ 45/45                   │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Product.create validates name          │ │
│  │ ✅ Product.restock increments inventory   │ │
│  │ ✅ Product transitions to out_of_stock    │ │
│  │ ... (show 42 more)                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Integration Tests   ✅ 32/34                   │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ POST /products creates product         │ │
│  │ ❌ GET /products?search= returns results  │ │
│  │ ❌ Worker processes order successfully    │ │
│  │ ... (show 31 more)                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  E2E Tests           ✅ 12/13                   │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ 🔒 User registration flow              │ │
│  │ ✅ 🔒 Product creation flow               │ │
│  │ ✅ Order fulfillment flow                 │ │
│  │ ... (show 10 more)                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  🔒 = Test locked (enforced)                   │
│                                                 │
│              [Run All] [Fix Failures] [Lock]   │
└─────────────────────────────────────────────────┘
```

---

## Deployment Interface

### One-Click Deploy

```
┌─────────────────────────────────────────────────┐
│  🚀 Deploy                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Project: E-Commerce Platform                   │
│  Status: Ready to deploy ✅                     │
│                                                 │
│  GitHub Repository                              │
│  ┌───────────────────────────────────────────┐ │
│  │ username/ecommerce-platform               │ │
│  └───────────────────────────────────────────┘ │
│  [Connect GitHub]                               │
│                                                 │
│  Environment Variables                          │
│  ✅ DATABASE_URL (Supabase)                     │
│  ✅ REDIS_URL (Railway)                         │
│  ⚠️  STRIPE_API_KEY (required)                  │
│  ⚠️  SENDGRID_API_KEY (required)                │
│                                                 │
│  [Configure Secrets]                            │
│                                                 │
│  Deployment Target                              │
│  ( ) Railway  ( ) Docker Compose                │
│                                                 │
│  Pre-Deploy Checks                              │
│  ✅ All tests passing                           │
│  ✅ No security vulnerabilities                 │
│  ✅ Database migrations ready                   │
│  ⚠️  Missing environment variables              │
│                                                 │
│                          [Configure] [Deploy]   │
└─────────────────────────────────────────────────┘
```

---

## Mobile/Tablet Considerations

### Responsive Design
- Collapsible panels
- Touch-friendly component library
- Simplified canvas interactions
- Gesture support (pinch-to-zoom)

### Progressive Web App
- Offline component library
- Local draft saving
- Sync when online

---

## Accessibility

- Keyboard navigation throughout
- Screen reader support
- High contrast mode
- Customizable font sizes
- ARIA labels on all interactive elements

---

## User Onboarding

### First-Time Experience

**Interactive Tutorial**:
1. "Welcome! Let's build a simple app together"
2. "Drag a User element to the canvas"
3. "Describe what users should have"
4. "Watch AI generate the schema"
5. "Approve and see the code"
6. "Add a login API"
7. "Connect components"
8. "Lock with tests"
9. "Deploy to Railway"

**Empty State**:
```
┌─────────────────────────────────────────┐
│  Start Building Something Amazing! 🚀   │
│                                         │
│  [Create from Template]                 │
│  • E-Commerce Platform                  │
│  • Blog / CMS                           │
│  • Task Management                      │
│  • SaaS Starter                         │
│                                         │
│  [Start from Scratch]                   │
│                                         │
│  [Take Interactive Tour]                │
└─────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

```
⌘/Ctrl + N     New component
⌘/Ctrl + S     Save project
⌘/Ctrl + Z     Undo
⌘/Ctrl + Y     Redo
⌘/Ctrl + F     Search components
Delete         Delete selected
⌘/Ctrl + D     Duplicate selected
⌘/Ctrl + G     Generate code
⌘/Ctrl + T     Run tests
Space + Drag   Pan canvas
```

---

## Visual Design System

### Colors
- **Primary**: Blue (#3B82F6) - Actions, links
- **Success**: Green (#10B981) - Tests passing, ready states
- **Warning**: Yellow (#F59E0B) - Warnings, suggestions
- **Error**: Red (#EF4444) - Failures, validation errors
- **Info**: Purple (#8B5CF6) - Locked tests, special features

### Typography
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Code**: Fira Code

### Component Cards
- Rounded corners (8px)
- Subtle shadows
- Hover states
- Smooth transitions

