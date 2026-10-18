import { User, Team, TeamMember, WorkspaceUser, WorkItem, WorkItemListResponse, TeamRole, ActivityEvent } from '../types';

export const DEMO_TEAMS: Team[] = [
  {
    id: 'team-secops',
    name: 'SecOps & Incident Response',
    slug: 'secops',
    description: 'Real-time security escalations, vulnerability patches, and intrusion response',
    _count: { workItems: 14, memberships: 5 },
  },
  {
    id: 'team-payments',
    name: 'Payments & Settlement',
    slug: 'payments',
    description: 'Failed settlements, gateway downtimes, chargeback disputes, and ledger mismatches',
    _count: { workItems: 12, memberships: 3 },
  },
  {
    id: 'team-infra',
    name: 'Platform & Infrastructure',
    slug: 'infra',
    description: 'Kubernetes clusters, database failovers, cloud capacity, and network routing',
    _count: { workItems: 10, memberships: 3 },
  },
  {
    id: 'team-compliance',
    name: 'Trust & Compliance',
    slug: 'compliance',
    description: 'Regulatory audits, KYC anomalies, AML alerts, and data retention mandates',
    _count: { workItems: 9, memberships: 3 },
  },
];

export const DEMO_USERS: Record<string, User> = {
  'admin@newtonite.io': {
    id: 'usr-admin',
    email: 'admin@newtonite.io',
    fullName: 'Alex Mercer (Global Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    memberships: [
      { teamId: 'team-secops', teamName: 'SecOps & Incident Response', teamSlug: 'secops', role: 'ADMIN' },
      { teamId: 'team-payments', teamName: 'Payments & Settlement', teamSlug: 'payments', role: 'ADMIN' },
      { teamId: 'team-infra', teamName: 'Platform & Infrastructure', teamSlug: 'infra', role: 'ADMIN' },
      { teamId: 'team-compliance', teamName: 'Trust & Compliance', teamSlug: 'compliance', role: 'ADMIN' },
    ],
  },
  'lead.secops@newtonite.io': {
    id: 'usr-lead-secops',
    email: 'lead.secops@newtonite.io',
    fullName: 'Sarah Connor (SecOps Lead)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    memberships: [
      { teamId: 'team-secops', teamName: 'SecOps & Incident Response', teamSlug: 'secops', role: 'LEAD' },
    ],
  },
  'member.secops@newtonite.io': {
    id: 'usr-member-secops',
    email: 'member.secops@newtonite.io',
    fullName: 'John Reese (SecOps Member)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    memberships: [
      { teamId: 'team-secops', teamName: 'SecOps & Incident Response', teamSlug: 'secops', role: 'MEMBER' },
    ],
  },
  'viewer.secops@newtonite.io': {
    id: 'usr-viewer-secops',
    email: 'viewer.secops@newtonite.io',
    fullName: 'Marcus Wright (SecOps Auditor/Viewer)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    memberships: [
      { teamId: 'team-secops', teamName: 'SecOps & Incident Response', teamSlug: 'secops', role: 'VIEWER' },
    ],
  },
  'lead.payments@newtonite.io': {
    id: 'usr-lead-payments',
    email: 'lead.payments@newtonite.io',
    fullName: 'Rachel Zane (Payments Lead)',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    memberships: [
      { teamId: 'team-payments', teamName: 'Payments & Settlement', teamSlug: 'payments', role: 'LEAD' },
    ],
  },
  'member.payments@newtonite.io': {
    id: 'usr-member-payments',
    email: 'member.payments@newtonite.io',
    fullName: 'Mike Ross (Payments Member)',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
    memberships: [
      { teamId: 'team-payments', teamName: 'Payments & Settlement', teamSlug: 'payments', role: 'MEMBER' },
    ],
  },
  'lead.infra@newtonite.io': {
    id: 'usr-lead-infra',
    email: 'lead.infra@newtonite.io',
    fullName: 'Gordon Freeman (Infra Lead)',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    memberships: [
      { teamId: 'team-infra', teamName: 'Platform & Infrastructure', teamSlug: 'infra', role: 'LEAD' },
    ],
  },
  'member.infra@newtonite.io': {
    id: 'usr-member-infra',
    email: 'member.infra@newtonite.io',
    fullName: 'Alyx Vance (Infra Member)',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    memberships: [
      { teamId: 'team-infra', teamName: 'Platform & Infrastructure', teamSlug: 'infra', role: 'MEMBER' },
    ],
  },
  'lead.compliance@newtonite.io': {
    id: 'usr-lead-compliance',
    email: 'lead.compliance@newtonite.io',
    fullName: 'Donna Paulsen (Compliance Lead)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    memberships: [
      { teamId: 'team-compliance', teamName: 'Trust & Compliance', teamSlug: 'compliance', role: 'LEAD' },
    ],
  },
  'member.compliance@newtonite.io': {
    id: 'usr-member-compliance',
    email: 'member.compliance@newtonite.io',
    fullName: 'Harvey Specter (Compliance Member)',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    memberships: [
      { teamId: 'team-compliance', teamName: 'Trust & Compliance', teamSlug: 'compliance', role: 'MEMBER' },
    ],
  },
  'aryandubey825@gmail.com': {
    id: 'usr-aryan',
    email: 'aryandubey825@gmail.com',
    fullName: 'Aryan Dubey',
    avatarUrl: undefined,
    memberships: [
      { teamId: 'team-secops', teamName: 'SecOps & Incident Response', teamSlug: 'secops', role: 'MEMBER' },
    ],
  },
};

