import { z } from 'zod';

/**
 * Tag Entity
 * 
 */

// Zod Schema for validation
export const TagSchema = z.object({
  id: z.string().uuid().unique,
  name: z.string().minLength:1,maxLength:50,
  color: z.string().optional(),
});

export const CreateTagSchema = TagSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateTagSchema = CreateTagSchema.partial();

// TypeScript Types
export type Tag = z.infer<typeof TagSchema>;
export type CreateTagDto = z.infer<typeof CreateTagSchema>;
export type UpdateTagDto = z.infer<typeof UpdateTagSchema>;

