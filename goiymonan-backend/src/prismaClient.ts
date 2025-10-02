import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function initPrisma() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected');
  } catch (err) {
    console.error('Prisma connect error', err);
    throw err;
  }
}
