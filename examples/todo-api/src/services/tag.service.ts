import { PrismaClient } from '@prisma/client';
import type { CreateTagDto, UpdateTagDto } from './tag.entity';

const prisma = new PrismaClient();

/**
 * Tag Service
 * 
 */

export class TagService {
  /**
   * Create a new Tag
   */
  async create(data: CreateTagDto) {
    return await prisma.tag.create({
      data,
    });
  }

  /**
   * Find Tag by ID
   */
  async findById(id: string, include?: any) {
    return await prisma.tag.findUnique({
      where: { id },
      ...(include && { include }),
    });
  }

  /**
   * Find all Tags
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: any;
    where?: any;
    include?: any;
  }) {
    const { include, ...prismaOptions } = options || {};
    return await prisma.tag.findMany({
      ...prismaOptions,
      ...(include && { include }),
    });
  }

  /**
   * Update Tag
   */
  async update(id: string, data: UpdateTagDto) {
    return await prisma.tag.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete Tag
   */
  async delete(id: string) {
    return await prisma.tag.delete({
      where: { id },
    });
  }

  /**
   * Count Tags
   */
  async count(where?: any) {
    return await prisma.tag.count({ where });
  }

}

// Export singleton instance
export const tagService = new TagService();

