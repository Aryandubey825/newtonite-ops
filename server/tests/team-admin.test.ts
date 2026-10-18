import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { getTestAuthToken, getTestUser } from './helpers';
import { TeamRole } from '@prisma/client';

describe('Admin-Restricted Team & Membership Management', () => {
  let adminToken: string;
  let memberToken: string;
  let viewerToken: string;
  let createdTeamId: string;
  let targetUser: any;

  beforeAll(async () => {
    adminToken = await getTestAuthToken('admin@newtonite.io');
    memberToken = await getTestAuthToken('member.secops@newtonite.io');
    viewerToken = await getTestAuthToken('viewer.secops@newtonite.io');
    targetUser = await getTestUser('member.payments@newtonite.io');
  });

  afterAll(async () => {
    if (createdTeamId) {
      await prisma.teamMembership.deleteMany({ where: { teamId: createdTeamId } });
      await prisma.team.delete({ where: { id: createdTeamId } }).catch(() => {});
    }
  });

  it('rejects team creation by a regular MEMBER with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Unauthorized Member Team',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('ForbiddenError');
    expect(res.body.message).toMatch(/Only Workspace Administrators can create new teams/i);
  });

  it('rejects team creation by a VIEWER with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        name: 'Unauthorized Viewer Team',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('ForbiddenError');
  });

  it('allows Workspace ADMIN to create a new team and auto-assigns admin membership', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'DevOps & Reliability Ops',
        description: 'Site reliability engineering and disaster recovery',
      });

    expect(res.status).toBe(201);
    expect(res.body.team).toBeDefined();
    expect(res.body.team.name).toBe('DevOps & Reliability Ops');
    expect(res.body.team.slug).toBe('devops-reliability-ops');
    createdTeamId = res.body.team.id;

    // Verify creator was assigned ADMIN membership in database
    const membership = await prisma.teamMembership.findFirst({
      where: { teamId: createdTeamId, role: TeamRole.ADMIN },
    });
    expect(membership).toBeDefined();
  });

  it('rejects member addition by non-admin with 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        userId: targetUser.id,
        role: TeamRole.MEMBER,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('ForbiddenError');
  });

  it('allows ADMIN to add a new team member with specified role', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: targetUser.id,
        role: TeamRole.MEMBER,
      });

    expect(res.status).toBe(200);
    expect(res.body.membership).toBeDefined();
    expect(res.body.membership.userId).toBe(targetUser.id);
    expect(res.body.membership.role).toBe(TeamRole.MEMBER);
  });

  it('allows ADMIN to update member role to LEAD', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: targetUser.id,
        role: TeamRole.LEAD,
      });

    expect(res.status).toBe(200);
    expect(res.body.membership.role).toBe(TeamRole.LEAD);
  });

  it('allows ADMIN to fetch team members list', async () => {
    const res = await request(app)
      .get(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.members).toBeDefined();
    expect(res.body.members.length).toBeGreaterThanOrEqual(2);
  });

  it('allows ADMIN to invite and create a brand new user by email into the team', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'newoperator@newtonite.io',
        fullName: 'New Field Operator',
        role: TeamRole.MEMBER,
      });

    expect(res.status).toBe(200);
    expect(res.body.membership).toBeDefined();
    expect(res.body.membership.user.email).toBe('newoperator@newtonite.io');
    expect(res.body.membership.user.fullName).toBe('New Field Operator');
    expect(res.body.membership.role).toBe(TeamRole.MEMBER);

    // Clean up created test user
    await prisma.teamMembership.deleteMany({ where: { userId: res.body.membership.userId } });
    await prisma.user.delete({ where: { id: res.body.membership.userId } });
  });

  it('allows ADMIN to remove member from team', async () => {
    const res = await request(app)
      .delete(`/api/teams/${createdTeamId}/members/${targetUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId: targetUser.id, teamId: createdTeamId } },
    });
    expect(check).toBeNull();
  });
});
