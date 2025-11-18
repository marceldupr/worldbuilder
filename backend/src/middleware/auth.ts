import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../utils/prisma.js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Ensure user exists in our database
 * Syncs from Supabase auth.users to our public.users table
 */
async function ensureUserExists(userId: string, email?: string) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      // Create user in our database
      console.log('[Auth] Creating user in database:', email);
      await prisma.user.create({
        data: {
          id: userId,
          email: email || '',
        },
      });
      console.log('[Auth] ✅ User synced to database');
    }
  } catch (error: any) {
    // Ignore unique constraint errors (race condition)
    if (error.code !== 'P2002') {
      console.error('[Auth] Error syncing user:', error);
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    console.log('[Auth] Request to:', req.method, req.path);
    console.log('[Auth] Headers:', authHeader ? 'Bearer token present' : 'No auth header');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] ❌ Missing or invalid authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    console.log('[Auth] Token:', token.substring(0, 20) + '...');

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('[Auth] ❌ Token validation failed:', error?.message || 'No user found');
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        details: error?.message 
      });
    }

    console.log('[Auth] ✅ User authenticated:', user.email);
    
    // Ensure user exists in our database (sync from auth.users)
    await ensureUserExists(user.id, user.email);
    
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('[Auth] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

