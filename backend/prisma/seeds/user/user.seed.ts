import { hash } from 'bcrypt';
import type { PrismaClient } from '../../../src/generated/prisma/client.js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function seedUser(prisma: PrismaClient): Promise<void> {
  const passwordHash = await hash(required('SEED_USER_PASSWORD'), 10);

  const user = await prisma.user.upsert({
    where: { email: required('SEED_USER_EMAIL') },
    update: {
      name: required('SEED_USER_NAME'),
      passwordHash,
      headline: process.env.SEED_USER_HEADLINE ?? undefined,
      bio: process.env.SEED_USER_BIO ?? undefined,
      location: process.env.SEED_USER_LOCATION ?? undefined,
      githubUrl: process.env.SEED_USER_GITHUB_URL ?? undefined,
      linkedinUrl: process.env.SEED_USER_LINKEDIN_URL ?? undefined,
      portfolioUrl: process.env.SEED_USER_PORTFOLIO_URL ?? undefined,
    },
    create: {
      name: required('SEED_USER_NAME'),
      email: required('SEED_USER_EMAIL'),
      passwordHash,
      headline: process.env.SEED_USER_HEADLINE ?? undefined,
      bio: process.env.SEED_USER_BIO ?? undefined,
      location: process.env.SEED_USER_LOCATION ?? undefined,
      githubUrl: process.env.SEED_USER_GITHUB_URL ?? undefined,
      linkedinUrl: process.env.SEED_USER_LINKEDIN_URL ?? undefined,
      portfolioUrl: process.env.SEED_USER_PORTFOLIO_URL ?? undefined,
    },
  });

  console.log(`Seeded user ${user.email}`);
}