export const DEMO_WORKSPACE_USERS: WorkspaceUser[] = Object.values(DEMO_USERS).map((u) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  avatarUrl: u.avatarUrl,
}));

let currentDemoUser: User = DEMO_USERS['admin@newtonite.io'];

export const INITIAL_WORK_ITEMS: WorkItem[] = [
  {
    id: 'item-1',
    teamId: 'team-secops',
    title: '🚨 P0: Suspected Credential Stuffing on Auth Gateway',
    description: 'Over 14,000 failed login attempts detected in 5 minutes originating from ASN 45102. WAF IP rate limiting required.',
    type: 'INCIDENT',
    priority: 'URGENT',
    status: 'OPEN',
    createdById: 'usr-lead-secops',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
  },
  {
    id: 'item-2',
    teamId: 'team-secops',
    title: 'Patch OpenSSL 3.0 Vulnerability on Edge Proxies',
    description: 'CVE-2026-8921 memory corruption patch release. Staging verification completed.',
    type: 'TASK',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdById: 'usr-lead-secops',
    assigneeId: 'usr-member-secops',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
    assignee: { id: 'usr-member-secops', fullName: 'John Reese (SecOps Member)', email: 'member.secops@newtonite.io' },
  },
  {
    id: 'item-3',
    teamId: 'team-secops',
    title: 'Revoke Deprecated API Keys for Former Vendors',
    description: 'Q3 vendor offboarding audit requires immediate revocation of keys: ak_live_9921 and ak_test_4412.',
    type: 'COMPLIANCE',
    priority: 'MEDIUM',
    status: 'AWAITING_APPROVAL',
    createdById: 'usr-member-secops',
    assigneeId: 'usr-member-secops',
    version: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-member-secops', fullName: 'John Reese (SecOps Member)', email: 'member.secops@newtonite.io' },
    assignee: { id: 'usr-member-secops', fullName: 'John Reese (SecOps Member)', email: 'member.secops@newtonite.io' },
  },
  {
    id: 'item-4',
    teamId: 'team-payments',
    title: 'Stuck ACH Settlement Batch #4092 ($1.2M)',
    description: 'Bank partner SFTP transmission timed out at 01:15 UTC. Resubmission requires ledger reconciliation.',
    type: 'PAYMENT',
    priority: 'URGENT',
    status: 'OPEN',
    createdById: 'usr-lead-payments',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-lead-payments', fullName: 'Rachel Zane (Payments Lead)', email: 'lead.payments@newtonite.io' },
  },
  {
    id: 'item-5',
    teamId: 'team-payments',
    title: 'Merchant Dispute: Chargeback Surge on Account #8812',
    description: '15 dispute notices received within 2 hours. Suspected fraudulent merchant onboarding.',
    type: 'CUSTOMER_ISSUE',
    priority: 'HIGH',
    status: 'AWAITING_APPROVAL',
    createdById: 'usr-member-payments',
    assigneeId: 'usr-member-payments',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-member-payments', fullName: 'Mike Ross (Payments Member)', email: 'member.payments@newtonite.io' },
    assignee: { id: 'usr-member-payments', fullName: 'Mike Ross (Payments Member)', email: 'member.payments@newtonite.io' },
  },
  {
    id: 'item-6',
    teamId: 'team-infra',
    title: 'Database Primary Replica Storage Reaching 88% Threshold',
    description: 'WAL archive disk utilization expanding faster than purge cycle. Auto-expand volume requested.',
    type: 'INCIDENT',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdById: 'usr-lead-infra',
    assigneeId: 'usr-member-infra',
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-lead-infra', fullName: 'Gordon Freeman (Infra Lead)', email: 'lead.infra@newtonite.io' },
    assignee: { id: 'usr-member-infra', fullName: 'Alyx Vance (Infra Member)', email: 'member.infra@newtonite.io' },
  },
  {
    id: 'item-7',
    teamId: 'team-compliance',
    title: 'Annual SOC2 Type II Audit Artifact Collection',
    description: 'Collect git access logs, infrastructure change requests, and encryption at rest certifications.',
    type: 'COMPLIANCE',
    priority: 'LOW',
    status: 'OPEN',
    createdById: 'usr-lead-compliance',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-lead-compliance', fullName: 'Donna Paulsen (Compliance Lead)', email: 'lead.compliance@newtonite.io' },
  },
];

