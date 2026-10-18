import { User, Team, TeamMember, WorkspaceUser, WorkItem, WorkItemListResponse, TeamRole, ActivityEvent, Comment } from '../types';
import { ApiError } from './errors';

const PASSWORDS_STORAGE_KEY = 'newtonite_demo_passwords';
const USERS_STORAGE_KEY = 'newtonite_demo_users';
const COMMENTS_STORAGE_KEY = 'newtonite_demo_comments';
const ACTIVE_USER_EMAIL_KEY = 'newtonite_demo_active_user_email';
const MEMBERS_STORAGE_KEY = 'newtonite_demo_team_members';
const INVITES_STORAGE_KEY = 'newtonite_demo_invites';

function getStoredActiveUserEmail(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_EMAIL_KEY);
  } catch {}
  return null;
}

function saveStoredActiveUserEmail(email: string | null) {
  try {
    if (email) {
      localStorage.setItem(ACTIVE_USER_EMAIL_KEY, email.toLowerCase().trim());
    } else {
      localStorage.removeItem(ACTIVE_USER_EMAIL_KEY);
    }
  } catch {}
}

interface StoredInviteData {
  email: string;
  fullName: string;
  role: TeamRole;
  teamId: string;
  inviterName: string;
}

function getStoredInvites(): Record<string, StoredInviteData> {
  try {
    const raw = localStorage.getItem(INVITES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveStoredInvite(token: string, data: StoredInviteData) {
  try {
    const all = getStoredInvites();
    all[token] = data;
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function createDemoInviteToken(payload: StoredInviteData): string {
  const jsonStr = JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  });
  const base64Url = btoa(unescape(encodeURIComponent(jsonStr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const token = `demo-inv.${base64Url}.${Date.now()}`;
  saveStoredInvite(token, payload);
  return token;
}

const DEFAULT_COMMENTS: Record<string, Comment[]> = {
  'item-1': [
    {
      id: 'comm-101',
      workItemId: 'item-1',
      authorId: 'usr-lead-secops',
      content: 'WAF rules deployed to block attacker IP range. Monitoring packet anomaly counters.',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      author: {
        id: 'usr-lead-secops',
        fullName: 'Sarah Connor (SecOps Lead)',
        email: 'lead.secops@newtonite.io',
      },
    },
  ],
  'item-2': [
    {
      id: 'comm-201',
      workItemId: 'item-2',
      authorId: 'usr-lead-secops',
      content: 'Canary cluster updated with 3.0.12 patch. Zero regression detected in test suite.',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      author: {
        id: 'usr-lead-secops',
        fullName: 'Sarah Connor (SecOps Lead)',
        email: 'lead.secops@newtonite.io',
      },
    },
  ],
  'item-3': [
    {
      id: 'comm-301',
      workItemId: 'item-3',
      authorId: 'usr-member-secops',
      content: 'Audit log confirms keys ak_live_9921 and ak_test_4412 have not been accessed in 45 days. Ready for revocation approval.',
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      author: {
        id: 'usr-member-secops',
        fullName: 'John Reese (SecOps Member)',
        email: 'member.secops@newtonite.io',
      },
    },
  ],
  'item-4': [
    {
      id: 'comm-401',
      workItemId: 'item-4',
      authorId: 'usr-lead-payments',
      content: 'Bank partner SFTP channel restored. Waiting on finance team to reconcile batch #4092 ledger entries.',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      author: {
        id: 'usr-lead-payments',
        fullName: 'Rachel Zane (Payments Lead)',
        email: 'lead.payments@newtonite.io',
      },
    },
  ],
};

function getStoredComments(itemId?: string): Record<string, Comment[]> | Comment[] {
  let all: Record<string, Comment[]> = {};
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (raw) all = JSON.parse(raw);
  } catch {}

  for (const [key, comments] of Object.entries(DEFAULT_COMMENTS)) {
    if (!all[key]) {
      all[key] = [...comments];
    }
  }

  if (itemId) {
    return all[itemId] || [];
  }
  return all;
}

function saveStoredComment(itemId: string, comment: Comment) {
  try {
    const all = (getStoredComments() as Record<string, Comment[]>);
    if (!all[itemId]) all[itemId] = [];
    all[itemId].push(comment);
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function getStoredPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveStoredPassword(email: string, pass: string) {
  try {
    const all = getStoredPasswords();
    all[email.toLowerCase().trim()] = pass;
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function getStoredUsers(): Record<string, User> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveStoredUser(email: string, user: User) {
  try {
    const all = getStoredUsers();
    all[email.toLowerCase().trim()] = user;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

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
    fullName: 'Aryan Duve',
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

export function getCurrentDemoUser(optionsHeaders?: any): User {
  const storedUsers = getStoredUsers();
  Object.assign(DEMO_USERS, storedUsers);

  // 1. Check Authorization header token if passed
  try {
    let token: string | null = null;
    if (optionsHeaders) {
      if (typeof optionsHeaders.get === 'function') {
        const auth = optionsHeaders.get('Authorization');
        if (auth && auth.startsWith('Bearer ')) token = auth.replace('Bearer ', '').trim();
      } else if (optionsHeaders.Authorization) {
        token = optionsHeaders.Authorization.replace('Bearer ', '').trim();
      } else if (optionsHeaders.authorization) {
        token = optionsHeaders.authorization.replace('Bearer ', '').trim();
      }
    }
    if (!token) {
      token = localStorage.getItem('newtonite_token');
    }
    if (token && token.startsWith('demo-jwt-token-')) {
      const userId = token.replace('demo-jwt-token-', '');
      const userById = Object.values(DEMO_USERS).find((u) => u.id === userId);
      if (userById) {
        saveStoredActiveUserEmail(userById.email);
        return userById;
      }
    }
  } catch {}

  // 2. Check stored active user email in localStorage
  const storedEmail = getStoredActiveUserEmail();
  if (storedEmail) {
    if (DEMO_USERS[storedEmail]) return DEMO_USERS[storedEmail];
    if (storedUsers[storedEmail]) return storedUsers[storedEmail];
  }

  // 3. Fallback to Admin
  return DEMO_USERS['admin@newtonite.io'];
}

let currentDemoUser: User = getCurrentDemoUser();

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

const INITIAL_TEAM_MEMBERS: Record<string, TeamMember[]> = {
  'team-secops': [
    {
      id: 'mem-admin-secops',
      userId: 'usr-admin',
      teamId: 'team-secops',
      role: 'ADMIN',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[0],
    },
    {
      id: 'mem-sarah-secops',
      userId: 'usr-lead-secops',
      teamId: 'team-secops',
      role: 'LEAD',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[1],
    },
    {
      id: 'mem-john-secops',
      userId: 'usr-member-secops',
      teamId: 'team-secops',
      role: 'MEMBER',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[2],
    },
    {
      id: 'mem-marcus-secops',
      userId: 'usr-viewer-secops',
      teamId: 'team-secops',
      role: 'VIEWER',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[3],
    },
  ],
  'team-payments': [
    {
      id: 'mem-admin-payments',
      userId: 'usr-admin',
      teamId: 'team-payments',
      role: 'ADMIN',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[0],
    },
    {
      id: 'mem-rachel-payments',
      userId: 'usr-lead-payments',
      teamId: 'team-payments',
      role: 'LEAD',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[4],
    },
    {
      id: 'mem-mike-payments',
      userId: 'usr-member-payments',
      teamId: 'team-payments',
      role: 'MEMBER',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[5],
    },
  ],
  'team-infra': [
    {
      id: 'mem-admin-infra',
      userId: 'usr-admin',
      teamId: 'team-infra',
      role: 'ADMIN',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[0],
    },
    {
      id: 'mem-gordon-infra',
      userId: 'usr-lead-infra',
      teamId: 'team-infra',
      role: 'LEAD',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[6],
    },
    {
      id: 'mem-alyx-infra',
      userId: 'usr-member-infra',
      teamId: 'team-infra',
      role: 'MEMBER',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[7],
    },
  ],
  'team-compliance': [
    {
      id: 'mem-admin-compliance',
      userId: 'usr-admin',
      teamId: 'team-compliance',
      role: 'ADMIN',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[0],
    },
    {
      id: 'mem-donna-compliance',
      userId: 'usr-lead-compliance',
      teamId: 'team-compliance',
      role: 'LEAD',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[8],
    },
    {
      id: 'mem-harvey-compliance',
      userId: 'usr-member-compliance',
      teamId: 'team-compliance',
      role: 'MEMBER',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[9],
    },
  ],
};

function getStoredTeamMembers(): Record<string, TeamMember[]> {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial: Record<string, TeamMember[]> = {};
  for (const [k, v] of Object.entries(INITIAL_TEAM_MEMBERS)) {
    initial[k] = [...v];
  }
  return initial;
}

function saveStoredTeamMembers(members: Record<string, TeamMember[]>) {
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  } catch {}
}

let teamMembersStore: Record<string, TeamMember[]> = getStoredTeamMembers();

export function handleDemoRequest<T = any>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(endpoint, 'http://localhost');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  // Sync current demo user with latest persistent state
  currentDemoUser = getCurrentDemoUser(options.headers);

  // 1. Auth: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const email = (body.email || '').toLowerCase().trim();
    const enteredPassword = body.password || '';

    // Merge registered users from localStorage
    Object.assign(DEMO_USERS, getStoredUsers());

    const storedPasswords = getStoredPasswords();
    const matchedUser = DEMO_USERS[email];

    // Pre-seeded demo accounts default to 'Password123!', custom users must use their set password
    const expectedPassword = storedPasswords[email] || (matchedUser ? 'Password123!' : null);

    if (!matchedUser || !expectedPassword || enteredPassword !== expectedPassword) {
      throw new ApiError(401, 'Invalid email or password. Please check your credentials.');
    }

    currentDemoUser = matchedUser;
    saveStoredActiveUserEmail(matchedUser.email);
    return {
      token: `demo-jwt-token-${matchedUser.id}`,
      user: matchedUser,
    } as T;
  }

  // 2. Auth: Me
  if (pathname === '/api/auth/me') {
    currentDemoUser = getCurrentDemoUser(options.headers);
    return { user: currentDemoUser } as T;
  }

  // 2b. Auth: Invite Info
  if (pathname === '/api/auth/invite-info' && method === 'GET') {
    const token = searchParams.get('token') || '';
    let email = '';
    let fullName = '';
    let role: TeamRole = 'MEMBER';
    let teamId = 'team-secops';
    let inviterName = 'Alex Mercer (Global Admin)';

    // 1. Try decoding JWT / base64 payload from token
    if (token && token.includes('.')) {
      try {
        const parts = token.split('.');
        const payloadBase64 = parts[1] || parts[0];
        const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr = decodeURIComponent(escape(atob(normalizedBase64)));
        const decoded = JSON.parse(jsonStr);
        if (decoded.email) email = decoded.email;
        if (decoded.fullName) fullName = decoded.fullName;
        if (decoded.role) role = decoded.role as TeamRole;
        if (decoded.inviterName) inviterName = decoded.inviterName;
        if (decoded.teamId) teamId = decoded.teamId;
      } catch (err) {
        console.warn('Could not decode invite token payload in demo store:', err);
      }
    }

    // 2. Check stored invites map in localStorage
    if (!email && token) {
      const stored = getStoredInvites();
      if (stored[token]) {
        email = stored[token].email;
        fullName = stored[token].fullName;
        role = stored[token].role;
        teamId = stored[token].teamId;
        inviterName = stored[token].inviterName;
      }
    }

    const matchedTeam = teamsStore.find((t) => t.id === teamId) || teamsStore[0];
    const team = { id: matchedTeam.id, name: matchedTeam.name, slug: matchedTeam.slug };

    return {
      email: email || 'invitee@gmail.com',
      fullName: fullName || (email ? email.split('@')[0] : 'Invited Member'),
      role,
      team,
      inviterName,
    } as T;
  }

  // 2c. Auth: Accept Invite
  if (pathname === '/api/auth/accept-invite' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    let email = '';
    let fullName = body.fullName || '';
    let role: TeamRole = 'MEMBER';
    let teamId = 'team-secops';

    if (body.token && body.token.includes('.')) {
      try {
        const parts = body.token.split('.');
        const payloadBase64 = parts[1] || parts[0];
        const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr = decodeURIComponent(escape(atob(normalizedBase64)));
        const decoded = JSON.parse(jsonStr);
        if (decoded.email) email = decoded.email;
        if (decoded.fullName && !fullName) fullName = decoded.fullName;
        if (decoded.role) role = decoded.role as TeamRole;
        if (decoded.teamId) teamId = decoded.teamId;
      } catch (err) {
        console.warn('Could not decode JWT payload in accept-invite demo store:', err);
      }
    }

    if (!email && body.token) {
      const stored = getStoredInvites();
      if (stored[body.token]) {
        email = stored[body.token].email;
        if (!fullName) fullName = stored[body.token].fullName;
        role = stored[body.token].role;
        teamId = stored[body.token].teamId;
      }
    }

    if (!email) {
      email = 'member@newtonite.io';
    }

    const chosenPassword = body.password || '';
    if (chosenPassword.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.');
    }

    const matchedTeam = teamsStore.find((t) => t.id === teamId) || teamsStore[0];
    fullName = fullName || email.split('@')[0];

    const acceptedUser: User = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      memberships: [{ teamId: matchedTeam.id, teamName: matchedTeam.name, teamSlug: matchedTeam.slug, role }],
    };
    currentDemoUser = acceptedUser;
    saveStoredActiveUserEmail(email);

    // Persist password and user so subsequent logins strictly require this password
    saveStoredPassword(email, chosenPassword);
    DEMO_USERS[email] = acceptedUser;
    saveStoredUser(email, acceptedUser);

    return {
      token: `demo-jwt-token-${acceptedUser.id}`,
      user: acceptedUser,
    } as T;
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
    teamMembersStore[newTeam.id] = [
      {
        id: `mem-${currentDemoUser.id}-${newTeam.id}`,
        userId: currentDemoUser.id,
        teamId: newTeam.id,
        role: 'ADMIN' as TeamRole,
        createdAt: new Date().toISOString(),
        user: {
          id: currentDemoUser.id,
          fullName: currentDemoUser.fullName,
          email: currentDemoUser.email,
        },
      },
    ];
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
    teamMembersStore = getStoredTeamMembers();
    const members = teamMembersStore[teamId] || [];
    return { members } as T;
  }

  // 7. Teams: Add or Update Member Role
  if (teamMembersMatch && method === 'POST') {
    const teamId = teamMembersMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const targetTeam = teamsStore.find((t) => t.id === teamId) || teamsStore[0];
    teamMembersStore = getStoredTeamMembers();
    if (!teamMembersStore[teamId]) {
      teamMembersStore[teamId] = [];
    }

    let memberUser: WorkspaceUser;
    let finalUserId: string;

    if (body.userId) {
      // 1. Existing Workspace User being added or role updated
      finalUserId = body.userId;
      const foundInWorkspace = DEMO_WORKSPACE_USERS.find((u) => u.id === body.userId);
      const foundInUsers = Object.values(DEMO_USERS).find((u) => u.id === body.userId);
      const foundInTeam = teamMembersStore[teamId].find((m) => m.userId === body.userId)?.user;

      if (!foundInWorkspace && !foundInUsers && !foundInTeam) {
        throw new ApiError(404, 'User not found in workspace.');
      }

      memberUser = foundInWorkspace || (foundInUsers ? { id: foundInUsers.id, fullName: foundInUsers.fullName, email: foundInUsers.email, avatarUrl: foundInUsers.avatarUrl } : foundInTeam!);
    } else {
      // 2. Inviting brand new person by email
      const email = (body.email || '').toLowerCase().trim();
      if (!email || !email.includes('@')) {
        throw new ApiError(400, 'Valid email address is required.');
      }

      // Check if user already exists
      Object.assign(DEMO_USERS, getStoredUsers());
      const existingUser = DEMO_USERS[email];
      if (existingUser) {
        if (body.fullName?.trim()) {
          existingUser.fullName = body.fullName.trim();
          saveStoredUser(email, existingUser);
        }
        finalUserId = existingUser.id;
        memberUser = {
          id: existingUser.id,
          fullName: existingUser.fullName,
          email: existingUser.email,
          avatarUrl: existingUser.avatarUrl,
        };
      } else {
        finalUserId = `usr-${Date.now()}`;
        const fullName = body.fullName?.trim() || email.split('@')[0];
        memberUser = {
          id: finalUserId,
          fullName,
          email,
          avatarUrl: undefined,
        };
        const newUserObj: User = {
          id: finalUserId,
          email,
          fullName,
          memberships: [{ teamId, teamName: targetTeam.name, teamSlug: targetTeam.slug, role: (body.role || 'MEMBER') as TeamRole }],
        };
        DEMO_USERS[email] = newUserObj;
        saveStoredUser(email, newUserObj);
        saveStoredPassword(email, 'Password123!');
      }

      const existingWsIdx = DEMO_WORKSPACE_USERS.findIndex((u) => u.id === finalUserId);
      if (existingWsIdx >= 0) {
        DEMO_WORKSPACE_USERS[existingWsIdx] = memberUser;
      } else {
        DEMO_WORKSPACE_USERS.push(memberUser);
      }
    }

    // Check if user is ALREADY a member of this team
    const existingIndex = teamMembersStore[teamId].findIndex((m) => m.userId === finalUserId);
    let resultMembership: TeamMember;

    if (existingIndex >= 0) {
      // UPDATE existing membership role
      teamMembersStore[teamId][existingIndex].role = (body.role || 'MEMBER') as TeamRole;
      resultMembership = teamMembersStore[teamId][existingIndex];
    } else {
      // ADD new membership
      resultMembership = {
        id: `mem-${finalUserId}-${teamId}`,
        userId: finalUserId,
        teamId,
        role: (body.role || 'MEMBER') as TeamRole,
        createdAt: new Date().toISOString(),
        user: memberUser,
      };
      teamMembersStore[teamId] = [resultMembership, ...teamMembersStore[teamId]];
    }

    // Save updated team members to persistent storage
    saveStoredTeamMembers(teamMembersStore);

    // Update team count
    if (targetTeam && targetTeam._count) {
      targetTeam._count.memberships = teamMembersStore[teamId].length;
    }

    // Also update user's memberships in DEMO_USERS
    const userEmail = memberUser.email.toLowerCase().trim();
    if (DEMO_USERS[userEmail]) {
      const u = DEMO_USERS[userEmail];
      const memIndex = u.memberships.findIndex((m) => m.teamId === teamId);
      if (memIndex >= 0) {
        u.memberships[memIndex].role = resultMembership.role;
      } else {
        u.memberships.push({
          teamId,
          teamName: targetTeam.name,
          teamSlug: targetTeam.slug,
          role: resultMembership.role,
        });
      }
      saveStoredUser(userEmail, u);
    }

    const inviteToken = createDemoInviteToken({
      email: memberUser.email,
      fullName: memberUser.fullName,
      role: resultMembership.role,
      teamId,
      inviterName: currentDemoUser.fullName,
    });
    const baseOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://newtonite-ops-blue.vercel.app';
    const inviteUrl = `${baseOrigin}/accept-invite?token=${inviteToken}`;
    const emailInviteUrl = baseOrigin.includes('localhost')
      ? `https://newtonite-ops-blue.vercel.app/accept-invite?token=${inviteToken}`
      : inviteUrl;

    // Dispatch real email to Gmail inbox via Vercel serverless function
    const recipientEmail = (body.email || memberUser.email || '').toLowerCase().trim();
    if (recipientEmail && !recipientEmail.endsWith('@newtonite.io')) {
      fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          fullName: memberUser.fullName,
          teamName: targetTeam?.name || 'Operational Team',
          role: resultMembership.role,
          inviteUrl: emailInviteUrl,
          inviterName: currentDemoUser.fullName,
        }),
      })
        .then(async (res) => {
          const json = await res.json().catch(() => ({}));
          console.log('[Vercel Email Dispatch]:', json);
        })
        .catch((err) => {
          console.warn('[Vercel Email Dispatch Failed]:', err);
        });
    }

    return {
      success: true,
      membership: resultMembership,
      inviteUrl,
      message: `User "${memberUser.fullName}" successfully updated in ${targetTeam.name}!`,
    } as T;
  }

  // 7b. Teams: Remove Member
  const teamMemberDeleteMatch = pathname.match(/^\/api\/teams\/([^/]+)\/members\/([^/]+)$/);
  if (teamMemberDeleteMatch && method === 'DELETE') {
    const teamId = teamMemberDeleteMatch[1];
    const userId = teamMemberDeleteMatch[2];

    teamMembersStore = getStoredTeamMembers();
    if (!teamMembersStore[teamId]) {
      teamMembersStore[teamId] = [];
    }

    const memberToDelete = teamMembersStore[teamId].find((m) => m.userId === userId);
    if (!memberToDelete) {
      throw new ApiError(404, 'Member not found in team.');
    }

    // RBAC Guard: Cannot remove the last remaining ADMIN of the team
    if (memberToDelete.role === 'ADMIN') {
      const adminCount = teamMembersStore[teamId].filter((m) => m.role === 'ADMIN').length;
      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot remove the last remaining ADMIN of the team.');
      }
    }

    // Remove member from team
    teamMembersStore[teamId] = teamMembersStore[teamId].filter((m) => m.userId !== userId);
    saveStoredTeamMembers(teamMembersStore);

    // Update team count
    const targetTeam = teamsStore.find((t) => t.id === teamId);
    if (targetTeam && targetTeam._count) {
      targetTeam._count.memberships = teamMembersStore[teamId].length;
    }

    // Also remove team membership from DEMO_USERS
    const userEmail = memberToDelete.user?.email?.toLowerCase().trim();
    if (userEmail && DEMO_USERS[userEmail]) {
      DEMO_USERS[userEmail].memberships = DEMO_USERS[userEmail].memberships.filter(
        (m) => m.teamId !== teamId
      );
      saveStoredUser(userEmail, DEMO_USERS[userEmail]);
    }

    return {
      success: true,
      message: `Member ${memberToDelete.user?.fullName || userId} removed from team.`,
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

    // Include comment events in activity trail
    const itemComments = (getStoredComments(itemId) as Comment[]);
    itemComments.forEach((c) => {
      activities.push({
        id: `act-comm-${c.id}`,
        workItemId: itemId,
        actorId: c.authorId,
        eventType: 'COMMENT_ADDED',
        createdAt: c.createdAt,
        newState: { snippet: c.content.slice(0, 80) },
        actor: c.author,
      });
    });

    return { activities } as T;
  }

  // 11. Work Items: Item Detail (GET & PATCH)
  const itemDetailMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
  if (itemDetailMatch && method === 'GET') {
    const itemId = itemDetailMatch[1];
    const item = workItemsStore.find((i) => i.id === itemId) || workItemsStore[0];
    const comments = (getStoredComments(itemId) as Comment[]);
    return {
      item: {
        ...item,
        comments,
      },
    } as T;
  }

  if (itemDetailMatch && method === 'PATCH') {
    const itemId = itemDetailMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const item = workItemsStore.find((i) => i.id === itemId);
    if (!item) {
      throw new ApiError(404, 'Work item not found');
    }
    if (typeof body.version === 'number' && body.version !== item.version) {
      throw new ApiError(409, `Conflict: Work item was updated by another operator. Current version is ${item.version}.`);
    }
    if (body.title !== undefined) item.title = body.title;
    if (body.description !== undefined) item.description = body.description;
    if (body.priority !== undefined) item.priority = body.priority;
    item.version += 1;
    item.updatedAt = new Date().toISOString();
    return { item } as T;
  }

  // 12. Work Items: Add Comment
  const itemCommentMatch = pathname.match(/^\/api\/items\/([^/]+)\/comments$/);
  if (itemCommentMatch && method === 'POST') {
    const itemId = itemCommentMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const content = (body.content || '').trim();
    if (!content) {
      throw new ApiError(400, 'Comment content cannot be empty.');
    }
    const newComment: Comment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      workItemId: itemId,
      authorId: currentDemoUser.id,
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: currentDemoUser.id,
        fullName: currentDemoUser.fullName,
        email: currentDemoUser.email,
        avatarUrl: currentDemoUser.avatarUrl,
      },
    };
    saveStoredComment(itemId, newComment);

    const targetItem = workItemsStore.find((i) => i.id === itemId);
    if (targetItem) {
      targetItem.updatedAt = new Date().toISOString();
    }

    return { comment: newComment } as T;
  }

  // 13. Work Items: Claim Item
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

  // 14. Work Items: Transition Item
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
