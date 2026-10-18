import { PrismaClient, TeamRole, WorkItemPriority, WorkItemStatus, WorkItemType, ActivityEventType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Newtonite Operations...');

  // Clean existing tables in topological order
  await prisma.outboxJob.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Teams
  console.log('Creating operational teams...');
  const teamsData = [
    { name: 'SecOps & Incident Response', slug: 'secops', description: 'Real-time security escalations, vulnerability patches, and intrusion response' },
    { name: 'Payments & Settlement', slug: 'payments', description: 'Failed settlements, gateway downtimes, chargeback disputes, and ledger mismatches' },
    { name: 'Platform & Infrastructure', slug: 'infra', description: 'Kubernetes clusters, database failovers, cloud capacity, and network routing' },
    { name: 'Trust & Compliance', slug: 'compliance', description: 'Regulatory audits, KYC anomalies, AML alerts, and data retention mandates' },
  ];

  const teams: Record<string, any> = {};
  for (const t of teamsData) {
    teams[t.slug] = await prisma.team.create({ data: t });
  }

  // 2. Create Users
  console.log('Creating demo users across all roles...');
  const usersData = [
    { email: 'admin@newtonite.io', fullName: 'Alex Mercer (Global Admin)', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    { email: 'lead.secops@newtonite.io', fullName: 'Sarah Connor (SecOps Lead)', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { email: 'member.secops@newtonite.io', fullName: 'John Reese (SecOps Member)', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { email: 'viewer.secops@newtonite.io', fullName: 'Marcus Wright (SecOps Auditor/Viewer)', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { email: 'lead.payments@newtonite.io', fullName: 'Rachel Zane (Payments Lead)', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
    { email: 'member.payments@newtonite.io', fullName: 'Mike Ross (Payments Member)', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100' },
    { email: 'lead.infra@newtonite.io', fullName: 'Gordon Freeman (Infra Lead)', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
    { email: 'member.infra@newtonite.io', fullName: 'Alyx Vance (Infra Member)', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100' },
    { email: 'lead.compliance@newtonite.io', fullName: 'Donna Paulsen (Compliance Lead)', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
    { email: 'member.compliance@newtonite.io', fullName: 'Harvey Specter (Compliance Member)', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    users[u.email] = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
      },
    });
  }

  // 3. Assign Team Memberships
  console.log('Configuring team role assignments...');
  const memberships = [
    // Global Admin in all teams as ADMIN
    { userId: users['admin@newtonite.io'].id, teamId: teams['secops'].id, role: TeamRole.ADMIN },
    { userId: users['admin@newtonite.io'].id, teamId: teams['payments'].id, role: TeamRole.ADMIN },
    { userId: users['admin@newtonite.io'].id, teamId: teams['infra'].id, role: TeamRole.ADMIN },
    { userId: users['admin@newtonite.io'].id, teamId: teams['compliance'].id, role: TeamRole.ADMIN },

    // SecOps team
    { userId: users['lead.secops@newtonite.io'].id, teamId: teams['secops'].id, role: TeamRole.LEAD },
    { userId: users['member.secops@newtonite.io'].id, teamId: teams['secops'].id, role: TeamRole.MEMBER },
    { userId: users['viewer.secops@newtonite.io'].id, teamId: teams['secops'].id, role: TeamRole.VIEWER },

    // Payments team
    { userId: users['lead.payments@newtonite.io'].id, teamId: teams['payments'].id, role: TeamRole.LEAD },
    { userId: users['member.payments@newtonite.io'].id, teamId: teams['payments'].id, role: TeamRole.MEMBER },

    // Infra team
    { userId: users['lead.infra@newtonite.io'].id, teamId: teams['infra'].id, role: TeamRole.LEAD },
    { userId: users['member.infra@newtonite.io'].id, teamId: teams['infra'].id, role: TeamRole.MEMBER },

    // Compliance team
    { userId: users['lead.compliance@newtonite.io'].id, teamId: teams['compliance'].id, role: TeamRole.LEAD },
    { userId: users['member.compliance@newtonite.io'].id, teamId: teams['compliance'].id, role: TeamRole.MEMBER },
  ];

  for (const m of memberships) {
    await prisma.teamMembership.create({ data: m });
  }

  // 4. Create Curated Showcase Items (for live demos)
  console.log('Seeding curated showcase work items...');
  const showcaseItems = [
    {
      teamId: teams['secops'].id,
      title: '🚨 P0: Suspected Credential Stuffing on Auth Gateway',
      description: 'Over 14,000 failed login attempts detected in 5 minutes originating from ASN 45102. WAF IP rate limiting required.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: null, // Ready for concurrent claim demo!
      version: 1,
    },
    {
      teamId: teams['secops'].id,
      title: 'Patch OpenSSL 3.0 Vulnerability on Edge Proxies',
      description: 'CVE-2026-8921 memory corruption patch release. Staging verification completed.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: users['member.secops@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['secops'].id,
      title: 'Revoke Deprecated API Keys for Former Vendors',
      description: 'Q3 vendor offboarding audit requires immediate revocation of keys: ak_live_9921 and ak_test_4412.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.AWAITING_APPROVAL, // Ready for Lead Approval demo!
      createdById: users['member.secops@newtonite.io'].id,
      assigneeId: users['member.secops@newtonite.io'].id,
      version: 3,
    },
    {
      teamId: teams['payments'].id,
      title: 'Stuck ACH Settlement Batch #4092 ($1.2M)',
      description: 'Bank partner SFTP transmission timed out at 01:15 UTC. Resubmission requires ledger reconciliation.',
      type: WorkItemType.PAYMENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.payments@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['payments'].id,
      title: 'Merchant Dispute: Chargeback Surge on Account #8812',
      description: '15 dispute notices received within 2 hours. Suspected fraudulent merchant onboarding.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['member.payments@newtonite.io'].id,
      assigneeId: users['member.payments@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['infra'].id,
      title: 'Database Primary Replica Storage Reaching 88% Threshold',
      description: 'WAL archive disk utilization expanding faster than purge cycle. Auto-expand volume requested.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.infra@newtonite.io'].id,
      assigneeId: users['member.infra@newtonite.io'].id,
      version: 1,
    },
    {
      teamId: teams['compliance'].id,
      title: 'Annual SOC2 Type II Audit Artifact Collection',
      description: 'Collect git access logs, infrastructure change requests, and encryption at rest certifications.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.compliance@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
  ];

  for (const item of showcaseItems) {
    const created = await prisma.workItem.create({ data: item });
    await prisma.activityEvent.create({
      data: {
        workItemId: created.id,
        actorId: created.createdById,
        eventType: ActivityEventType.CREATED,
        newState: {
          title: created.title,
          status: created.status,
          priority: created.priority,
          assigneeId: created.assigneeId,
        },
      },
    });
  }

  // 5. Seed ~1,000 High-Volume Items to Prove Scale & Cursor Pagination
  console.log('Generating 1,000 items to test cursor pagination and index performance...');
  const bulkItems = [];
  const teamList = Object.values(teams);
  const types: WorkItemType[] = [WorkItemType.INCIDENT, WorkItemType.CUSTOMER_ISSUE, WorkItemType.PAYMENT, WorkItemType.COMPLIANCE, WorkItemType.TASK];
  const priorities: WorkItemPriority[] = [WorkItemPriority.LOW, WorkItemPriority.MEDIUM, WorkItemPriority.HIGH, WorkItemPriority.URGENT];
  const statuses: WorkItemStatus[] = [WorkItemStatus.OPEN, WorkItemStatus.IN_PROGRESS, WorkItemStatus.AWAITING_APPROVAL, WorkItemStatus.RESOLVED, WorkItemStatus.CLOSED];

  const now = Date.now();
  for (let i = 1; i <= 1000; i++) {
    const t = teamList[i % teamList.length];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const type = types[i % types.length];
    const pastTime = new Date(now - (1000 - i) * 60000); // Distributed over past time

    bulkItems.push({
      teamId: t.id,
      title: `[OPS-${1000 + i}] Automated operational task: ${type} - Subsystem verification #${i}`,
      description: `Automated health check telemetry detected an operational event in subsystem unit ${i}. Requires operator verification.`,
      type,
      priority,
      status,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: status === WorkItemStatus.OPEN ? null : users['member.secops@newtonite.io'].id,
      version: 1,
      createdAt: pastTime,
      updatedAt: pastTime,
    });
  }

  await prisma.workItem.createMany({ data: bulkItems });

  console.log('✅ Seed completed successfully:');
  console.log(`- 4 Teams created`);
  console.log(`- 10 Users created with password: 'Password123!'`);
  console.log(`- 7 Curated showcase items created with activity history`);
  console.log(`- 1,000 Bulk items seeded for cursor pagination`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
