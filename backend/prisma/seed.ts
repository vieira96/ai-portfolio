import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedUser } from './seeds/user/user.seed.js';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await seedUser(prisma);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

await main().catch(async (error: unknown) => {
  console.error(error);
  process.exit(1);
});
