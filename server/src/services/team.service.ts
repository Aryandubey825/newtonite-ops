import { PrismaClient, TeamRole, OutboxStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config';
import { AuthUser } from '../types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';

export function isWorkspaceAdmin(user: AuthUser): boolean {
  return user.memberships.some((m) => m.role === 'ADMIN');
}

export function isTeamAdmin(user: AuthUser, teamId: string): boolean {
  if (isWorkspaceAdmin(user)) return true;
  return user.memberships.some((m) => m.teamId === teamId && m.role === 'ADMIN');
}

export async function listTeams(user: AuthUser) {
  const isAdmin = isWorkspaceAdmin(user);
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

export async function createTeam(
  user: AuthUser,
  input: { name: string; slug?: string; description?: string }
) {
  if (!isWorkspaceAdmin(user)) {
    throw new ForbiddenError('Access Denied: Only Workspace Administrators can create new teams.');
  }

  const name = input.name?.trim();
  if (!name || name.length < 2) {
    throw new ValidationError('Team name must be at least 2 characters long.');
  }

  const slug = (input.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  if (!slug || slug.length < 2) {
    throw new ValidationError('Valid team slug is required.');
  }

  const existing = await prisma.team.findFirst({
    where: {
      OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }],
    },
  });

  if (existing) {
    throw new ConflictError(`Team with name "${name}" or slug "${slug}" already exists.`);
  }

  // Atomically create team and assign creator as ADMIN
  return prisma.$transaction(async (tx) => {
    const newTeam = await tx.team.create({
      data: {
        name,
        slug,
        description: input.description?.trim() || null,
      },
    });

    await tx.teamMembership.create({
      data: {
        userId: user.id,
        teamId: newTeam.id,
        role: TeamRole.ADMIN,
      },
    });

    return newTeam;
  });
}

export async function getTeamMembers(teamId: string, user: AuthUser) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!team) {
    throw new NotFoundError(`Team with ID ${teamId} not found.`);
  }

  return team.memberships;
}

export async function addOrUpdateTeamMember(
  teamId: string,
  target: { userId?: string; email?: string; fullName?: string } | string,
  role: TeamRole,
  requester: AuthUser
) {
  if (!isTeamAdmin(requester, teamId)) {
    throw new ForbiddenError('Access Denied: Only Team or Workspace Admins can add or update team members.');
  }

  if (!Object.values(TeamRole).includes(role)) {
    throw new ValidationError(`Invalid role: ${role}. Valid roles are VIEWER, MEMBER, LEAD, ADMIN.`);
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new NotFoundError(`Team with ID ${teamId} not found.`);
  }

  let finalUserId = typeof target === 'string' ? target : target.userId;

  let inviteToken: string | undefined;
  let inviteUrl: string | undefined;

  // If email is provided, find or create the user dynamically & dispatch outbox invite
  if (typeof target === 'object' && target.email) {
    const email = target.email.toLowerCase().trim();
    if (!email.includes('@') || !email.includes('.')) {
      throw new ValidationError('A valid email address is required to invite or add a user.');
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const fullName = target.fullName?.trim() || email.split('@')[0];
      const passwordHash = await bcrypt.hash('Password123!', 10);
      user = await prisma.user.create({
        data: {
          email,
          fullName,
          passwordHash,
        },
      });
    }
    finalUserId = user.id;

    // Generate signed invitation token
    inviteToken = jwt.sign(
      {
        email,
        fullName: target.fullName || user.fullName,
        teamId,
        role,
        inviterName: requester.fullName,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    inviteUrl = `${baseUrl}/accept-invite?token=${inviteToken}`;

    // Queue Outbox Job for async email delivery
    await prisma.outboxJob.create({
      data: {
        eventType: 'INVITATION_EMAIL',
        payload: {
          to: email,
          fullName: user.fullName,
          teamName: team.name,
          role,
          inviteUrl,
          inviterName: requester.fullName,
        },
        status: OutboxStatus.PENDING,
        attempts: 0,
        maxAttempts: 5,
        nextRunAt: new Date(),
      },
    });
  }

  if (!finalUserId) {
    throw new ValidationError('Either a valid userId or email must be provided to add a member.');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: finalUserId } });
  if (!targetUser) {
    throw new NotFoundError(`User with ID ${finalUserId} not found.`);
  }

  const membership = await prisma.teamMembership.upsert({
    where: {
      userId_teamId: {
        userId: finalUserId,
        teamId,
      },
    },
    update: {
      role,
    },
    create: {
      userId: finalUserId,
      teamId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return {
    membership,
    inviteUrl,
    inviteToken,
  };
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
  requester: AuthUser
) {
  if (!isTeamAdmin(requester, teamId)) {
    throw new ForbiddenError('Access Denied: Only Team or Workspace Admins can remove team members.');
  }

  const membership = await prisma.teamMembership.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });

  if (!membership) {
    throw new NotFoundError('Team membership not found.');
  }

  // Safety check: Cannot remove the last ADMIN of a team
  if (membership.role === TeamRole.ADMIN) {
    const adminCount = await prisma.teamMembership.count({
      where: {
        teamId,
        role: TeamRole.ADMIN,
      },
    });

    if (adminCount <= 1) {
      throw new ConflictError('Cannot remove the last Admin of a team. Promote another member first.');
    }
  }

  await prisma.teamMembership.delete({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });

  return { success: true };
}

export async function listWorkspaceUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
    },
    orderBy: { fullName: 'asc' },
  });
}
