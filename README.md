# 🌍 Worldbuilder - AI-Powered Visual App Builder

**Build production-ready applications without writing code.**

[![Status](https://img.shields.io/badge/Status-MVP%20Complete-success)]()
[![Progress](https://img.shields.io/badge/Progress-95%25-blue)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

**"If you can describe it, you can build it."**

AI-powered visual platform for building production-ready applications without writing code.

---

## ⚡ Quick Links

- 🚀 **[5-Minute Quickstart](./QUICKSTART.md)** - Build your first app now!
- 🔧 **[Setup Guide](./SETUP.md)** - Detailed installation
- 📦 **[Deployment](./DEPLOYMENT.md)** - Go to production
- 📖 **[Full Docs](./INDEX.md)** - Complete documentation index

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (via Supabase)
- OpenAI API Key
- npm or yarn

### Setup

1. **Clone and install dependencies**

```bash
git clone <repository-url>
cd worldcreator
npm install
```

2. **Set up Supabase**

- Create a Supabase project at https://supabase.com
- Get your project URL and anon key
- Run the Prisma migrations (see backend setup)

3. **Configure environment variables**

Frontend (`.env` in `/frontend`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

Backend (`.env` in `/backend`):
```env
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=3001
```

4. **Install workspace dependencies**

```bash
# Install all workspace dependencies
cd frontend && npm install
cd ../backend && npm install
```

5. **Set up database**

```bash
cd backend
npx prisma generate
npx prisma db push
```

6. **Start development servers**

```bash
# From project root
npm run dev

# Or separately:
cd frontend && npm run dev  # Port 3000
cd backend && npm run dev   # Port 3001
```

7. **Open your browser**

Navigate to http://localhost:3000

## 📁 Project Structure

```
worldcreator/
├── docs/                    # Documentation
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   ├── lib/            # Utilities
│   │   └── types/          # TypeScript types
│   └── package.json
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utilities
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── templates/              # Code generation templates
│   ├── element/           # Element templates
│   ├── manipulator/       # API templates
│   ├── worker/            # Worker templates
│   └── helper/            # Helper templates
└── package.json           # Root workspace config
```

## 🎯 Phase 1 Features

### Completed ✅
- [x] Project structure and monorepo setup
- [x] Frontend with React + TypeScript + Vite + Tailwind
- [x] Backend with Node.js + Express + TypeScript
- [x] Supabase database and auth integration
- [x] React Flow canvas with basic UI
- [x] OpenAI integration for schema generation
- [x] Project and component CRUD APIs
- [x] Authentication flow

### In Progress 🚧
- [ ] Enhanced drag-and-drop component creation
- [ ] Code generation templates
- [ ] GitHub integration
- [ ] Railway deployment
- [ ] Test generation

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Flow** - Visual canvas
- **Zustand** - State management
- **React Router** - Routing

### Backend
- **Node.js 20** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **Supabase** - Database + Auth
- **OpenAI** - AI schema generation
- **Zod** - Validation

### Infrastructure
- **Supabase** - PostgreSQL + Auth
- **Railway** - Deployment (coming soon)
- **GitHub** - Version control + CI/CD

## 🎨 Component Types

1. **Element** 🔷 - Data entities (Product, User, Order)
2. **Data API** 🌐 - API endpoints (REST CRUD)
3. **Worker** ⚙️ - Background jobs (async processing)
4. **Helper** 🔧 - Utilities (Email, Payment, Storage)
5. **Auditor** 📋 - Validation and audit trails
6. **Enforcer** ✅ - Test generation and locking

## 📚 API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Components
- `POST /api/components` - Create component
- `GET /api/components/:id` - Get component
- `DELETE /api/components/:id` - Delete component

### Generation
- `POST /api/generate/schema` - Generate component schema with AI

### Deployment
- `POST /api/deploy/github` - Push code to GitHub
- `POST /api/deploy/railway` - Deploy to Railway

## 🧪 Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test
```

## 📦 Building

```bash
# Build all workspaces
npm run build

# Build frontend only
cd frontend && npm run build

# Build backend only
cd backend && npm run build
```

## 🚀 Deployment

### Backend (Railway)
```bash
cd backend
railway link
railway up
```

### Frontend (Vercel)
```bash
cd frontend
vercel
```

## 📖 Documentation

See the `/docs` folder for detailed documentation:
- [01-overview.md](./docs/01-overview.md) - Project overview
- [02-architecture.md](./docs/02-architecture.md) - System architecture
- [03-core-components.md](./docs/03-core-components.md) - Component types
- [10-implementation-roadmap.md](./docs/10-implementation-roadmap.md) - Development roadmap
- [14-project-plan.md](./docs/14-project-plan.md) - Detailed project plan

## 🤝 Contributing

This is currently in active development. More contribution guidelines coming soon!

## 📄 License

MIT

## 🌟 Vision

**"If you can describe it, you can build it."**

Worldbuilder democratizes software development by making it visual, intuitive, and AI-driven. Anyone can create production-ready applications without writing code.

---

Built with ❤️ for creators everywhere