let workItemsStore: WorkItem[] = [...INITIAL_WORK_ITEMS];
let teamsStore: Team[] = [...DEMO_TEAMS];

export function handleDemoRequest<T = any>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(endpoint, 'http://localhost');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  // 1. Auth: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const email = (body.email || '').toLowerCase().trim();
    const matchedUser = DEMO_USERS[email] || {
      id: `usr-${Date.now()}`,
      email,
      fullName: email.split('@')[0],
      avatarUrl: undefined,
      memberships: [{ teamId: 'team-secops', teamName: 'SecOps & Incident Response', teamSlug: 'secops', role: 'ADMIN' as TeamRole }],
    };
    currentDemoUser = matchedUser;
    return {
      token: `demo-jwt-token-${matchedUser.id}`,
      user: matchedUser,
    } as T;
  }

  // 2. Auth: Me
  if (pathname === '/api/auth/me') {
    return { user: currentDemoUser } as T;
  }

  // 3. Teams: List
  if (pathname === '/api/teams' && method === 'GET') {
    return {
      teams: teamsStore,
      totalWorkspaceUsers: DEMO_WORKSPACE_USERS.length,
    } as T;
  }

  // 4. Teams: Create Team
  if (pathname === '/api/teams' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: body.name || 'New Operational Team',
      slug: body.slug || (body.name || 'new-team').toLowerCase().replace(/\s+/g, '-'),
      description: body.description || '',
      _count: { workItems: 0, memberships: 1 },
    };
    teamsStore = [newTeam, ...teamsStore];
    return { team: newTeam } as T;
  }

  // 5. Teams: All Users
  if (pathname === '/api/teams/users/all') {
    return { users: DEMO_WORKSPACE_USERS } as T;
  }

  // 6. Teams: Members of a team
  const teamMembersMatch = pathname.match(/^\/api\/teams\/([^/]+)\/members$/);
  if (teamMembersMatch && method === 'GET') {
    const teamId = teamMembersMatch[1];
    const members: TeamMember[] = DEMO_WORKSPACE_USERS.slice(0, 4).map((u, idx) => ({
      id: `mem-${u.id}-${teamId}`,
      userId: u.id,
      teamId,
      role: (idx === 0 ? 'ADMIN' : idx === 1 ? 'LEAD' : 'MEMBER') as TeamRole,
      createdAt: new Date().toISOString(),
      user: {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl,
      },
    }));
    return { members } as T;
  }

  // 7. Teams: Add Member
  if (teamMembersMatch && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    return {
      success: true,
      inviteUrl: `https://newtonite-ops-blue.vercel.app/accept-invite?token=demo-token-${Date.now()}`,
      message: `Invitation generated for ${body.email || 'new member'}`,
    } as T;
  }

  // 8. Work Items: List & Tabs
  if (pathname === '/api/items' && method === 'GET') {
    const view = searchParams.get('view') || 'all';
    const teamId = searchParams.get('teamId');
    const search = (searchParams.get('search') || '').toLowerCase();
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');

    let filtered = [...workItemsStore];

    if (teamId) {
      filtered = filtered.filter((i) => i.teamId === teamId);
    }

    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(search) ||
          (i.description && i.description.toLowerCase().includes(search))
      );
    }

    if (status) filtered = filtered.filter((i) => i.status === status);
    if (priority) filtered = filtered.filter((i) => i.priority === priority);
    if (type) filtered = filtered.filter((i) => i.type === type);

    const allCount = filtered.length;
    const assignedCount = filtered.filter((i) => i.assigneeId === currentDemoUser.id).length;
    const urgentCount = filtered.filter((i) => !i.assigneeId && i.priority === 'URGENT').length;
    const awaitingApprovalCount = filtered.filter((i) => i.status === 'AWAITING_APPROVAL').length;

    let itemsForView = filtered;
    if (view === 'assigned_to_me') {
      itemsForView = filtered.filter((i) => i.assigneeId === currentDemoUser.id);
    } else if (view === 'unassigned_urgent') {
      itemsForView = filtered.filter((i) => !i.assigneeId && i.priority === 'URGENT');
    } else if (view === 'awaiting_approval') {
      itemsForView = filtered.filter((i) => i.status === 'AWAITING_APPROVAL');
    }

    const res: WorkItemListResponse = {
      items: itemsForView,
      totalCount: itemsForView.length,
      tabCounts: {
        all: allCount,
        assigned_to_me: assignedCount,
        unassigned_urgent: urgentCount,
        awaiting_approval: awaitingApprovalCount,
      },
      nextCursor: null,
      hasMore: false,
    };
    return res as T;
  }

  // 9. Work Items: Create Item
  if (pathname === '/api/items' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const targetTeam = teamsStore.find((t) => t.id === body.teamId) || teamsStore[0];
    const newItem: WorkItem = {
      id: `item-${Date.now()}`,
      teamId: targetTeam.id,
      title: body.title || 'Untitled Work Item',
      description: body.description || '',
      type: body.type || 'TASK',
      priority: body.priority || 'MEDIUM',
      status: 'OPEN',
      createdById: currentDemoUser.id,
      assigneeId: null,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      team: { id: targetTeam.id, name: targetTeam.name, slug: targetTeam.slug },
      createdBy: { id: currentDemoUser.id, fullName: currentDemoUser.fullName, email: currentDemoUser.email },
    };
    workItemsStore = [newItem, ...workItemsStore];
    return { item: newItem } as T;
  }

  // 10. Work Items: Item Activity
  const itemActivityMatch = pathname.match(/^\/api\/items\/([^/]+)\/activity$/);
  if (itemActivityMatch && method === 'GET') {
    const itemId = itemActivityMatch[1];
    const item = workItemsStore.find((i) => i.id === itemId) || workItemsStore[0];
    const activities: ActivityEvent[] = [
      {
        id: `act-1-${itemId}`,
        workItemId: item.id,
        actorId: item.createdById,
        eventType: 'CREATED',
        createdAt: item.createdAt,
        actor: {
          id: item.createdById,
          fullName: item.createdBy?.fullName || 'Alex Mercer',
          email: item.createdBy?.email || 'admin@newtonite.io',
        },
      },
      {
        id: `act-2-${itemId}`,
        workItemId: item.id,
        actorId: currentDemoUser.id,
        eventType: 'STATUS_TRANSITION',
        createdAt: item.updatedAt,
        actor: {
          id: currentDemoUser.id,
          fullName: currentDemoUser.fullName,
          email: currentDemoUser.email,
        },
      },
    ];
    return { activities } as T;
  }

  // 11. Work Items: Item Detail
  const itemDetailMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
  if (itemDetailMatch && method === 'GET') {
    const itemId = itemDetailMatch[1];
    const item = workItemsStore.find((i) => i.id === itemId) || workItemsStore[0];
    return {
      item: {
        ...item,
        comments: [],
      },
    } as T;
  }

  // 12. Work Items: Claim Item
  const itemClaimMatch = pathname.match(/^\/api\/items\/([^/]+)\/claim$/);
  if (itemClaimMatch && method === 'POST') {
    const itemId = itemClaimMatch[1];
    const item = workItemsStore.find((i) => i.id === itemId);
    if (item) {
      item.assigneeId = currentDemoUser.id;
      item.assignee = { id: currentDemoUser.id, fullName: currentDemoUser.fullName, email: currentDemoUser.email };
      item.status = 'IN_PROGRESS';
      item.version += 1;
      item.updatedAt = new Date().toISOString();
      return { item } as T;
    }
  }

  // 13. Work Items: Transition Item
  const itemTransitionMatch = pathname.match(/^\/api\/items\/([^/]+)\/transition$/);
  if (itemTransitionMatch && method === 'POST') {
    const itemId = itemTransitionMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const item = workItemsStore.find((i) => i.id === itemId);
    if (item) {
      item.status = body.targetStatus || 'RESOLVED';
      item.version += 1;
      item.updatedAt = new Date().toISOString();
      return { item } as T;
    }
  }

  return {} as T;
}
