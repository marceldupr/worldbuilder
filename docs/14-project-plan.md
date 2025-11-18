# Worldbuilder - Project Plan

## Overview

This document breaks down the Worldbuilder project into actionable Features, Epics, and User Stories following Agile methodology.

**Timeline**: Phase 1 MVP (16 weeks / 4 months)  
**Team Size**: 5-8 people  
**Methodology**: 2-week sprints  

---

## Structure

```
FEATURES (Product Capabilities)
    └─> EPICS (Major Work Streams)
        └─> USER STORIES (Specific Tasks)
            └─> TASKS (Implementation Details)
```

---

## Priority Legend

- **P0**: Blocker - Must have for MVP
- **P1**: Critical - Core functionality
- **P2**: Important - Enhances experience
- **P3**: Nice to have - Can be post-MVP

## Story Point Scale

- **1 point**: < 4 hours
- **2 points**: 4-8 hours (half day)
- **3 points**: 1 day
- **5 points**: 2-3 days
- **8 points**: 1 week
- **13 points**: 2 weeks (should be broken down)

---

# PHASE 1: MVP (Sprints 1-8)

## Feature 1: Platform Foundation

**Goal**: Core infrastructure and authentication system

### Epic 1.1: Project Setup & Infrastructure
**Owner**: Tech Lead  
**Sprint**: 1  
**Story Points**: 21

#### Story 1.1.1: Initialize Frontend Repository
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: A configured React + TypeScript project  
**So that**: I can start building the UI

**Acceptance Criteria**:
- [ ] Vite + React 18 + TypeScript configured
- [ ] Tailwind CSS installed and working
- [ ] ESLint + Prettier configured
- [ ] Git repository initialized with .gitignore
- [ ] README with setup instructions
- [ ] npm scripts for dev, build, test
- [ ] Can run `npm run dev` successfully

**Tasks**:
- [ ] Create Vite React TS template
- [ ] Install Tailwind CSS and configure
- [ ] Set up ESLint (Airbnb rules)
- [ ] Set up Prettier
- [ ] Configure Git hooks (Husky)
- [ ] Write README

---

#### Story 1.1.2: Initialize Backend Repository
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: A configured Node.js + Express + TypeScript backend  
**So that**: I can start building APIs

**Acceptance Criteria**:
- [ ] Express + TypeScript configured
- [ ] Prisma ORM set up with schema file
- [ ] Environment variables managed (.env)
- [ ] ESLint + Prettier configured
- [ ] Basic error handling middleware
- [ ] Health check endpoint works
- [ ] Can run `npm run dev` successfully

**Tasks**:
- [ ] Initialize Node.js project with TypeScript
- [ ] Install Express and types
- [ ] Set up Prisma with initial schema
- [ ] Configure environment variables
- [ ] Create basic Express app structure
- [ ] Add error handling middleware
- [ ] Create health check endpoint

---

#### Story 1.1.3: Set Up Supabase Database
**Priority**: P0  
**Points**: 2  
**As a**: Developer  
**I want**: A PostgreSQL database connected via Supabase  
**So that**: I can store application data

**Acceptance Criteria**:
- [ ] Supabase project created
- [ ] Database connection string in .env
- [ ] Prisma can connect to Supabase
- [ ] Initial migration runs successfully
- [ ] Can query database from backend

**Tasks**:
- [ ] Create Supabase account and project
- [ ] Get connection string
- [ ] Configure Prisma with Supabase URL
- [ ] Create initial schema (users, projects tables)
- [ ] Run initial migration
- [ ] Test connection

---

#### Story 1.1.4: Set Up CI/CD Pipeline
**Priority**: P1  
**Points**: 5  
**As a**: Developer  
**I want**: Automated testing and deployment  
**So that**: Code quality is maintained automatically

**Acceptance Criteria**:
- [ ] GitHub Actions workflow for tests
- [ ] Runs on every PR and push to main
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Tests run (even if none yet)
- [ ] Build succeeds
- [ ] Deployment to staging on merge to main

**Tasks**:
- [ ] Create .github/workflows/test.yml
- [ ] Configure test job (lint, type-check, test)
- [ ] Create deploy workflow
- [ ] Set up Railway for staging
- [ ] Configure environment secrets
- [ ] Test full pipeline

---

#### Story 1.1.5: Set Up Development Environment
**Priority**: P1  
**Points**: 3  
**As a**: Developer  
**I want**: Docker Compose for local development  
**So that**: Everyone has consistent environment

**Acceptance Criteria**:
- [ ] docker-compose.yml works
- [ ] Starts frontend, backend, database, Redis
- [ ] Hot reload works for frontend and backend
- [ ] Ports are properly mapped
- [ ] README documents how to use

**Tasks**:
- [ ] Create docker-compose.yml
- [ ] Add PostgreSQL service
- [ ] Add Redis service
- [ ] Add frontend service with volume mounts
- [ ] Add backend service with volume mounts
- [ ] Document in README

---

#### Story 1.1.6: Design System Setup
**Priority**: P1  
**Points**: 5  
**As a**: Designer/Developer  
**I want**: Shadcn/ui components configured  
**So that**: UI is consistent and accessible

**Acceptance Criteria**:
- [ ] Shadcn/ui initialized
- [ ] Core components installed (Button, Card, Modal, etc.)
- [ ] Theme configured (colors, typography)
- [ ] Components work and are styled
- [ ] Storybook optional but nice to have

**Tasks**:
- [ ] Install Shadcn/ui
- [ ] Configure theme colors
- [ ] Install core components
- [ ] Create example page using components
- [ ] Document component usage

---

### Epic 1.2: Authentication System
**Owner**: Backend Engineer  
**Sprint**: 1-2  
**Story Points**: 21

#### Story 1.2.1: Supabase Auth Integration
**Priority**: P0  
**Points**: 5  
**As a**: User  
**I want**: To sign up and log in with email  
**So that**: I can access my projects

**Acceptance Criteria**:
- [ ] Sign up form works (email + password)
- [ ] Login form works
- [ ] Email verification sent
- [ ] JWT token stored securely
- [ ] Token refreshes automatically
- [ ] Logout works
- [ ] Error messages displayed properly

**Tasks**:
- [ ] Install @supabase/supabase-js
- [ ] Create Supabase client
- [ ] Build SignUp component
- [ ] Build Login component
- [ ] Implement auth context/store
- [ ] Handle token storage (localStorage/cookie)
- [ ] Test full auth flow

---

#### Story 1.2.2: Google OAuth Integration
**Priority**: P1  
**Points**: 3  
**As a**: User  
**I want**: To sign in with Google  
**So that**: I can authenticate quickly

**Acceptance Criteria**:
- [ ] "Sign in with Google" button appears
- [ ] Clicking opens Google OAuth flow
- [ ] Successful auth creates user account
- [ ] User is redirected to dashboard
- [ ] Profile picture from Google is saved

**Tasks**:
- [ ] Enable Google OAuth in Supabase
- [ ] Add "Sign in with Google" button
- [ ] Implement OAuth callback handling
- [ ] Test full OAuth flow

---

#### Story 1.2.3: Protected Routes
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: Protected routes that require auth  
**So that**: Unauthorized users can't access dashboard

**Acceptance Criteria**:
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can access dashboard
- [ ] Auth state persists on page refresh
- [ ] Loading state shown while checking auth

**Tasks**:
- [ ] Create ProtectedRoute component
- [ ] Implement auth check logic
- [ ] Add loading state
- [ ] Wrap dashboard routes with protection
- [ ] Test redirect flows

