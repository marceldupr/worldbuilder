# 🔧 Supabase Connection Issues - Troubleshooting Guide

## Problem: Can't connect to Supabase database

### **🔥 MOST COMMON ISSUE: Using Wrong Connection Mode**

**THE FIX:** Use **"Session"** mode (NOT "Direct" mode)

**Why:** Direct mode uses IPv6 which most local development environments don't support. Session mode uses IPv4 and works everywhere.

### **Quick Fix (Try This First):**

1. **Check your Supabase project is active:**
   - Go to https://app.supabase.com
   - Make sure your project shows "Active" status (green)
   - If paused, click "Restore" or "Resume"

2. **Get the correct connection string:**

   **✅ CORRECT: Session Mode (IPv4 - Works Everywhere)**
   ```
   Project Settings → Database → Connection string → URI
   Select: "Session mode"
   Port will be: 5432
   
   Use exactly as shown:
   postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```

   **❌ WRONG: Direct Mode (IPv6 Only - Will Fail)**
   ```
   Shows: aws-0-us-east-1.pooler.supabase.com
   This is IPv6 only and won't work on most systems!
   ```

   **❌ WRONG: Transaction Mode (Pooler - Fails with Prisma)**
   ```
   Port: 6543
   This is a connection pooler and doesn't work with Prisma migrations
   ```

3. **Test the connection:**
   ```bash
   cd backend
   npx prisma db push
   ```

---

## Common Issues & Solutions

### **Issue 1: Port 6543 vs 5432**

**Problem:** Connection string has port 6543 but connection fails

**Solution:**
- Port 6543 = Connection pooler (Transaction mode)
- Port 5432 = Direct connection (Session mode)
- For Prisma `db push`, try **Session mode (5432)** first

**Change in your .env:**
```bash
# From (Transaction/Pooler):
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:6543/postgres

# To (Session/Direct):
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
```

### **Issue 2: SSL Required**

**Problem:** "SSL required" error

**Solution:** Add SSL mode parameter

```bash
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?sslmode=require"
```

### **Issue 3: Connection Pooler with Prisma**

**Problem:** Using pooler (6543) with Prisma

**Solution:** Add pgbouncer parameter

```bash
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
```

### **Issue 4: Project Paused**

**Problem:** Supabase auto-pauses inactive projects

**Solution:**
1. Go to Supabase dashboard
2. Look for "Project Paused" banner
3. Click "Restore Project"
4. Wait 30-60 seconds
5. Try connection again

### **Issue 5: IP Not Whitelisted**

**Problem:** Connection blocked by firewall

**Solution:**
1. Go to **Project Settings** → **Database**
2. Scroll to **"Network Restrictions"**
3. Either:
   - Disable IP restrictions (for development)
   - Or add your IP to allowlist

### **Issue 6: Wrong Password**

**Problem:** Password contains special characters

**Solution:**
- URL-encode special characters in password
- Or use simpler password without special chars
- Common issue with `@`, `#`, `$`, etc.

**Example:**
```
Password: Pass@123
Encoded:  Pass%40123
```

---

## 🔍 Diagnostic Commands

### **1. Test if Supabase is reachable:**
```bash
curl -I https://your-project-ref.supabase.co
# Should return 200 OK
```

### **2. Test database connection:**
```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

### **3. Check Prisma can parse the URL:**
```bash
cd backend
npx prisma validate
```

### **4. View current .env:**
```bash
cd backend
cat .env | grep DATABASE_URL
```

---

## 📝 Step-by-Step Fix

### **1. Go to Supabase Dashboard**
Visit: https://app.supabase.com

### **2. Select Your Project**
Click on your project

### **3. Get Connection String**
- Click **Settings** (gear icon in sidebar)
- Click **Database**
- Scroll to **Connection string**
- Copy the **URI** (not the other formats)

### **4. Choose the Right Mode**

**For Prisma migrations (`db push`, `migrate`):**
Use **"Session mode"** - Direct connection

**Steps:**
- In connection string section, click dropdown
- Select **"Session mode"**
- Port will show **5432**
- Copy the string
- Replace `[YOUR-PASSWORD]` with your actual password

**Format:**
```
postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

### **5. Update Your .env File**
```bash
cd backend
nano .env  # or open in your editor
```

Paste:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

Note: Remove `?sslmode=require` if it causes issues (Supabase has SSL by default)

### **6. Test Connection**
```bash
npx prisma db push
```

Should see:
```
✔ Prisma schema loaded
✔ Datasource "db": PostgreSQL database
✔ Database synchronized with Prisma schema
```

---

## 🆘 Still Not Working?

### **Alternative: Use Supabase's Web SQL Editor**

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Paste the schema manually:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  canvas_data JSONB,
  github_repo TEXT,
  deployment_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create components table
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  position JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_components_project_id ON components(project_id);
```

4. Click **"Run"**
5. Tables created manually!
6. Skip `prisma db push` and just run:
   ```bash
   npx prisma generate
   ```

---

## ✅ Working Configuration Examples

### **Example 1: Session Mode (Direct)**
```env
DATABASE_URL="postgresql://postgres:MyPass123@db.abcdefgh.supabase.co:5432/postgres"
```

### **Example 2: Transaction Mode (Pooler)**
```env
DATABASE_URL="postgresql://postgres:MyPass123@db.abcdefgh.supabase.co:6543/postgres?pgbouncer=true"
```

### **Example 3: With SSL**
```env
DATABASE_URL="postgresql://postgres:MyPass123@db.abcdefgh.supabase.co:5432/postgres?sslmode=require"
```

---

## 📞 Need More Help?

1. **Check Supabase Status:** https://status.supabase.com
2. **Supabase Docs:** https://supabase.com/docs/guides/database/connecting-to-postgres
3. **Prisma + Supabase Guide:** https://www.prisma.io/docs/guides/database/supabase

---

**Most common solution:** Use **Session mode** with **port 5432** and **no extra parameters**:
```
postgresql://postgres:YOUR_PASSWORD@db.PROJECT.supabase.co:5432/postgres
```

Good luck! 🚀

