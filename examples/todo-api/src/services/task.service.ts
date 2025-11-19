import { PrismaClient } from '@prisma/client';
import type { CreateTaskDto, UpdateTaskDto } from './task.entity';

const prisma = new PrismaClient();

/**
 * Task Service
 * 
 */

export class TaskService {
  /**
   * Create a new Task
   */
  async create(data: CreateTaskDto) {
    return await prisma.task.create({
      data,
    });
  }

  /**
   * Find Task by ID
   */
  async findById(id: string, include?: any) {
    return await prisma.task.findUnique({
      where: { id },
      ...(include && { include }),
    });
  }

  /**
   * Find all Tasks
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: any;
    where?: any;
    include?: any;
  }) {
    const { include, ...prismaOptions } = options || {};
    return await prisma.task.findMany({
      ...prismaOptions,
      ...(include && { include }),
    });
  }

  /**
   * Update Task
   */
  async update(id: string, data: UpdateTaskDto) {
    return await prisma.task.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete Task
   */
  async delete(id: string) {
    return await prisma.task.delete({
      where: { id },
    });
  }

  /**
   * Count Tasks
   */
  async count(where?: any) {
    return await prisma.task.count({ where });
  }

}

// Export singleton instance
export const taskService = new TaskService();

