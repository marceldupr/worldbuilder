# Frontend Templates

This directory contains Handlebars templates for generating React frontend code.

## Structure

```
frontend/
├── pages/           # Page components (List, Detail, Create, Edit)
├── components/      # Reusable components (Forms, Tables, etc.)
├── layouts/         # App layout with navigation
├── auth/           # Authentication components
├── api/            # TypeScript API client
├── dashboard/      # Dashboard with stats
└── shared/         # Shared utilities, types, theme
```

## Template Context

Templates receive:
- `project`: Project metadata (name, description)
- `elements`: Array of Element components
- `manipulators`: Array of API components
- `element`: Individual element schema (for element-specific templates)

## Generated Stack

- **UI Library:** Material-UI (MUI)
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router v6
- **State:** React Query for API state
- **API Client:** Type-safe Axios wrapper
- **Authentication:** JWT with Supabase Auth (optional)

## Usage

Templates are compiled by the `FrontendGeneratorService` and included in the generated project under the `frontend/` directory.

