import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  console.log('🧪 Test setup...');
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
  console.log('🧪 Test cleanup complete');
});
