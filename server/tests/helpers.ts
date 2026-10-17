import jwt from 'jsonwebtoken';
import { prisma } from '../src/prisma';
import { config } from '../src/config';

export async function getTestAuthToken(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(`Test user ${email} not found in database. Ensure seed ran.`);
  }

  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: '1h',
  });
}

export async function getTestTeam(slug: string) {
  const team = await prisma.team.findUnique({
    where: { slug },
  });
  if (!team) {
    throw new Error(`Test team ${slug} not found in database. Ensure seed ran.`);
  }
  return team;
}

export async function getTestUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new Error(`Test user ${email} not found.`);
  }
  return user;
}
