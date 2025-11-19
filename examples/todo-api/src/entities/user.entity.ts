import { z } from 'zod';

/**
 * User Entity
 * 
 */

// Zod Schema for validation
export const UserSchema = z.object({
  username: z.string().minLength: 3,maxLength: 20,unique,
  email: z.string().pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,unique,
  password: z.string().minLength: 6,
  createdAt: z.date().default: current_datetime,
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserSchema = CreateUserSchema.partial();

// TypeScript Types
export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

