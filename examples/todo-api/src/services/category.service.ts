import { PrismaClient } from '@prisma/client';
import type { CreateCategoryDto, UpdateCategoryDto } from './category.entity';

const prisma = new PrismaClient();

/**
 * Category Service
 * 
 */

export class CategoryService {
  /**
   * Create a new Category
   */
  async create(data: CreateCategoryDto) {
    return await prisma.category.create({
      data,
    });
  }

  /**
   * Find Category by ID
   */
  async findById(id: string, include?: any) {
    return await prisma.category.findUnique({
      where: { id },
      ...(include && { include }),
    });
  }

  /**
   * Find all Categories
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: any;
    where?: any;
    include?: any;
  }) {
    const { include, ...prismaOptions } = options || {};
    return await prisma.category.findMany({
      ...prismaOptions,
      ...(include && { include }),
    });
  }

  /**
   * Update Category
   */
  async update(id: string, data: UpdateCategoryDto) {
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete Category
   */
  async delete(id: string) {
    return await prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Count Categories
   */
  async count(where?: any) {
    return await prisma.category.count({ where });
  }

}

// Export singleton instance
export const categoryService = new CategoryService();

