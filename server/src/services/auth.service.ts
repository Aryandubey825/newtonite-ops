import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TeamRole } from '@prisma/client';
import { prisma } from '../prisma';
import { config } from '../config';
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';
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

export interface InviteTokenPayload {
  email: string;
  fullName?: string;
  teamId: string;
  role: TeamRole;
  inviterName?: string;
}

export async function getInviteInfo(token: string) {
  let decoded: InviteTokenPayload;
  try {
    decoded = jwt.verify(token, config.jwtSecret) as InviteTokenPayload;
  } catch {
    throw new ValidationError('Invalid or expired invitation token.');
  }

  const team = await prisma.team.findUnique({
    where: { id: decoded.teamId },
    select: { id: true, name: true, slug: true, description: true },
  });

  if (!team) {
    throw new NotFoundError('Team referenced in invitation no longer exists.');
  }

  return {
    email: decoded.email,
    fullName: decoded.fullName || decoded.email.split('@')[0],
    role: decoded.role,
    team,
    inviterName: decoded.inviterName || 'Workspace Administrator',
  };
}

export async function acceptInvite(token: string, passwordPlain: string, customFullName?: string) {
  let decoded: InviteTokenPayload;
  try {
    decoded = jwt.verify(token, config.jwtSecret) as InviteTokenPayload;
  } catch {
    throw new ValidationError('Invalid or expired invitation token.');
  }

  if (!passwordPlain || passwordPlain.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long.');
  }

  const email = decoded.email.toLowerCase().trim();
  const fullName = customFullName?.trim() || decoded.fullName || email.split('@')[0];
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Co-transactional user creation / update and team membership linkage
  const user = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email } });
    let finalUser;

    if (existingUser) {
      finalUser = await tx.user.update({
        where: { id: existingUser.id },
        data: {
          fullName,
          passwordHash,
        },
      });
    } else {
      finalUser = await tx.user.create({
        data: {
          email,
          fullName,
          passwordHash,
        },
      });
    }

    // Link membership
    await tx.teamMembership.upsert({
      where: {
        userId_teamId: {
          userId: finalUser.id,
          teamId: decoded.teamId,
        },
      },
      update: {
        role: decoded.role,
      },
      create: {
        userId: finalUser.id,
        teamId: decoded.teamId,
        role: decoded.role,
      },
    });

    return finalUser;
  });

  const fullUser = await getUserById(user.id);
  if (!fullUser) {
    throw new Error('Failed to retrieve user after accepting invitation.');
  }

  const payload = { sub: user.id, email: user.email };
  const authToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

  return {
    token: authToken,
    user: fullUser,
  };
}

