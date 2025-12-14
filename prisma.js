require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create a pg Pool using your DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Wrap it in a Prisma adapter
const adapter = new PrismaPg(pool);

// Construct PrismaClient with adapter
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
