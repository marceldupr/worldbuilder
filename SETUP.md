# Worldbuilder Setup Guide

## Step-by-Step Setup Instructions

### 1. Prerequisites

Make sure you have the following installed:
- Node.js 20+ (use nvm: `nvm install 20 && nvm use 20`)
- PostgreSQL access via Supabase
- Git
- A code editor (VS Code recommended)

### 2. Clone and Install

```bash
# Navigate to the project
cd /Users/marceldupreez/Code/mandeville/worldcreator

# Install root dependencies
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | tail -1)/bin:$PATH"
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Wait for the project to be provisioned (takes 2-3 minutes)
3. Once ready, go to Project Settings > API
4. Copy the following:
   - Project URL
   - anon/public key
   - Go to Database Settings > Connection String > URI and copy the connection string

### 4. Configure Environment Variables

**Frontend** - Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:3001
```

**Backend** - Create `backend/.env`:
```env
# Database (from Supabase Connection String, use "Transaction" mode)
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-key-here

# App Config
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=3001
```

### 5. Initialize the Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Or from the root directory:
```bash
npm run dev  # Starts both concurrently
```

### 7. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 8. Create Your First Account

1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter your email and password
4. Check your email for verification (if email is configured in Supabase)
5. You'll be redirected to the dashboard

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Prisma Client Errors

If you see "PrismaClient is unable to run in the browser":
```bash
cd backend
npx prisma generate
```

### CORS Errors

Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL.

### Supabase Connection Errors

1. Check your DATABASE_URL is correct
2. Make sure you're using the "Transaction" mode connection string (not "Session" mode)
3. Verify your IP is allowed in Supabase (Settings > Database > Connection Pooling)

### OpenAI API Errors

1. Verify your API key is valid at https://platform.openai.com/api-keys
2. Make sure you have credits available
3. Check rate limits if you see 429 errors

## Next Steps

Once everything is running:

1. **Create a Project**: Click "New Project" on the dashboard
2. **Add Components**: Drag Element or Manipulator components to the canvas
3. **Generate Schema**: Describe your component and let AI generate the schema
4. **Generate Code**: Click "Generate Code" to see the output
5. **Deploy**: (Coming soon) Push to GitHub and deploy to Railway

## Development Tips

### Database Management

```bash
# View database in browser
cd backend && npx prisma studio

# Create a migration (after schema changes)
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Code Generation

Code generation templates are in `/templates`:
- `element/` - For Element components
- `manipulator/` - For API components
- `worker/` - For background job components

### Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test
```

## Architecture Overview

```
┌──────────────┐     HTTP/REST      ┌──────────────┐
│   Frontend   │ ←─────────────────→ │   Backend    │
│  React App   │                     │  Express API │
│  Port 3000   │                     │  Port 3001   │
└──────────────┘                     └──────────────┘
                                              ↓
                                     ┌──────────────┐
                                     │   Supabase   │
                                     │  PostgreSQL  │
                                     │     Auth     │
                                     └──────────────┘
                                              ↓
                                     ┌──────────────┐
                                     │   OpenAI     │
                                     │     API      │
                                     └──────────────┘
```

## Need Help?

- Check the main [README.md](./README.md)
- Review the [docs/](./docs/) folder for detailed documentation
- Open an issue on GitHub

---

Happy building! 🚀