---

#### Story 1.2.4: User Profile Management
**Priority**: P2  
**Points**: 5  
**As a**: User  
**I want**: To manage my profile  
**So that**: I can update my information

**Acceptance Criteria**:
- [ ] Profile page shows user info
- [ ] Can update name, email, avatar
- [ ] Can change password
- [ ] Changes saved to database
- [ ] Success/error messages shown

**Tasks**:
- [ ] Create Profile page UI
- [ ] Build update profile API endpoint
- [ ] Build change password API endpoint
- [ ] Implement avatar upload (Supabase Storage)
- [ ] Add form validation
- [ ] Test update flows

---

#### Story 1.2.5: Session Management
**Priority**: P1  
**Points**: 3  
**As a**: Developer  
**I want**: Proper session management  
**So that**: Users stay logged in appropriately

**Acceptance Criteria**:
- [ ] Session expires after 7 days
- [ ] Refresh token extends session
- [ ] Concurrent sessions allowed (max 5)
- [ ] Can view active sessions
- [ ] Can revoke sessions

**Tasks**:
- [ ] Configure session duration
- [ ] Implement token refresh logic
- [ ] Create sessions management UI
- [ ] Test session expiration
- [ ] Test multi-device login

---

#### Story 1.2.6: Backend Auth Middleware
**Priority**: P0  
**Points**: 2  
**As a**: Backend Developer  
**I want**: Authentication middleware for API routes  
**So that**: I can protect endpoints easily

**Acceptance Criteria**:
- [ ] Middleware validates JWT tokens
- [ ] Invalid tokens return 401
- [ ] User object attached to request
- [ ] Easy to apply to routes
- [ ] Error messages are clear

**Tasks**:
- [ ] Create auth middleware function
- [ ] Integrate with Supabase JWT verification
- [ ] Add user object to request type
- [ ] Test with protected endpoint
- [ ] Document usage

---

### Epic 1.3: Project Management
**Owner**: Full-Stack Engineer  
**Sprint**: 2  
**Story Points**: 13

#### Story 1.3.1: Database Schema for Projects
**Priority**: P0  
**Points**: 2  
**As a**: Developer  
**I want**: Database schema for projects  
**So that**: Users can save their work

**Acceptance Criteria**:
- [ ] Projects table with id, name, userId, createdAt, updatedAt
- [ ] Components table for storing canvas components
- [ ] Relationships table for component connections
- [ ] Prisma schema defined
- [ ] Migration created and applied

**Tasks**:
- [ ] Design database schema
- [ ] Write Prisma schema
- [ ] Create migration
- [ ] Apply migration
- [ ] Test CRUD operations

---

#### Story 1.3.2: Create Project API
**Priority**: P0  
**Points**: 3  
**As a**: User  
**I want**: To create a new project  
**So that**: I can start building

**Acceptance Criteria**:
- [ ] POST /api/projects creates project
- [ ] Requires authentication
- [ ] Validates project name (required, max 100 chars)
- [ ] Returns created project with ID
- [ ] Project belongs to authenticated user

**Tasks**:
- [ ] Create POST /api/projects endpoint
- [ ] Add request validation
- [ ] Implement create logic
- [ ] Write unit tests
- [ ] Write integration tests

---

#### Story 1.3.3: List Projects API
**Priority**: P0  
**Points**: 2  
**As a**: User  
**I want**: To see all my projects  
**So that**: I can choose which to work on

**Acceptance Criteria**:
- [ ] GET /api/projects returns user's projects
- [ ] Requires authentication
- [ ] Returns projects sorted by updatedAt desc
- [ ] Includes component count per project
- [ ] Supports pagination (optional for MVP)

**Tasks**:
- [ ] Create GET /api/projects endpoint
- [ ] Implement list logic with filters
- [ ] Add sorting
- [ ] Write tests
- [ ] Document API

---

#### Story 1.3.4: Project Dashboard UI
**Priority**: P0  
**Points**: 5  
**As a**: User  
**I want**: A dashboard showing my projects  
**So that**: I can access and manage them

**Acceptance Criteria**:
- [ ] Dashboard shows project cards
- [ ] Each card shows name, last updated, component count
- [ ] "New Project" button prominent
- [ ] Clicking card opens project
- [ ] Empty state for no projects

**Tasks**:
- [ ] Create Dashboard page component
- [ ] Build ProjectCard component
- [ ] Fetch projects from API
- [ ] Add loading state
- [ ] Add empty state
- [ ] Add "New Project" button/modal

---

#### Story 1.3.5: Delete Project
**Priority**: P1  
**Points**: 1  
**As a**: User  
**I want**: To delete a project  
**So that**: I can remove ones I don't need

