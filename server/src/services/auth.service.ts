import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { AuthUser } from '../types';

export function formatAuthUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    memberships: user.memberships.map((m: any) => ({
      teamId: m.teamId,
      teamName: m.team.name,
      teamSlug: m.team.slug,
      role: m.role,
    })),
  };
}

export async function login(email: string, passwordPlain: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      memberships: {
        include: {
          team: true,
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

  return {
    token,
    user: formatAuthUser(user),
  };
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          team: true,
        },
      },
    },
  });

  return user ? formatAuthUser(user) : null;
}

export async function getAllTeams(user: AuthUser) {
  const isAdmin = user.memberships.some((m) => m.role === 'ADMIN');
  if (isAdmin) {
    return prisma.team.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { workItems: true, memberships: true },
        },
      },
    });
  }

  const userTeamIds = user.memberships.map((m) => m.teamId);
  return prisma.team.findMany({
    where: { id: { in: userTeamIds } },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { workItems: true, memberships: true },
      },
    },
  });
}
