-- Disable Row Level Security for Worldbuilder tables
-- Since we're using Prisma with our own auth middleware, we don't need Supabase RLS

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE components DISABLE ROW LEVEL SECURITY;

-- Optional: If you want to use RLS instead, create policies:
-- CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);
-- etc.

