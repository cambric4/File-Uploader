import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient(); // ✅ no options needed
export default prisma;