**Acceptance Criteria**:
- [ ] Delete button on project card (with confirmation)
- [ ] DELETE /api/projects/:id endpoint
- [ ] Soft delete (mark as deleted, don't remove)
- [ ] Success message shown
- [ ] Project removed from list

**Tasks**:
- [ ] Add delete button to card
- [ ] Add confirmation modal
- [ ] Create DELETE endpoint
- [ ] Implement soft delete
- [ ] Update UI after delete

---

---

## Feature 2: Visual Canvas

**Goal**: Interactive canvas for building system architecture

### Epic 2.1: Canvas Foundation
**Owner**: Frontend Engineer  
**Sprint**: 2-3  
**Story Points**: 21

#### Story 2.1.1: React Flow Integration
**Priority**: P0  
**Points**: 5  
**As a**: Developer  
**I want**: React Flow canvas working  
**So that**: Users can drag and drop components

**Acceptance Criteria**:
- [ ] React Flow installed and rendering
- [ ] Empty canvas with controls (zoom, pan)
- [ ] Grid background visible
- [ ] Minimap shown in corner
- [ ] Canvas state managed properly

**Tasks**:
- [ ] Install reactflow package
- [ ] Create Canvas component
- [ ] Configure basic settings
- [ ] Add controls (zoom, fit view)
- [ ] Add minimap
- [ ] Style canvas appropriately

---

#### Story 2.1.2: Component Library Sidebar
**Priority**: P0  
**Points**: 3  
**As a**: User  
**I want**: A sidebar with draggable components  
**So that**: I can add them to my system

**Acceptance Criteria**:
- [ ] Left sidebar with component categories
- [ ] Shows Element, Helper, Worker, Manipulator, Auditor, Enforcer
- [ ] Components are draggable
- [ ] Visual icons for each type
- [ ] Tooltips explain each type

**Tasks**:
- [ ] Create ComponentLibrary sidebar component
- [ ] Design component cards
- [ ] Implement drag start handler
- [ ] Add icons for each component type
- [ ] Add tooltips

---

#### Story 2.1.3: Drag and Drop to Canvas
**Priority**: P0  
**Points**: 5  
**As a**: User  
**I want**: To drag components to canvas  
**So that**: I can build my system visually

**Acceptance Criteria**:
- [ ] Dragging from sidebar works
- [ ] Dropping on canvas creates node
- [ ] Node appears at drop location
- [ ] Animation on drop (subtle)
- [ ] Can't drop outside canvas bounds

**Tasks**:
- [ ] Implement onDragOver handler
- [ ] Implement onDrop handler
- [ ] Create node from dropped component
- [ ] Position node at mouse location
- [ ] Add drop animation
- [ ] Handle edge cases

---

#### Story 2.1.4: Custom Node Components
**Priority**: P0  
**Points**: 5  
**As a**: Developer  
**I want**: Custom styled nodes for each component type  
**So that**: Canvas looks professional

**Acceptance Criteria**:
- [ ] Custom node for Element (blue, with icon)
- [ ] Custom node for Manipulator (indigo, with icon)
- [ ] Each shows component name
- [ ] Shows status badge (draft/ready/error)
- [ ] Hover effect
- [ ] Selected state styling

**Tasks**:
- [ ] Create ElementNode component
- [ ] Create ManipulatorNode component
- [ ] Design node styles
- [ ] Add icons
- [ ] Add status badges
- [ ] Register custom nodes with React Flow

---

#### Story 2.1.5: Connect Components
**Priority**: P0  
**Points**: 3  
**As a**: User  
**I want**: To connect components with lines  
**So that**: I can show relationships

**Acceptance Criteria**:
- [ ] Click and drag from node handle creates edge
- [ ] Edge connects to target node
- [ ] Edge is styled (color based on relationship)
- [ ] Can delete edge (click + delete key)
- [ ] Invalid connections prevented

**Tasks**:
- [ ] Add handles to custom nodes
- [ ] Style edges
- [ ] Implement connection validation
- [ ] Add edge deletion
- [ ] Test various connection scenarios

---

---

### Epic 2.2: Canvas Interactions
**Owner**: Frontend Engineer  
**Sprint**: 3  
**Story Points**: 13

#### Story 2.2.1: Select and Move Nodes
**Priority**: P0  
**Points**: 2  
**As a**: User  
**I want**: To select and move nodes  
**So that**: I can organize my canvas

**Acceptance Criteria**:
- [ ] Clicking node selects it (highlight)
- [ ] Dragging selected node moves it
- [ ] Multi-select with Shift+click
- [ ] Can move multiple nodes at once
- [ ] Selection cleared when clicking canvas

**Tasks**:
- [ ] Implement node selection
- [ ] Style selected state
- [ ] Implement multi-select
- [ ] Test movement

---

#### Story 2.2.2: Delete Nodes
**Priority**: P0  
**Points**: 1  
**As a**: User  
**I want**: To delete nodes  
**So that**: I can remove components I don't need

**Acceptance Criteria**:
- [ ] Delete key removes selected nodes
- [ ] Confirmation shown (if has connections)
- [ ] Connected edges also deleted
- [ ] Undo available (nice to have)

**Tasks**:
- [ ] Listen for delete key
- [ ] Implement deletion logic
- [ ] Add confirmation modal
- [ ] Remove connected edges
- [ ] Update state

---

#### Story 2.2.3: Undo/Redo
**Priority**: P1  
**Points**: 5  
**As a**: User  
**I want**: Undo and redo functionality  
**So that**: I can fix mistakes

**Acceptance Criteria**:
- [ ] Cmd+Z / Ctrl+Z undoes last action
- [ ] Cmd+Shift+Z / Ctrl+Y redoes
- [ ] History limited to 50 actions
- [ ] Works for add, move, delete, connect

**Tasks**:
- [ ] Implement history stack
- [ ] Track state changes
- [ ] Implement undo logic
- [ ] Implement redo logic
- [ ] Add keyboard listeners
- [ ] Test thoroughly

---

#### Story 2.2.4: Auto-Layout
**Priority**: P2  
**Points**: 3  
**As a**: User  
**I want**: Auto-layout button to organize nodes  
**So that**: My canvas looks tidy

**Acceptance Criteria**:
- [ ] "Auto-layout" button in toolbar
- [ ] Clicking organizes nodes intelligently
- [ ] Uses hierarchical layout (top to bottom)
- [ ] Maintains relationships
- [ ] Animated transition

**Tasks**:
- [ ] Research layout algorithms (dagre)
- [ ] Install layout library
- [ ] Implement auto-layout function
- [ ] Add animation
- [ ] Add toolbar button

---

#### Story 2.2.5: Canvas Persistence
**Priority**: P0  
**Points**: 2  
**As a**: Developer  
**I want**: Canvas state saved to database  
**So that**: Users don't lose work

**Acceptance Criteria**:
- [ ] Canvas state serialized to JSON
- [ ] Auto-saves every 5 seconds (debounced)
- [ ] Saves on manual save (Cmd+S)
- [ ] Loads state on project open
- [ ] "Saving..." indicator shown

**Tasks**:
- [ ] Create save function
- [ ] Serialize canvas state
- [ ] Implement auto-save with debounce
- [ ] Create PATCH /api/projects/:id endpoint
- [ ] Load state on mount
- [ ] Add save indicator

---

---

## Feature 3: AI Integration

**Goal**: OpenAI integration for schema generation

### Epic 3.1: OpenAI Setup
**Owner**: Backend Engineer  
**Sprint**: 3  
**Story Points**: 8

#### Story 3.1.1: OpenAI API Integration
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: OpenAI API configured  
**So that**: I can generate schemas

**Acceptance Criteria**:
- [ ] OpenAI SDK installed
- [ ] API key in environment variables
- [ ] Test endpoint successfully calls GPT-4
- [ ] Error handling for API failures
- [ ] Rate limiting implemented

**Tasks**:
- [ ] Install openai package
- [ ] Create OpenAI service class
- [ ] Implement test endpoint
- [ ] Add error handling
- [ ] Add rate limiting
- [ ] Write tests

---

#### Story 3.1.2: Prompt Engineering for Element
**Priority**: P0  
**Points**: 5  
**As a**: Developer  
**I want**: Prompt that generates Element schemas  
**So that**: AI understands user descriptions

**Acceptance Criteria**:
- [ ] System prompt defines Element structure
- [ ] User prompt includes description + context
- [ ] Output is valid JSON schema
- [ ] Includes properties, types, validations
- [ ] Suggests relationships if applicable
- [ ] 80%+ accuracy in testing

**Tasks**:
- [ ] Research and write system prompt
- [ ] Define output schema structure
- [ ] Test with various descriptions
- [ ] Iterate on prompt
- [ ] Document prompt template
- [ ] Create unit tests with fixtures

---

---

### Epic 3.2: Schema Generation
**Owner**: Full-Stack Engineer  
**Sprint**: 4  
**Story Points**: 21

#### Story 3.2.1: Element Creation Flow - Modal
**Priority**: P0  
**Points**: 3  
**As a**: User  
**I want**: A modal to describe my Element  
**So that**: I can create components

**Acceptance Criteria**:
- [ ] Clicking Element opens modal
- [ ] Modal has component name input
- [ ] Large textarea for description
- [ ] Example descriptions shown
- [ ] Tips for good descriptions
- [ ] "Generate" button

**Tasks**:
- [ ] Create ElementModal component
- [ ] Design modal UI
- [ ] Add form fields
- [ ] Add examples and tips
- [ ] Add Generate button
- [ ] Handle modal open/close

---

#### Story 3.2.2: Generate Schema API
**Priority**: P0  
**Points**: 5  
**As a**: Backend Developer  
**I want**: API endpoint that calls OpenAI  
**So that**: Frontend can generate schemas

**Acceptance Criteria**:
- [ ] POST /api/generate/element endpoint
- [ ] Accepts componentType and description
- [ ] Calls OpenAI with proper prompt
- [ ] Returns structured schema JSON
- [ ] Validates schema before returning
- [ ] Handles API errors gracefully

**Tasks**:
- [ ] Create generate router
- [ ] Implement element generation endpoint
- [ ] Build prompt from user input
- [ ] Call OpenAI API
- [ ] Parse and validate response
- [ ] Handle errors
- [ ] Write tests

---

#### Story 3.2.3: Loading State During Generation
**Priority**: P1  
**Points**: 2  
**As a**: User  
**I want**: Beautiful loading state  
**So that**: I know AI is working

**Acceptance Criteria**:
- [ ] Modal shows loading overlay
- [ ] Progress indicator (animated)
- [ ] Status messages ("AI is thinking...")
- [ ] Can't close modal while generating
- [ ] Takes 3-7 seconds typically

**Tasks**:
- [ ] Create LoadingOverlay component
- [ ] Design loading animation
- [ ] Add status messages
- [ ] Show during API call
- [ ] Test UX

---

#### Story 3.2.4: Schema Review UI
**Priority**: P0  
**Points**: 5  
**As a**: User  
**I want**: To review generated schema  
**So that**: I can approve or modify it

**Acceptance Criteria**:
- [ ] Modal shows generated schema clearly
- [ ] Properties listed with types
- [ ] Can edit property names/types inline
- [ ] Can add/remove properties
- [ ] Shows suggested behaviors
- [ ] "Approve" and "Regenerate" buttons

**Tasks**:
- [ ] Create SchemaReview component
- [ ] Design property list UI
- [ ] Implement inline editing
- [ ] Add/remove property functionality
- [ ] Show behaviors section
- [ ] Wire up buttons

---

#### Story 3.2.5: Save Schema to Project
**Priority**: P0  
**Points**: 3  
**As a**: User  
**I want**: Approved schema saved  
**So that**: It's part of my project

**Acceptance Criteria**:
- [ ] Clicking "Approve" saves schema
- [ ] Component appears on canvas with "Ready" status
- [ ] Schema stored in database
- [ ] Node updates to show properties
- [ ] Success message shown

**Tasks**:
- [ ] Create component save endpoint
- [ ] Update canvas with new node
- [ ] Save schema to database
- [ ] Update node styling
- [ ] Show success feedback

---

#### Story 3.2.6: Regenerate Schema
**Priority**: P1  
**Points**: 3  
**As a**: User  
**I want**: To regenerate if not satisfied  
**So that**: I can get better results

**Acceptance Criteria**:
- [ ] "Regenerate" button calls API again
- [ ] Can modify description before regenerating
- [ ] Loading state shown again
- [ ] New schema replaces old one
- [ ] Can regenerate multiple times

**Tasks**:
- [ ] Add regenerate button
- [ ] Allow description editing
- [ ] Call generate API again
- [ ] Replace schema in UI
- [ ] Test multiple regenerations

---

---

## Feature 4: Code Generation

**Goal**: Generate production-ready TypeScript code

### Epic 4.1: Template System
**Owner**: Backend Engineer  
**Sprint**: 4-5  
**Story Points**: 21

#### Story 4.1.1: Template Engine Setup
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: Handlebars template engine configured  
**So that**: I can generate code from schemas

**Acceptance Criteria**:
- [ ] Handlebars installed
- [ ] Template loading system works
- [ ] Can pass data to templates
- [ ] Output is valid code
- [ ] Templates are organized by component type

**Tasks**:
- [ ] Install handlebars
- [ ] Create templates/ directory structure
- [ ] Build template loader utility
- [ ] Create sample template
- [ ] Test rendering
- [ ] Document template system

---

#### Story 4.1.2: Prisma Schema Template
**Priority**: P0  
**Points**: 5  
**As a**: Developer  
**I want**: Template that generates Prisma schema  
**So that**: Database models are created

**Acceptance Criteria**:
- [ ] Template generates valid Prisma schema
- [ ] Includes all properties with correct types
- [ ] Adds indexes where appropriate
- [ ] Handles relationships
- [ ] Includes timestamps
- [ ] Schema is properly formatted

**Tasks**:
- [ ] Create prisma-schema.template.hbs
- [ ] Map JSON types to Prisma types
- [ ] Add index generation logic
- [ ] Handle relationships
- [ ] Test with various schemas
- [ ] Validate output

---

#### Story 4.1.3: TypeScript Entity Template
**Priority**: P0  
**Points**: 5  
**As a**: Developer  
**I want**: Template for TypeScript types  
**So that**: Type safety is maintained

**Acceptance Criteria**:
- [ ] Generates TypeScript interfaces
- [ ] Zod schemas for validation
- [ ] Create/Update DTO types
- [ ] Types are properly exported
- [ ] Imports are correct

**Tasks**:
- [ ] Create entity.template.ts
- [ ] Generate interface from schema
- [ ] Generate Zod schema
- [ ] Generate DTO types
- [ ] Test with various schemas

---

#### Story 4.1.4: Service Layer Template
**Priority**: P0  
**Points**: 5  
**As a**: Developer  
**I want**: Template for service class  
**So that**: CRUD logic is implemented

**Acceptance Criteria**:
- [ ] Generates service class with CRUD methods
- [ ] Uses Prisma for database access
- [ ] Includes error handling
- [ ] Has proper TypeScript types
- [ ] Follows best practices

**Tasks**:
- [ ] Create service.template.ts
- [ ] Implement create method template
- [ ] Implement read methods template
- [ ] Implement update method template
- [ ] Implement delete method template
- [ ] Add error handling

---

#### Story 4.1.5: Test Template
**Priority**: P1  
**Points**: 3  
**As a**: Developer  
**I want**: Template for unit tests  
**So that**: Generated code has test coverage

**Acceptance Criteria**:
- [ ] Generates Jest test file
- [ ] Tests for each CRUD operation
- [ ] Tests for validation
- [ ] Tests for error cases
- [ ] Mocks database properly

**Tasks**:
- [ ] Create test.template.ts
- [ ] Generate test cases from schema
- [ ] Add validation tests
- [ ] Add error case tests
- [ ] Set up mocking

---

---

### Epic 4.2: Code Generation Engine
**Owner**: Backend Engineer  
**Sprint**: 5  
**Story Points**: 13

#### Story 4.2.1: Code Generator Service
**Priority**: P0  
**Points**: 5  
**As a**: Developer  
**I want**: Service that orchestrates code generation  
**So that**: All files are generated correctly

**Acceptance Criteria**:
- [ ] Accepts schema as input
- [ ] Selects correct templates
- [ ] Renders all templates
- [ ] Returns array of generated files
- [ ] Handles errors gracefully

**Tasks**:
- [ ] Create CodeGeneratorService class
- [ ] Implement template selection logic
- [ ] Implement rendering logic
- [ ] Organize output files
- [ ] Add error handling
- [ ] Write tests

---

#### Story 4.2.2: File Naming Conventions
**Priority**: P0  
**Points**: 2  
**As a**: Developer  
**I want**: Consistent file naming  
**So that**: Generated code is organized

**Acceptance Criteria**:
- [ ] Files named by convention (kebab-case)
- [ ] Organized in proper directories
- [ ] Entity name used correctly
- [ ] Extensions correct (.ts, .test.ts, etc.)

**Tasks**:
- [ ] Define naming convention
- [ ] Implement naming utility
- [ ] Generate file paths
- [ ] Test various component names

---

#### Story 4.2.3: Generate API Endpoint
**Priority**: P0  
**Points**: 3  
**As a**: User  
**I want**: Endpoint to generate code  
**So that**: I can download my project

**Acceptance Criteria**:
- [ ] POST /api/projects/:id/generate endpoint
- [ ] Generates all code for project
- [ ] Returns zip file with all files
- [ ] Includes package.json
- [ ] Includes README

**Tasks**:
- [ ] Create generate endpoint
- [ ] Fetch all components for project
- [ ] Generate code for each component
- [ ] Create zip file
- [ ] Add package.json and README
- [ ] Return zip file

---

#### Story 4.2.4: Preview Generated Code
**Priority**: P1  
**Points**: 3  
**As a**: User  
**I want**: To preview code before downloading  
**So that**: I can see what's generated

**Acceptance Criteria**:
- [ ] "Preview Code" button on component
- [ ] Modal shows generated files
- [ ] Syntax highlighting
- [ ] Can switch between files
- [ ] Can download from preview

**Tasks**:
- [ ] Create CodePreview modal
- [ ] Fetch generated code from API
- [ ] Add syntax highlighting (Prism.js)
- [ ] Add file switcher
- [ ] Add download button

---

---

## Feature 5: Manipulator (API) Component

**Goal**: Generate REST APIs for Elements

### Epic 5.1: Manipulator Creation
**Owner**: Full-Stack Engineer  
**Sprint**: 6  
**Story Points**: 21

#### Story 5.1.1: Manipulator Schema Definition
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: Schema for Manipulator component  
**So that**: I can generate APIs

**Acceptance Criteria**:
- [ ] Schema includes linked Element
- [ ] Specifies which operations (CRUD)
- [ ] Auth requirements per operation
- [ ] Validation rules
- [ ] Custom endpoints optional

**Tasks**:
- [ ] Design Manipulator schema structure
- [ ] Add to database schema
- [ ] Create migration
- [ ] Test CRUD

---

#### Story 5.1.2: Manipulator Creation Flow
**Priority**: P0  
**Points**: 5  
**As a**: User  
**I want**: To create API for my Element  
**So that**: It's accessible via HTTP

**Acceptance Criteria**:
- [ ] Drag Manipulator to canvas
- [ ] Modal asks which Element to connect
- [ ] Shows CRUD operation checkboxes (all checked by default)
- [ ] Auth dropdown (public/authenticated/admin)
- [ ] Generates and shows endpoint list

**Tasks**:
- [ ] Create ManipulatorModal component
- [ ] List available Elements
- [ ] Add operation checkboxes
- [ ] Add auth selector
- [ ] Generate endpoint preview
- [ ] Save configuration

---

#### Story 5.1.3: Auto-Connect to Element
**Priority**: P1  
**Points**: 2  
**As a**: User  
**I want**: Manipulator to auto-connect to Element  
**So that**: Relationship is visual

**Acceptance Criteria**:
- [ ] When Manipulator created, edge drawn to Element
- [ ] Edge is different color (indicates API relationship)
- [ ] Can't create Manipulator without Element
- [ ] Validation prevents orphaned Manipulators

**Tasks**:
- [ ] Detect selected Element
- [ ] Auto-create edge on Manipulator creation
- [ ] Style API edge differently
- [ ] Add validation

---

#### Story 5.1.4: Controller Template
**Priority**: P0  
**Points**: 5  
**As a**: Developer  
**I want**: Template for Express controller  
**So that**: API endpoints are generated

**Acceptance Criteria**:
- [ ] Generates Express router
- [ ] CRUD endpoints based on configuration
- [ ] Request validation middleware
- [ ] Auth middleware based on configuration
- [ ] Error handling
- [ ] Swagger comments

**Tasks**:
- [ ] Create controller.template.ts
- [ ] Generate routes based on config
- [ ] Add validation middleware
- [ ] Add auth middleware
- [ ] Add Swagger annotations
- [ ] Test template

---

#### Story 5.1.5: Swagger Documentation Generation
**Priority**: P1  
**Points**: 3  
**As a**: Developer  
**I want**: Swagger docs auto-generated  
**So that**: APIs are documented

**Acceptance Criteria**:
- [ ] Swagger spec generated for each API
- [ ] Includes all endpoints
- [ ] Request/response schemas defined
- [ ] Auth requirements documented
- [ ] Can view in Swagger UI

**Tasks**:
- [ ] Create swagger.template.yml
- [ ] Generate spec from schema
- [ ] Include request/response schemas
- [ ] Set up Swagger UI endpoint
- [ ] Test documentation

---

#### Story 5.1.6: Integration Test Template
**Priority**: P1  
**Points**: 3  
**As a**: Developer  
**I want**: Integration tests for APIs  
**So that**: Endpoints are tested

**Acceptance Criteria**:
- [ ] Generates Supertest tests
- [ ] Tests each CRUD endpoint
- [ ] Tests validation
- [ ] Tests auth requirements
- [ ] Tests error cases

**Tasks**:
- [ ] Create integration-test.template.ts
- [ ] Generate tests for each endpoint
- [ ] Add validation tests
- [ ] Add auth tests
- [ ] Test template output

---

---

## Feature 6: Testing System

**Goal**: Comprehensive test generation

### Epic 6.1: Test Generation
**Owner**: QA/Backend Engineer  
**Sprint**: 6-7  
**Story Points**: 13

#### Story 6.1.1: Jest Configuration
**Priority**: P0  
**Points**: 2  
**As a**: Developer  
**I want**: Jest configured for generated projects  
**So that**: Tests can run

**Acceptance Criteria**:
- [ ] jest.config.js generated
- [ ] TypeScript support configured
- [ ] Coverage thresholds set (80%)
- [ ] Test scripts in package.json
- [ ] Can run tests successfully

**Tasks**:
- [ ] Create jest.config.template.js
- [ ] Configure TypeScript support
- [ ] Set coverage thresholds
- [ ] Add test scripts
- [ ] Test configuration

---

#### Story 6.1.2: Test Factories
**Priority**: P1  
**Points**: 3  
**As a**: Developer  
**I want**: Factory functions for test data  
**So that**: Tests are easy to write

**Acceptance Criteria**:
- [ ] Factory generated for each Element
- [ ] Uses faker.js for realistic data
- [ ] Can override properties
- [ ] Can create multiple instances
- [ ] Follows schema constraints

**Tasks**:
- [ ] Create factory.template.ts
- [ ] Install faker.js
- [ ] Generate factory from schema
- [ ] Add override capability
- [ ] Test factories

---

#### Story 6.1.3: Run Tests UI
**Priority**: P1  
**Points**: 5  
**As a**: User  
**I want**: To run tests from UI  
**So that**: I can verify my system works

**Acceptance Criteria**:
- [ ] "Run Tests" button on component
- [ ] Shows test execution in real-time
- [ ] Displays passing/failing tests
- [ ] Shows coverage percentage
- [ ] Can view detailed results

**Tasks**:
- [ ] Create test execution endpoint
- [ ] Stream test results via WebSocket
- [ ] Create TestResults component
- [ ] Show real-time updates
- [ ] Display coverage

---

#### Story 6.1.4: Test Locking (Enforcer)
**Priority**: P2  
**Points**: 3  
**As a**: User  
**I want**: To lock tests in place  
**So that**: Behavior can't regress

**Acceptance Criteria**:
- [ ] "Lock" button on passing tests
- [ ] Locked tests stored with checksum
- [ ] Can't deploy if locked tests fail
- [ ] Visual indicator for locked tests
- [ ] Can unlock with confirmation

**Tasks**:
- [ ] Add lock functionality to UI
- [ ] Store locked test metadata
- [ ] Implement pre-deploy validation
- [ ] Add locked indicator
- [ ] Add unlock functionality

---

---

## Feature 7: GitHub Integration

**Goal**: Push generated code to GitHub

### Epic 7.1: GitHub Setup
**Owner**: DevOps/Backend Engineer  
**Sprint**: 7  
**Story Points**: 13

#### Story 7.1.1: GitHub OAuth App
**Priority**: P0  
**Points**: 3  
**As a**: User  
**I want**: To connect my GitHub account  
**So that**: Code can be pushed there

**Acceptance Criteria**:
- [ ] GitHub OAuth app created
- [ ] "Connect GitHub" button works
- [ ] OAuth flow completes successfully
- [ ] Access token stored securely
- [ ] Can disconnect and reconnect

**Tasks**:
- [ ] Create GitHub OAuth app
- [ ] Implement OAuth flow
- [ ] Store access token (encrypted)
- [ ] Create GitHub connection UI
- [ ] Test full flow

---

#### Story 7.1.2: Octokit Integration
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: GitHub API integrated  
**So that**: Repos can be created programmatically

**Acceptance Criteria**:
- [ ] Octokit installed
- [ ] Can create repositories
- [ ] Can commit files
- [ ] Can create branches
- [ ] Error handling for rate limits

**Tasks**:
- [ ] Install @octokit/rest
- [ ] Create GitHubService class
- [ ] Implement repo creation
- [ ] Implement file commits
- [ ] Add rate limit handling
- [ ] Write tests

---

#### Story 7.1.3: Create Repository
**Priority**: P0  
**Points**: 5  
**As a**: User  
**I want**: Project pushed to new GitHub repo  
**So that**: I own the code

**Acceptance Criteria**:
- [ ] "Push to GitHub" button
- [ ] Creates repo with project name
- [ ] Pushes all generated files
- [ ] Creates initial commit
- [ ] Shows repo URL after success

**Tasks**:
- [ ] Create push-to-github endpoint
- [ ] Generate all project files
- [ ] Create GitHub repository
- [ ] Commit files in batches
- [ ] Return repository URL
- [ ] Update UI with link

---

#### Story 7.1.4: Update Existing Repository
**Priority**: P1  
**Points**: 2  
**As a**: User  
**I want**: Changes pushed to existing repo  
**So that**: Project stays in sync

**Acceptance Criteria**:
- [ ] If repo exists, creates new branch
- [ ] Commits changes to branch
- [ ] Creates pull request
- [ ] Links PR in UI
- [ ] Can auto-merge if tests pass

**Tasks**:
- [ ] Check if repo exists
- [ ] Create branch for updates
- [ ] Commit changes
- [ ] Create pull request
- [ ] Add auto-merge option

---

---

## Feature 8: Deployment

**Goal**: One-click deployment to Railway

### Epic 8.1: Railway Integration
**Owner**: DevOps Engineer  
**Sprint**: 8  
**Story Points**: 13

#### Story 8.1.1: Railway API Integration
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: Railway API integrated  
**So that**: Projects can be deployed

**Acceptance Criteria**:
- [ ] Railway API token configured
- [ ] Can create projects
- [ ] Can deploy from GitHub
- [ ] Can set environment variables
- [ ] Can get deployment status

**Tasks**:
- [ ] Create Railway account
- [ ] Get API token
- [ ] Install Railway SDK/API client
- [ ] Create RailwayService class
- [ ] Test project creation
- [ ] Test deployment

---

#### Story 8.1.2: Dockerfile Generation
**Priority**: P0  
**Points**: 3  
**As a**: Developer  
**I want**: Dockerfile generated for project  
**So that**: It can be containerized

**Acceptance Criteria**:
- [ ] Multi-stage Dockerfile
- [ ] Node.js 20 base image
- [ ] Builds TypeScript
- [ ] Runs migrations
- [ ] Starts server
- [ ] Health check included

**Tasks**:
- [ ] Create dockerfile.template
- [ ] Add build stage
- [ ] Add production stage
- [ ] Add health check
- [ ] Test locally

---

#### Story 8.1.3: Deploy Button
**Priority**: P0  
**Points**: 5  
**As a**: User  
**I want**: One-click deploy button  
**So that**: My app goes live

**Acceptance Criteria**:
- [ ] "Deploy" button prominent in UI
- [ ] Pre-deploy validation (tests pass, etc.)
- [ ] Shows deployment progress
- [ ] Shows live URL when done
- [ ] Handles errors gracefully

**Tasks**:
- [ ] Create Deploy button and modal
- [ ] Implement pre-deploy checks
- [ ] Call deployment API
- [ ] Stream deployment logs
- [ ] Display live URL
- [ ] Handle deployment errors

---

#### Story 8.1.4: Environment Variables
**Priority**: P1  
**Points**: 2  
**As a**: User  
**I want**: To configure environment variables  
**So that**: My app has proper config

**Acceptance Criteria**:
- [ ] Can add env vars before deployment
- [ ] Required vars flagged (DATABASE_URL, etc.)
- [ ] Secure input for secrets
- [ ] Vars pushed to Railway
- [ ] Can update vars after deployment

**Tasks**:
- [ ] Create env var management UI
- [ ] Validate required vars
- [ ] Securely store secrets
- [ ] Push to Railway on deploy
- [ ] Allow post-deploy updates

---

---

## Feature 9: Tutorial System

**Goal**: Interactive onboarding for new users

### Epic 9.1: Tutorial Implementation
**Owner**: Frontend/UX Engineer  
**Sprint**: 8  
**Story Points**: 13

#### Story 9.1.1: Tutorial Framework
**Priority**: P1  
**Points**: 5  
**As a**: Developer  
**I want**: Tutorial framework (like Intro.js)  
**So that**: I can guide users

**Acceptance Criteria**:
- [ ] Tutorial library installed (react-joyride)
- [ ] Can highlight elements
- [ ] Can show tooltips
- [ ] Can sequence steps
- [ ] Can track progress
- [ ] Can skip tutorial

**Tasks**:
- [ ] Install react-joyride or similar
- [ ] Create Tutorial context/provider
- [ ] Design tooltip styling
- [ ] Implement step progression
- [ ] Add skip functionality
- [ ] Test tutorial flow

---

#### Story 9.1.2: Task Manager Tutorial Content
**Priority**: P1  
**Points**: 5  
**As a**: New User  
**I want**: Guided tutorial building task manager  
**So that**: I learn by doing

**Acceptance Criteria**:
- [ ] 10-step tutorial
- [ ] Creates Task element
- [ ] Adds API
- [ ] Deploys project
- [ ] Celebrates completion
- [ ] Takes < 10 minutes

**Tasks**:
- [ ] Write tutorial script
- [ ] Define 10 steps
- [ ] Create tutorial content
- [ ] Add celebration at end
- [ ] Test with real users
- [ ] Iterate based on feedback

---

#### Story 9.1.3: Tutorial Progress Tracking
**Priority**: P2  
**Points**: 3  
**As a**: User  
**I want**: Progress saved  
**So that**: I can continue later

**Acceptance Criteria**:
- [ ] Tutorial progress saved to database
- [ ] Can resume from where I left off
- [ ] Can restart tutorial
- [ ] Completion badge earned

**Tasks**:
- [ ] Store progress in database
- [ ] Load progress on mount
- [ ] Add resume functionality
- [ ] Add restart button
- [ ] Create completion badge

---

---

# PHASE 2: Enhancement (Sprints 9-16)

## Feature 10: Worker Component

**Goal**: Async job processing with queues

### Epic 10.1: Worker Implementation
**Owner**: Backend Engineer  
**Sprint**: 9-10  
**Story Points**: 21

#### Story 10.1.1: Redis + BullMQ Setup
**Priority**: P0  
**Points**: 5

**Acceptance Criteria**:
- [ ] Redis configured in generated projects
- [ ] BullMQ installed
- [ ] Queue creation works
- [ ] Worker can process jobs
- [ ] Dashboard for monitoring (Bull Board)

---

#### Story 10.1.2: Worker Schema Definition
**Priority**: P0  
**Points**: 3

**Acceptance Criteria**:
- [ ] Worker schema includes job definition
- [ ] Steps defined with helpers
- [ ] Retry strategy configurable
- [ ] Timeout settings

---

#### Story 10.1.3: Worker Code Generation
**Priority**: P0  
**Points**: 8

**Acceptance Criteria**:
- [ ] Generates queue setup
- [ ] Generates worker processor
- [ ] Generates job submission endpoint
- [ ] Includes retry logic
- [ ] Progress tracking

---

#### Story 10.1.4: Worker Tests
**Priority**: P1  
**Points**: 5

**Acceptance Criteria**:
- [ ] Job processing tests
- [ ] Retry tests
- [ ] Failure tests
- [ ] Timeout tests

---

---

## Feature 11: Helper Library

**Goal**: Pre-built integrations

### Epic 11.1: Core Helpers
**Owner**: Full-Stack Engineer  
**Sprint**: 10-11  
**Story Points**: 21

#### Story 11.1.1: Email Helper (SendGrid)
**Priority**: P1  
**Points**: 5

**Acceptance Criteria**:
- [ ] SendGrid integration template
- [ ] Send transactional email method
- [ ] Template support
- [ ] Error handling
- [ ] Tests

---

#### Story 11.1.2: Payment Helper (Stripe)
**Priority**: P1  
**Points**: 5

**Acceptance Criteria**:
- [ ] Stripe integration template
- [ ] Create payment intent
- [ ] Webhook handling
- [ ] Error handling
- [ ] Tests

---

#### Story 11.1.3: Storage Helper (Supabase)
**Priority**: P1  
**Points**: 5

**Acceptance Criteria**:
- [ ] File upload to Supabase Storage
- [ ] File download
- [ ] Delete files
- [ ] Get public URLs
- [ ] Tests

---

#### Story 11.1.4: Helper Marketplace UI
**Priority**: P2  
**Points**: 3

**Acceptance Criteria**:
- [ ] Browse available helpers
- [ ] One-click add to project
- [ ] Shows what each helper does
- [ ] Configuration wizard

---

#### Story 11.1.5: Custom Helper Creation
**Priority**: P2  
**Points**: 3

**Acceptance Criteria**:
- [ ] AI interprets helper description
- [ ] Generates helper scaffold
- [ ] User can add custom logic
- [ ] Tests generated

---

---

## Feature 12: Auditor Component

**Goal**: Validation and audit trails

### Epic 12.1: Auditor Implementation
**Owner**: Backend Engineer  
**Sprint**: 11-12  
**Story Points**: 13

#### Story 12.1.1: Auditor Schema
**Priority**: P1  
**Points**: 3

**Acceptance Criteria**:
- [ ] Validation rules defined
- [ ] Before/after hooks configured
- [ ] Audit log structure
- [ ] Retention policy

---

#### Story 12.1.2: Audit Log Template
**Priority**: P1  
**Points**: 5

**Acceptance Criteria**:
- [ ] Audit log table generated
- [ ] Before/after snapshots stored
- [ ] User tracking
- [ ] Timestamp
- [ ] Query API

---

#### Story 12.1.3: Validation Rule Engine
**Priority**: P1  
**Points**: 5

**Acceptance Criteria**:
- [ ] Validates before transitions
- [ ] Business rules enforced
- [ ] Custom validation functions
- [ ] Clear error messages
- [ ] Tests

---

---

## Feature 13: Workflow Component

**Goal**: Visual flow orchestration

### Epic 13.1: Workflow Builder
**Owner**: Full-Stack Engineer  
**Sprint**: 12-13  
**Story Points**: 21

#### Story 13.1.1: Workflow Canvas
**Priority**: P2  
**Points**: 8

**Acceptance Criteria**:
- [ ] Separate canvas for workflows
- [ ] Connect components in sequence
- [ ] Show data flow
- [ ] Error handling paths
- [ ] Conditional branches

---

#### Story 13.1.2: Workflow Code Generation
**Priority**: P2  
**Points**: 8

**Acceptance Criteria**:
- [ ] Orchestrator class generated
- [ ] Step-by-step execution
- [ ] Error handling
- [ ] Rollback on failure
- [ ] Tests

---

#### Story 13.1.3: Workflow Testing
**Priority**: P2  
**Points**: 5

**Acceptance Criteria**:
- [ ] Integration tests for workflows
- [ ] Tests happy path
- [ ] Tests error paths
- [ ] Tests rollbacks

---

---

## Feature 14: Advanced Features

### Epic 14.1: Relationships
**Owner**: Full-Stack Engineer  
**Sprint**: 13-14  
**Story Points**: 13

#### Story 14.1.1: Define Relationships
**Priority**: P1  
**Points**: 5

**Acceptance Criteria**:
- [ ] One-to-many relationships
- [ ] Many-to-many relationships
- [ ] Foreign key constraints
- [ ] Cascade deletes
- [ ] Visual on canvas

---

#### Story 14.1.2: Generate Relationship Code
**Priority**: P1  
**Points**: 5

**Acceptance Criteria**:
- [ ] Prisma relations defined
- [ ] TypeScript types include relations
- [ ] API endpoints for related data
- [ ] Tests

---

#### Story 14.1.3: Query Related Data
**Priority**: P1  
**Points**: 3

**Acceptance Criteria**:
- [ ] Include related data in queries
- [ ] Pagination for relations
- [ ] Filtering
- [ ] Sorting

---

---

### Epic 14.2: Authentication & Authorization
**Owner**: Backend Engineer  
**Sprint**: 14-15  
**Story Points**: 21

#### Story 14.2.1: Role-Based Access Control
**Priority**: P1  
**Points**: 8

**Acceptance Criteria**:
- [ ] Define roles (admin, user, etc.)
- [ ] Assign permissions per role
- [ ] Check permissions in APIs
- [ ] UI for role management

---

#### Story 14.2.2: Row-Level Security
**Priority**: P1  
**Points**: 8

**Acceptance Criteria**:
- [ ] Supabase RLS policies generated
- [ ] Users only see their data
- [ ] Multi-tenancy support
- [ ] Tests

---

#### Story 14.2.3: API Key Management
**Priority**: P2  
**Points**: 5

**Acceptance Criteria**:
- [ ] Generate API keys
- [ ] Rotate keys
- [ ] Revoke keys
- [ ] Track usage

---

---

### Epic 14.3: Search & Filtering
**Owner**: Backend Engineer  
**Sprint**: 15-16  
**Story Points**: 13

#### Story 14.3.1: Full-Text Search
**Priority**: P2  
**Points**: 5

**Acceptance Criteria**:
- [ ] PostgreSQL full-text search
- [ ] Search across multiple fields
- [ ] Ranking
- [ ] Highlighting

---

#### Story 14.3.2: Advanced Filtering
**Priority**: P2  
**Points**: 5

**Acceptance Criteria**:
- [ ] Filter by any field
- [ ] Combine filters (AND/OR)
- [ ] Range queries
- [ ] IN queries

---

#### Story 14.3.3: Sorting & Pagination
**Priority**: P1  
**Points**: 3

**Acceptance Criteria**:
- [ ] Sort by any field
- [ ] Ascending/descending
- [ ] Cursor-based pagination
- [ ] Page size control

---

---

## Feature 15: UX Polish

### Epic 15.1: User Experience Enhancements
**Owner**: Frontend/UX Engineer  
**Sprint**: 15-16  
**Story Points**: 21

#### Story 15.1.1: Keyboard Shortcuts
**Priority**: P2  
**Points**: 3

**Acceptance Criteria**:
- [ ] Cmd+N: New component
- [ ] Cmd+S: Save
- [ ] Cmd+Z/Y: Undo/redo
- [ ] Delete: Delete selected
- [ ] Cmd+G: Generate code
- [ ] Help menu lists all shortcuts

---

#### Story 15.1.2: Component Templates
**Priority**: P2  
**Points**: 5

**Acceptance Criteria**:
- [ ] Template gallery
- [ ] E-commerce template
- [ ] Blog template
- [ ] Task manager template
- [ ] One-click create from template

---

#### Story 15.1.3: AI Assistant Panel
**Priority**: P2  
**Points**: 8

**Acceptance Criteria**:
- [ ] Chat interface
- [ ] Ask questions about system
- [ ] Get suggestions
- [ ] Contextual help
- [ ] Learns from usage

---

#### Story 15.1.4: Dark Mode
**Priority**: P3  
**Points**: 3

**Acceptance Criteria**:
- [ ] Toggle dark/light mode
- [ ] Preference saved
- [ ] All components styled for both
- [ ] Smooth transition

---

#### Story 15.1.5: Collaborative Editing
**Priority**: P3  
**Points**: 5

**Acceptance Criteria**:
- [ ] Real-time cursor tracking
- [ ] See who's online
- [ ] Changes sync instantly
- [ ] Conflict resolution

---

---

# Sprint Breakdown Summary

## Sprint 1 (Weeks 1-2): Foundation
- [ ] Frontend setup
- [ ] Backend setup
- [ ] Database setup
- [ ] CI/CD pipeline
- [ ] Auth system (Supabase)

**Goal**: Can sign up, log in, and see empty dashboard

---

## Sprint 2 (Weeks 3-4): Projects & Canvas
- [ ] Project CRUD
- [ ] Dashboard UI
- [ ] React Flow canvas
- [ ] Drag and drop components
- [ ] Canvas persistence

**Goal**: Can create project and add components to canvas

---

## Sprint 3 (Weeks 5-6): AI Integration
- [ ] OpenAI setup
- [ ] Element schema generation
- [ ] Loading states
- [ ] Schema review UI
- [ ] Undo/redo

**Goal**: AI generates Element schema from description

---

## Sprint 4 (Weeks 7-8): Code Generation
- [ ] Template system
- [ ] Prisma schema template
- [ ] TypeScript entity template
- [ ] Service layer template
- [ ] Code preview

**Goal**: Can generate and preview code for Element

---

## Sprint 5 (Weeks 9-10): API Generation
- [ ] Manipulator component
- [ ] Controller template
- [ ] Swagger docs
- [ ] Integration tests
- [ ] Code download

**Goal**: Can generate full REST API with docs

---

## Sprint 6 (Weeks 11-12): Testing
- [ ] Jest configuration
- [ ] Test generation
- [ ] Run tests UI
- [ ] Test locking
- [ ] Coverage reporting

**Goal**: Generated code has comprehensive tests

---

## Sprint 7 (Weeks 13-14): GitHub
- [ ] GitHub OAuth
- [ ] Octokit integration
- [ ] Create repository
- [ ] Push code
- [ ] Pull requests

**Goal**: Code pushed to user's GitHub

---

## Sprint 8 (Weeks 15-16): Deployment & Polish
- [ ] Railway integration
- [ ] Dockerfile generation
- [ ] Deploy button
- [ ] Tutorial system
- [ ] Bug fixes

**Goal**: One-click deploy to Railway - **MVP COMPLETE!** 🎉

---

# Definition of Done

## For User Stories:
- [ ] Code written and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (if applicable)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner approval

## For Epics:
- [ ] All stories complete
- [ ] End-to-end testing completed
- [ ] Performance testing passed
- [ ] Security review passed
- [ ] Demo to stakeholders

## For Features:
- [ ] All epics complete
- [ ] User acceptance testing passed
- [ ] Documentation complete
- [ ] Deployed to production
- [ ] Metrics/analytics tracking

---

# Risk & Dependencies

## Critical Path:
1. **Foundation** → Everything depends on this
2. **Canvas** → Must work before AI generation
3. **AI Integration** → Core value proposition
4. **Code Generation** → Differentiator
5. **Deployment** → Completes the loop

## Risks:

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenAI API changes | High | Low | Abstract API layer, have fallback |
| AI quality inconsistent | High | Medium | Extensive prompt engineering, validation |
| Railway pricing changes | Medium | Low | Support multiple deploy targets |
| Team velocity lower than estimated | High | Medium | Cut scope to P0 only for MVP |
| GitHub rate limits | Medium | Medium | Batch operations, queue |

---

# Metrics to Track

## Development Metrics:
- Velocity (story points per sprint)
- Bug count
- Test coverage
- Code review time
- Deployment frequency

## Product Metrics:
- User signups
- Projects created
- Projects deployed
- Time to first deploy
- Feature usage
- User retention (D1, D7, D30)
- NPS score

## Technical Metrics:
- API latency (P95, P99)
- Error rate
- Uptime
- AI generation success rate
- Test pass rate

---

# Team Composition

**Minimum Team (5 people)**:
- 1 Tech Lead / Full-Stack (overall architecture)
- 2 Frontend Engineers (Canvas, UI/UX)
- 1 Backend Engineer (AI, code generation)
- 1 DevOps/Backend Engineer (deployment, infra)

**Optimal Team (8 people)**:
- Add: 1 more Frontend, 1 more Backend, 1 Product Designer

**Part-Time**:
- Product Manager (20%)
- UX Designer (50%)
- QA Engineer (50%)

---

# Tools & Setup

## Project Management:
- **Tool**: Linear or Jira
- **Sprints**: 2 weeks
- **Ceremonies**: 
  - Daily standup (15 min)
  - Sprint planning (2 hours)
  - Sprint review (1 hour)
  - Sprint retro (1 hour)

## Development:
- **Repo**: GitHub (monorepo with frontend + backend)
- **CI/CD**: GitHub Actions
- **Staging**: Railway
- **Production**: Railway
- **Monitoring**: Sentry, Railway metrics

## Communication:
- **Async**: Slack
- **Sync**: Google Meet
- **Docs**: Notion or Confluence
- **Design**: Figma

---

# Success Criteria for MVP

By end of Sprint 8 (Week 16), we should have:

✅ **Working Product**:
- Users can sign up and log in
- Create projects with visual canvas
- Add Element and Manipulator components
- AI generates schemas from descriptions
- Code generated (Prisma, TypeScript, API)
- Code pushed to GitHub
- One-click deploy to Railway
- Generated app actually works in production

✅ **Quality**:
- 80%+ test coverage on generated code
- Zero critical security vulnerabilities
- < 100ms P99 API latency
- 99%+ uptime

✅ **User Experience**:
- Interactive tutorial
- < 30 minutes to first deploy
- Clear error messages
- Beautiful UI

✅ **Metrics**:
- 100+ beta users
- 50+ deployed projects
- NPS > 50

---

**This is the plan. Let's build it!** 🚀

