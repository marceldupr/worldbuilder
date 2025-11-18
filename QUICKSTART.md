# 🚀 Worldbuilder - 5-Minute Quickstart

## Let's Build Your First App!

This guide will walk you through building a complete **Task Manager** application in under 5 minutes.

---

## Step 1: Install & Run (2 minutes)

```bash
# Navigate to project
cd /Users/marceldupreez/Code/mandeville/worldcreator

# Set up Node.js
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node | tail -1)/bin:$PATH"

# Install dependencies
cd frontend && npm install
cd ../backend && npm install
cd ..

# Set up environment (create these files):
# backend/.env:
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:3000
PORT=3001

# frontend/.env:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001

# Initialize database
cd backend && npx prisma generate && npx prisma db push

# Start both servers
cd .. && npm run dev
```

Open http://localhost:3000 🎉

---

## Step 2: Create Account (15 seconds)

1. Click **"Sign up"**
2. Enter email & password
3. Click **"Sign up"**
4. You're in!

---

## Step 3: Create Project (10 seconds)

1. Click **"+ New Project"**
2. Name: **"Task Manager"**
3. Description: **"Manage tasks and todos"**
4. Click **"Create"**

---

## Step 4: Add Task Element (45 seconds)

1. **Drag "Element 🔷"** from sidebar to canvas
2. **Name:** `Task`
3. **Description:** 
   ```
   A Task with title (required), description, 
   status (pending, in-progress, completed), 
   priority (low, medium, high), 
   and due date. Status defaults to pending.
   ```
4. Click **"Generate with AI ✨"**
5. Wait 5-10 seconds for AI...
6. **Review schema** - See all properties generated!
7. Click **"Save Component ✓"**
8. **Task appears on canvas!** 🎉

---

## Step 5: Add Task API (30 seconds)

1. **Drag "Manipulator 🌐"** to canvas
2. **Select Element:** Task
3. **Operations:** 
   - ✓ Create (Authenticated)
   - ✓ Read (Public)
   - ✓ Update (Authenticated)
   - ✓ Delete (Authenticated)
4. See **5 endpoints** preview:
   ```
   POST   /task
   GET    /task
   GET    /task/:id
   PATCH  /task/:id
   DELETE /task/:id
   ```
5. Click **"Create API ✓"**

---

## Step 6: Add Email Helper (20 seconds)

1. **Drag "Helper 🔧"** to canvas
2. Select **"Email Helper"** template
3. Review SendGrid configuration
4. Click **"Create Helper ✓"**

---

## Step 7: Add Notification Worker (45 seconds)

1. **Drag "Worker ⚙️"** to canvas
2. **Name:** `Task Notification Worker`
3. **Queue:** `notifications`
4. **Steps:**
   - Step 1: Check task status
   - Step 2: Send email (link to Email Helper)
5. Click **"Create Worker ✓"**

---

## Step 8: Generate Code (15 seconds)

1. Click **"💻 Generate Code"** button
2. Browse generated files:
   - `prisma/schema.prisma` - Database model
   - `src/entities/task.entity.ts` - TypeScript types
   - `src/services/task.service.ts` - CRUD logic
   - `src/controllers/task.controller.ts` - REST API
   - `src/workers/task-notification.worker.ts` - Background job
   - `src/helpers/email.helper.ts` - Email integration
   - `package.json` - All dependencies
   - `Dockerfile` - Production ready!
3. **Scroll through** - See all the code!

---

## Step 9: Download (5 seconds)

1. Click **"⬇️ Download ZIP"**
2. Save to your computer
3. Extract the ZIP file

---

## Step 10: Push to GitHub (30 seconds)

1. Click **"🐙 Push to GitHub"**
2. **Repo name:** `task-manager-api`
3. **GitHub Token:** Get from https://github.com/settings/tokens/new?scopes=repo
4. Click **"🚀 Push to GitHub"**
5. **Repository opens automatically!**

---

## Step 11: Run Locally (90 seconds)

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/task-manager-api.git
cd task-manager-api

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start server
npm run dev
```

**Server running on http://localhost:3001** 🎉

---

## Step 12: Test Your API (30 seconds)

```bash
# Health check
curl http://localhost:3001/health

# Create a task
curl -X POST http://localhost:3001/task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My first task",
    "description": "Built with Worldbuilder!",
    "priority": "high"
  }'

# Get all tasks
curl http://localhost:3001/task

# View Swagger docs
open http://localhost:3001/api-docs
```

**Working REST API!** ✨

---

## 🎉 Congratulations!

You just built and deployed a production-ready Task Manager API with:
- ✅ Database (PostgreSQL + Prisma)
- ✅ REST API with 5 endpoints
- ✅ Background job processing
- ✅ Email notifications
- ✅ TypeScript types
- ✅ Swagger documentation
- ✅ Docker configuration
- ✅ Error handling
- ✅ Validation

**Total Time: ~5 minutes** ⏱️

---

## 🚀 What's Next?

### **Add More Features:**
1. **User Authentication** - Add User element
2. **File Uploads** - Add Storage Helper
3. **Payments** - Add Payment Helper
4. **More Entities** - Projects, Tags, Comments

### **Deploy to Production:**
1. Set up Supabase (database)
2. Set up Redis (for workers)
3. Deploy to Railway (coming soon in Worldbuilder!)
4. Add your domain

### **Customize:**
- Clone the repo
- Modify the code
- Add custom logic
- Deploy anywhere

---

## 💡 Try These Next

### **Blog Platform:**
1. Post Element (title, content, author, publishedAt)
2. Post API (CRUD)
3. Storage Helper (images)
4. Email Helper (notifications)

### **E-Commerce:**
1. Product Element (name, price, inventory)
2. Order Element (items, total, status)
3. Product API & Order API
4. Payment Helper (Stripe)
5. Email Helper (receipts)
6. Order Processing Worker

### **Social Network:**
1. User Element
2. Post Element
3. Comment Element
4. Follow/Like relationships
5. Content API
6. Notification Worker

---

## 🎓 Component Cheat Sheet

### **Element 🔷**
**When:** You need data (Product, User, Order)
**Example:** "Product with name, price, and inventory"

### **Manipulator 🌐**
**When:** You need a REST API
**Example:** Select Product, enable CRUD operations

### **Worker ⚙️**
**When:** You need background processing
**Example:** Order processing, email campaigns, reports

### **Helper 🔧**
**When:** You need integrations
**Options:** Email, Payment, SMS, Storage, Custom

### **Auditor 📋** (Coming soon)
**When:** You need validation & audit trails

### **Enforcer ✅** (Coming soon)
**When:** You need test generation & locking

---

## 📚 More Resources

- **Full Setup:** See [SETUP.md](./SETUP.md)
- **Documentation:** Browse `/docs` folder
- **Status:** Check [FINAL_STATUS.md](./FINAL_STATUS.md)
- **Architecture:** Read [docs/02-architecture.md](./docs/02-architecture.md)

---

## 🆘 Troubleshooting

### **"Port already in use"**
```bash
lsof -ti:3000 | xargs kill -9  # Kill frontend
lsof -ti:3001 | xargs kill -9  # Kill backend
```

### **"Prisma client not found"**
```bash
cd backend && npx prisma generate
```

### **"CORS error"**
Check that `FRONTEND_URL` in backend `.env` matches frontend URL

### **"OpenAI API error"**
- Verify API key is valid
- Check you have credits
- Try GPT-3.5-turbo if rate limited

---

## 🎊 You're Ready!

**Start building amazing applications visually!**

No code required. Just describe, drag, drop, and deploy.

**Welcome to the future of software development!** 🌍✨


