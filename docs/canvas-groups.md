# Canvas Groups - Organization Feature

## Overview

Canvas Groups provide visual organization for your components, helping you distinguish between loose-standing components and system-wide components while keeping your canvas tidy and understandable.

## Key Features

### 1. **Visual Grouping Containers**
Groups appear as colored rectangular containers on the canvas that can hold multiple components.

### 2. **Three Group Types**

#### 🌐 System Groups (Purple)
- **Purpose**: System-wide components like Authentication, global Enforcers, system-level Auditors
- **Visual**: Purple border and badge
- **Use Case**: Components that affect the entire application

#### 📦 Feature Groups (Blue)
- **Purpose**: Business feature groups (e.g., Task Management, Document Management, User Profiles)
- **Visual**: Blue border and badge
- **Use Case**: Components that belong to a specific business feature

#### ⚙️ Infrastructure Groups (Gray)
- **Purpose**: Background workers, helpers, utilities
- **Visual**: Gray border and badge
- **Use Case**: Supporting infrastructure components

### 3. **Collapsible Groups**
- Click the arrow (▶/▼) to collapse or expand groups
- Collapsed groups show a compact header with component count
- Helps manage canvas real estate

### 4. **Drag-and-Drop Organization**
- Drag components into group containers
- Components automatically join the group when dropped inside
- Components show a badge indicating their group membership
- Drag components out to remove them from groups

## How to Use

### Creating a Group

1. Click the **"Create Group"** button in the left sidebar (gradient purple-blue button)
2. Fill in:
   - **Group Name**: e.g., "Task Management", "Authentication", "Background Jobs"
   - **Description** (optional): Brief description of what the group contains
   - **Group Type**: Choose System, Feature, or Infrastructure
3. Click **"Create Group"**

### Adding Components to Groups

**Method 1: Drag and Drop**
- Create a group on the canvas
- Drag existing components into the group container
- A toast notification confirms the component was added

**Method 2: Position New Components**
- Create a group first
- Drop new components inside the group area
- They'll automatically be added to the group

### Managing Groups

**From the Sidebar:**
- View all groups in the "Groups" section
- Click ▶/▼ to collapse/expand groups
- Click ✏️ to edit group properties

**From the Canvas:**
- Click the group header buttons:
  - **▶/▼**: Toggle collapse state
  - **✏️**: Edit group (name, description, type)
  - **🗑️**: Delete group (doesn't delete components inside)

### Visual Indicators

**System-Wide Components:**
- Show a purple "🌐 System" badge in the top-right corner
- Have a subtle purple ring around them
- Automatically applied to Auth components and components in System groups

**Grouped Components:**
- Show a "📦 Group Name" badge in the top-left corner
- Badge color matches the group type (purple/blue/gray)

## Example Organization

```
┌─────────────────────────────────────────────┐
│  🌐 AUTHENTICATION (System Group)           │
│  ┌──────┐   ┌─────────┐                     │
│  │ Auth │──▶│ Auth API│                     │
│  └──────┘   └─────────┘                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📦 TASK MANAGEMENT (Feature Group)         │
│  ┌──────┐   ┌─────────┐   ┌──────────┐     │
│  │ Task │──▶│ Task API│──▶│ Reminder │     │
│  └──────┘   └─────────┘   │ Worker   │     │
│     │                      └──────────┘     │
│  ┌──▼────────┐                              │
│  │ Auditor   │                              │
│  └───────────┘                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📦 DOCUMENT MANAGEMENT (Feature Group)     │
│  ┌──────────┐   ┌──────────────┐           │
│  │ Document │──▶│ Document API │           │
│  └──────────┘   └──────────────┘           │
└─────────────────────────────────────────────┘

⚙️ BACKGROUND WORKERS (Infrastructure Group)
┌──────────────┐   ┌──────────────┐
│ Email Helper │   │ PDF Helper   │
└──────────────┘   └──────────────┘
```

## Best Practices

1. **Start with System Components**: Create a System group for Authentication and global components first
2. **Group by Feature**: Each major business feature should have its own group
3. **Infrastructure Last**: Put helpers and workers in an Infrastructure group
4. **Use Descriptions**: Add brief descriptions to groups to clarify their purpose
5. **Collapse When Done**: Collapse groups you're not actively working on to reduce clutter
6. **Don't Over-Group**: It's okay to have some components outside groups for quick experiments

## Benefits

✅ **Clearer Architecture**: Easy to see which components belong together
✅ **Reduced Canvas Clutter**: Collapse groups to keep canvas manageable
✅ **Better Communication**: Visual organization helps when explaining the system to others
✅ **Faster Navigation**: Quickly find components by their feature area
✅ **System vs Feature Distinction**: Clear visual separation of concerns

## Technical Details

- Groups are stored in the canvas data alongside nodes and edges
- Group membership is tracked via `nodeIds` array in each group
- Components show group badges when inside a group
- Deleting a group doesn't delete its components, just ungroups them
- Groups can be moved and resized (future enhancement)
- Groups auto-save with the rest of the canvas

---

**Note**: Groups are a visual organization tool. They don't affect code generation or component relationships—they're purely for helping you organize and understand your canvas better.

