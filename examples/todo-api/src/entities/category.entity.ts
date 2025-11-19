import { z } from 'zod';

/**
 * Category Entity
 * 
 */

// Zod Schema for validation
export const CategorySchema = z.object({
  name: z.string().maxLength: 100,
  description: z.string().optional().maxLength: 255,
  createdAt: z.date().default: now,
  updatedAt: z.date().default: now,
});

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// TypeScript Types
export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

