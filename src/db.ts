import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Create a pg Pool using your DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Wrap it with Prisma’s adapter
const adapter = new PrismaPg(pool);

// Pass the adapter into PrismaClient
const prisma = new PrismaClient({ adapter });

export default prisma;
