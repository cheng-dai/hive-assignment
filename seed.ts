import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  await prisma.user.create({
    data: {
      id: 'hereIsTheClientId',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
} catch (error) {
  console.error(`Failed to create user: ${error}`);
}
