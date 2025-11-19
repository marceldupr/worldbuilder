import { PrismaClient } from '@prisma/client';
import type { CreateUserDto, UpdateUserDto } from './user.entity';

const prisma = new PrismaClient();

/**
 * User Service
 * 
 */

export class UserService {
  /**
   * Create a new User
   */
  async create(data: CreateUserDto) {
    return await prisma.user.create({
      data,
    });
  }

  /**
   * Find User by ID
   */
  async findById(id: string, include?: any) {
    return await prisma.user.findUnique({
      where: { id },
      ...(include && { include }),
    });
  }

  /**
   * Find all Users
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: any;
    where?: any;
    include?: any;
  }) {
    const { include, ...prismaOptions } = options || {};
    return await prisma.user.findMany({
      ...prismaOptions,
      ...(include && { include }),
    });
  }

  /**
   * Update User
   */
  async update(id: string, data: UpdateUserDto) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete User
   */
  async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Count Users
   */
  async count(where?: any) {
    return await prisma.user.count({ where });
  }

}

// Export singleton instance
export const userService = new UserService();

