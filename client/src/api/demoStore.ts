import { User, Team, TeamMember, WorkspaceUser, WorkItem, WorkItemListResponse, TeamRole, ActivityEvent, Comment } from '../types';
import { ApiError } from './errors';

const PASSWORDS_STORAGE_KEY = 'newtonite_demo_passwords';
const USERS_STORAGE_KEY = 'newtonite_demo_users';
const COMMENTS_STORAGE_KEY = 'newtonite_demo_comments';

const DEFAULT_COMMENTS: Record<string, Comment[]> = {
  'item-1': [
    {
      id: 'comm-101',
      workItemId: 'item-1',
      authorId: 'usr-lead-secops',
      content: 'WAF rules deployed to block attacker IP range (ASN 45102). Monitoring packet anomaly counters.',
      createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      author: {
        id: 'usr-lead-secops',
        fullName: 'Sarah Connor (SecOps Lead)',
        email: 'lead.secops@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      },
    },
    {
      id: 'comm-102',
      workItemId: 'item-1',
      authorId: 'usr-member-secops',
      content: 'Confirming dropped connections: 14,200 packets discarded in last 60 seconds. Ingress load returning to baseline.',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      author: {
        id: 'usr-member-secops',
        fullName: 'John Reese (SecOps Member)',
        email: 'member.secops@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      },
    },
    {
      id: 'comm-103',
      workItemId: 'item-1',
      authorId: 'usr-aryan',
      content: 'Traffic graph stabilized. Rate-limit threshold holding steady. Ready for final incident sign-off.',
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      author: {
        id: 'usr-aryan',
        fullName: 'Aryan Duve',
        email: 'aryandubey825@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
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
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      },
    },
    {
      id: 'comm-202',
      workItemId: 'item-2',
      authorId: 'usr-member-secops',
      content: 'Edge proxies in us-east-1 and eu-central-1 rolling restarts complete. No dropped TLS handshakes.',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      author: {
        id: 'usr-member-secops',
        fullName: 'John Reese (SecOps Member)',
        email: 'member.secops@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
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
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      },
    },
    {
      id: 'comm-302',
      workItemId: 'item-3',
      authorId: 'usr-lead-secops',
      content: 'Reviewed vendor offboarding checklist. Approved for permanent revocation.',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      author: {
        id: 'usr-lead-secops',
        fullName: 'Sarah Connor (SecOps Lead)',
        email: 'lead.secops@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      },
    },
  ],
  'item-4': [
    {
      id: 'comm-401',
      workItemId: 'item-4',
      authorId: 'usr-lead-payments',
      content: 'Bank partner SFTP channel restored. Waiting on finance team to reconcile batch #4092 ledger entries.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      author: {
        id: 'usr-lead-payments',
        fullName: 'Rachel Zane (Payments Lead)',
        email: 'lead.payments@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
      },
    },
    {
      id: 'comm-402',
      workItemId: 'item-4',
      authorId: 'usr-member-payments',
      content: 'Ledger entries matched against raw MT940 statement. 1,420 transactions accounted for ($1,218,440.00). Ready to release batch.',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      author: {
        id: 'usr-member-payments',
        fullName: 'Mike Ross (Payments Member)',
        email: 'member.payments@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
      },
    },
  ],
  'item-5': [
    {
      id: 'comm-501',
      workItemId: 'item-5',
      authorId: 'usr-member-payments',
      content: 'Merchant account #8812 flagged for velocity anomaly: 15 chargebacks on newly registered cards. Recommending account freeze.',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      author: {
        id: 'usr-member-payments',
        fullName: 'Mike Ross (Payments Member)',
        email: 'member.payments@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
      },
    },
    {
      id: 'comm-502',
      workItemId: 'item-5',
      authorId: 'usr-lead-payments',
      content: 'Agreed. Holding payout queue for 72 hours pending KYC verification.',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      author: {
        id: 'usr-lead-payments',
        fullName: 'Rachel Zane (Payments Lead)',
        email: 'lead.payments@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
      },
    },
  ],
  'item-6': [
    {
      id: 'comm-601',
      workItemId: 'item-6',
      authorId: 'usr-lead-infra',
      content: 'WAL archive storage alert fired at 88%. Triggered automated EBS volume expansion from 500GB to 1TB.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      author: {
        id: 'usr-lead-infra',
        fullName: 'Gordon Freeman (Infra Lead)',
        email: 'lead.infra@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      },
    },
    {
      id: 'comm-602',
      workItemId: 'item-6',
      authorId: 'usr-member-infra',
      content: 'Volume resizing completed online. Filesystem resize2fs executed without I/O pause.',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      author: {
        id: 'usr-member-infra',
        fullName: 'Alyx Vance (Infra Member)',
        email: 'member.infra@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
      },
    },
  ],
  'item-7': [
    {
      id: 'comm-701',
      workItemId: 'item-7',
      authorId: 'usr-lead-compliance',
      content: 'Annual SOC2 artifact request submitted to all engineering leads. Please upload evidence by Friday 17:00 UTC.',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      author: {
        id: 'usr-lead-compliance',
        fullName: 'Donna Paulsen (Compliance Lead)',
        email: 'lead.compliance@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
      },
    },
    {
      id: 'comm-702',
      workItemId: 'item-7',
      authorId: 'usr-member-compliance',
      content: 'Compliance binder created. AWS CloudTrail and Okta SAML audit logs indexed.',
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      author: {
        id: 'usr-member-compliance',
        fullName: 'Harvey Specter (Compliance Member)',
        email: 'member.compliance@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
      },
    },
  ],
  'item-sec-4': [
    {
      id: 'comm-sec4-1',
      workItemId: 'item-sec-4',
      authorId: 'usr-aryan',
      content: 'SYN-flood on US-East API gateway peaked at 4.2M rps. Custom rate-limiting tier 2 activated.',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      author: {
        id: 'usr-aryan',
        fullName: 'Aryan Duve',
        email: 'aryandubey825@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      },
    },
    {
      id: 'comm-sec4-2',
      workItemId: 'item-sec-4',
      authorId: 'usr-admin',
      content: 'Excellent response time Aryan. Origin shield is absorbing residual spikes cleanly.',
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      author: {
        id: 'usr-admin',
        fullName: 'Alex Mercer (Global Admin)',
        email: 'admin@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      },
    },
  ],
  'item-inf-2': [
    {
      id: 'comm-inf2-1',
      workItemId: 'item-inf-2',
      authorId: 'usr-lead-infra',
      content: 'etcd leader election latency hit 120ms. Disk write queue depth elevated on node etcd-02.',
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      author: {
        id: 'usr-lead-infra',
        fullName: 'Gordon Freeman (Infra Lead)',
        email: 'lead.infra@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      },
    },
    {
      id: 'comm-inf2-2',
      workItemId: 'item-inf-2',
      authorId: 'usr-member-infra',
      content: 'Compacting revision history and defragmenting database. Latency dropping back to 4ms.',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      author: {
        id: 'usr-member-infra',
        fullName: 'Alyx Vance (Infra Member)',
        email: 'member.infra@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
      },
    },
  ],
  'item-cmp-2': [
    {
      id: 'comm-cmp2-1',
      workItemId: 'item-cmp-2',
      authorId: 'usr-member-compliance',
      content: 'Right to be forgotten request validated for 42 EU customer accounts. Crypto-shredding keys ready. Requesting Lead approval.',
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      author: {
        id: 'usr-member-compliance',
        fullName: 'Harvey Specter (Compliance Member)',
        email: 'member.compliance@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
      },
    },
    {
      id: 'comm-cmp2-2',
      workItemId: 'item-cmp-2',
      authorId: 'usr-lead-compliance',
      content: 'Legal clearance granted. Proceed with cryptographic key erasure.',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      author: {
        id: 'usr-lead-compliance',
        fullName: 'Donna Paulsen (Compliance Lead)',
        email: 'lead.compliance@newtonite.io',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
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
    _count: { workItems: 12, memberships: 4 },
  },
  {
    id: 'team-infra',
    name: 'Platform & Infrastructure',
    slug: 'infra',
    description: 'Kubernetes clusters, database failovers, cloud capacity, and network routing',
    _count: { workItems: 10, memberships: 4 },
  },
  {
    id: 'team-compliance',
    name: 'Trust & Compliance',
    slug: 'compliance',
    description: 'Regulatory audits, KYC anomalies, AML alerts, and data retention mandates',
    _count: { workItems: 9, memberships: 4 },
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
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    memberships: [
      { teamId: 'team-secops', teamName: 'SecOps & Incident Response', teamSlug: 'secops', role: 'ADMIN' },
      { teamId: 'team-payments', teamName: 'Payments & Settlement', teamSlug: 'payments', role: 'ADMIN' },
      { teamId: 'team-infra', teamName: 'Platform & Infrastructure', teamSlug: 'infra', role: 'ADMIN' },
      { teamId: 'team-compliance', teamName: 'Trust & Compliance', teamSlug: 'compliance', role: 'ADMIN' },
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
  // ==================== 1. SECOPS TEAM (14 Items) ====================
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
    title: 'Patch OpenSSL 3.0 Vulnerability on Edge Proxies (CVE-2026-8921)',
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
    id: 'item-sec-4',
    teamId: 'team-secops',
    title: 'DDoS Mitigation on Cloudflare Anycast Ingress',
    description: 'Spike of 4.2M rps SYN-flood on US-East API endpoints. Custom rate limiting and BGP blackholing active.',
    type: 'INCIDENT',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    createdById: 'usr-admin',
    assigneeId: 'usr-aryan',
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
    assignee: { id: 'usr-aryan', fullName: 'Aryan Duve', email: 'aryandubey825@gmail.com' },
  },
  {
    id: 'item-sec-5',
    teamId: 'team-secops',
    title: 'Phishing Alert: Malicious Domain Mimicking SSO Portal',
    description: 'Employees reported email lures pointing to newtonite-internal.net. Domain registrar abuse report submitted.',
    type: 'INCIDENT',
    priority: 'HIGH',
    status: 'OPEN',
    createdById: 'usr-lead-secops',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
  },
  {
    id: 'item-sec-6',
    teamId: 'team-secops',
    title: 'Rotate Root CA Certificates Across Microservices Cluster',
    description: '90-day certificate lifecycle rotation for internal mTLS communication.',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdById: 'usr-lead-secops',
    assigneeId: 'usr-member-secops',
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
    assignee: { id: 'usr-member-secops', fullName: 'John Reese (SecOps Member)', email: 'member.secops@newtonite.io' },
  },
  {
    id: 'item-sec-7',
    teamId: 'team-secops',
    title: 'Audit MFA Compliance for Contractor Accounts',
    description: 'All 84 third-party contractor seats verified with FIDO2 hardware keys.',
    type: 'TASK',
    priority: 'LOW',
    status: 'RESOLVED',
    createdById: 'usr-lead-secops',
    assigneeId: 'usr-viewer-secops',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
    assignee: { id: 'usr-viewer-secops', fullName: 'Marcus Wright (SecOps Auditor/Viewer)', email: 'viewer.secops@newtonite.io' },
  },
  {
    id: 'item-sec-8',
    teamId: 'team-secops',
    title: 'Isolate Compromised Bastion Host in Staging VPC',
    description: 'Anomalous outbound SSH connection to external IP 185.220.101.5. Security group containment applied; awaiting Lead sign-off for teardown.',
    type: 'INCIDENT',
    priority: 'URGENT',
    status: 'AWAITING_APPROVAL',
    createdById: 'usr-aryan',
    assigneeId: 'usr-aryan',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-aryan', fullName: 'Aryan Duve', email: 'aryandubey825@gmail.com' },
    assignee: { id: 'usr-aryan', fullName: 'Aryan Duve', email: 'aryandubey825@gmail.com' },
  },
  {
    id: 'item-sec-9',
    teamId: 'team-secops',
    title: 'Secrets Leak Verification in Public Sandbox Repository',
    description: 'GitHub secret scanning triggered on dummy AWS credentials. Confirmed scoped to deleted sandbox account.',
    type: 'INCIDENT',
    priority: 'HIGH',
    status: 'RESOLVED',
    createdById: 'usr-member-secops',
    assigneeId: 'usr-lead-secops',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-member-secops', fullName: 'John Reese (SecOps Member)', email: 'member.secops@newtonite.io' },
    assignee: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
  },
  {
    id: 'item-sec-10',
    teamId: 'team-secops',
    title: 'Quarterly Vulnerability Penetration Test Remediation',
    description: 'Addressed 4 low-severity XSS findings identified in internal pentest report.',
    type: 'TASK',
    priority: 'LOW',
    status: 'CLOSED',
    createdById: 'usr-lead-secops',
    assigneeId: 'usr-member-secops',
    version: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
    assignee: { id: 'usr-member-secops', fullName: 'John Reese (SecOps Member)', email: 'member.secops@newtonite.io' },
  },
  {
    id: 'item-sec-11',
    teamId: 'team-secops',
    title: 'Update SIEM Retention Rules for GDPR Compliance',
    description: 'Adjust Elasticsearch index lifecycle management (ILM) policies to purge raw IP logs after 90 days.',
    type: 'COMPLIANCE',
    priority: 'MEDIUM',
    status: 'OPEN',
    createdById: 'usr-viewer-secops',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-viewer-secops', fullName: 'Marcus Wright (SecOps Auditor/Viewer)', email: 'viewer.secops@newtonite.io' },
  },
  {
    id: 'item-sec-12',
    teamId: 'team-secops',
    title: 'WAF Rule False Positive Blocking European Mobile App Users',
    description: 'Rule #942100 (SQLi heuristic) triggering on valid UTF-8 username registrations in EMEA.',
    type: 'INCIDENT',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdById: 'usr-admin',
    assigneeId: 'usr-lead-secops',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
    assignee: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
  },
  {
    id: 'item-sec-13',
    teamId: 'team-secops',
    title: 'Implement YubiKey Mandatory Policy for Production Deployments',
    description: 'Production release pipeline now enforces hardware security key WebAuthn signature.',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    createdById: 'usr-admin',
    assigneeId: 'usr-admin',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
    assignee: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
  },
  {
    id: 'item-sec-14',
    teamId: 'team-secops',
    title: 'Security Awareness Training Tracking - Q3 Cycle',
    description: '100% completion achieved across all engineering cohorts.',
    type: 'TASK',
    priority: 'LOW',
    status: 'CLOSED',
    createdById: 'usr-lead-secops',
    assigneeId: 'usr-viewer-secops',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    team: { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' },
    createdBy: { id: 'usr-lead-secops', fullName: 'Sarah Connor (SecOps Lead)', email: 'lead.secops@newtonite.io' },
    assignee: { id: 'usr-viewer-secops', fullName: 'Marcus Wright (SecOps Auditor/Viewer)', email: 'viewer.secops@newtonite.io' },
  },

  // ==================== 2. PAYMENTS TEAM (12 Items) ====================
  {
    id: 'item-4',
    teamId: 'team-payments',
    title: '🚨 Stuck ACH Settlement Batch #4092 ($1.2M USD)',
    description: 'Bank partner SFTP transmission timed out at 01:15 UTC. Resubmission requires dual-operator ledger reconciliation.',
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
    description: '15 dispute notices received within 2 hours. Suspected fraudulent merchant onboarding; refund freeze requested.',
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
    id: 'item-pay-3',
    teamId: 'team-payments',
    title: 'Stripe Webhook Delivery Failures for Eurozone SEPA Debits',
    description: 'Webhook signature verification failing on 4% of SEPA direct debit confirmations. Investigating clock skew.',
    type: 'PAYMENT',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdById: 'usr-lead-payments',
    assigneeId: 'usr-member-payments',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-lead-payments', fullName: 'Rachel Zane (Payments Lead)', email: 'lead.payments@newtonite.io' },
    assignee: { id: 'usr-member-payments', fullName: 'Mike Ross (Payments Member)', email: 'member.payments@newtonite.io' },
  },
  {
    id: 'item-pay-4',
    teamId: 'team-payments',
    title: 'Payment Gateway Latency Spike During Flash Sale',
    description: 'Payment gateway latency elevated to 4.2s (p99). Transactions timing out on mobile checkout.',
    type: 'CUSTOMER_ISSUE',
    priority: 'URGENT',
    status: 'OPEN',
    createdById: 'usr-admin',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
  },
  {
    id: 'item-pay-5',
    teamId: 'team-payments',
    title: 'Double Credit Anomaly on Currency FX Conversions',
    description: 'Users converting USD to JPY observed micro-rounding duplicates on rapid re-submission. OCC latch verified.',
    type: 'PAYMENT',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdById: 'usr-lead-payments',
    assigneeId: 'usr-aryan',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-lead-payments', fullName: 'Rachel Zane (Payments Lead)', email: 'lead.payments@newtonite.io' },
    assignee: { id: 'usr-aryan', fullName: 'Aryan Duve', email: 'aryandubey825@gmail.com' },
  },
  {
    id: 'item-pay-6',
    teamId: 'team-payments',
    title: 'Reconcile Visa Interchange Fee Adjustments for September',
    description: 'Monthly interchange fee reconciliation matching core ledger to Visa raw settlement files.',
    type: 'TASK',
    priority: 'LOW',
    status: 'RESOLVED',
    createdById: 'usr-lead-payments',
    assigneeId: 'usr-lead-payments',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-lead-payments', fullName: 'Rachel Zane (Payments Lead)', email: 'lead.payments@newtonite.io' },
    assignee: { id: 'usr-lead-payments', fullName: 'Rachel Zane (Payments Lead)', email: 'lead.payments@newtonite.io' },
  },
  {
    id: 'item-pay-7',
    teamId: 'team-payments',
    title: 'Manual Wire Transfer Authorization for Payout ($450,000)',
    description: 'Enterprise vendor settlement wire requires dual signature approval per SOX compliance.',
    type: 'PAYMENT',
    priority: 'HIGH',
    status: 'AWAITING_APPROVAL',
    createdById: 'usr-member-payments',
    assigneeId: 'usr-member-payments',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-member-payments', fullName: 'Mike Ross (Payments Member)', email: 'member.payments@newtonite.io' },
    assignee: { id: 'usr-member-payments', fullName: 'Mike Ross (Payments Member)', email: 'member.payments@newtonite.io' },
  },
  {
    id: 'item-pay-8',
    teamId: 'team-payments',
    title: 'Apple Pay Token Decryption Error on iOS 18 Safari',
    description: 'Customers on iOS 18 report payment failures with error PKPaymentErrorTypeUnknown.',
    type: 'CUSTOMER_ISSUE',
    priority: 'MEDIUM',
    status: 'OPEN',
    createdById: 'usr-member-payments',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-member-payments', fullName: 'Mike Ross (Payments Member)', email: 'member.payments@newtonite.io' },
  },
  {
    id: 'item-pay-9',
    teamId: 'team-payments',
    title: 'Implement ISO 20022 XML Payment Messaging Standard',
    description: 'Completed transition from legacy MT103 Swift messaging to pacs.008 schema.',
    type: 'TASK',
    priority: 'LOW',
    status: 'CLOSED',
    createdById: 'usr-lead-payments',
    assigneeId: 'usr-member-payments',
    version: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-lead-payments', fullName: 'Rachel Zane (Payments Lead)', email: 'lead.payments@newtonite.io' },
    assignee: { id: 'usr-member-payments', fullName: 'Mike Ross (Payments Member)', email: 'member.payments@newtonite.io' },
  },
  {
    id: 'item-pay-10',
    teamId: 'team-payments',
    title: 'Negative Balance Cascade on Overdrawn Wallet Accounts',
    description: 'Race condition in ledger balance debit check during simultaneous ATM and POS transactions.',
    type: 'PAYMENT',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    createdById: 'usr-admin',
    assigneeId: 'usr-lead-payments',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
    assignee: { id: 'usr-lead-payments', fullName: 'Rachel Zane (Payments Lead)', email: 'lead.payments@newtonite.io' },
  },
  {
    id: 'item-pay-11',
    teamId: 'team-payments',
    title: '3D Secure 2.0 Challenge Failures on UK Cards',
    description: 'Resolved by updating 3DS SDK to version 2.2.0 supporting biometric challenge flows.',
    type: 'CUSTOMER_ISSUE',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    createdById: 'usr-member-payments',
    assigneeId: 'usr-lead-payments',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-member-payments', fullName: 'Mike Ross (Payments Member)', email: 'member.payments@newtonite.io' },
    assignee: { id: 'usr-lead-payments', fullName: 'Rachel Zane (Payments Lead)', email: 'lead.payments@newtonite.io' },
  },
  {
    id: 'item-pay-12',
    teamId: 'team-payments',
    title: 'Annual PCI-DSS Level 1 Attestation of Compliance (AoC)',
    description: 'QSA completed on-site assessment. Clean Attestation of Compliance received.',
    type: 'TASK',
    priority: 'LOW',
    status: 'CLOSED',
    createdById: 'usr-admin',
    assigneeId: 'usr-admin',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    team: { id: 'team-payments', name: 'Payments & Settlement', slug: 'payments' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
    assignee: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
  },

  // ==================== 3. PLATFORM & INFRA TEAM (10 Items) ====================
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
    id: 'item-inf-2',
    teamId: 'team-infra',
    title: '🚨 Kubernetes Control Plane etcd Latency Degradation in us-central1',
    description: 'etcd leader election flapping due to disk I/O throttles on root persistent disk. Pod schedules delayed.',
    type: 'INCIDENT',
    priority: 'URGENT',
    status: 'OPEN',
    createdById: 'usr-lead-infra',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-lead-infra', fullName: 'Gordon Freeman (Infra Lead)', email: 'lead.infra@newtonite.io' },
  },
  {
    id: 'item-inf-3',
    teamId: 'team-infra',
    title: 'Scale Production Kafka Broker Cluster from 6 to 12 Nodes',
    description: 'Traffic projection requires double partition capacity. Partition reassignment plan drafted; awaiting Lead sign-off.',
    type: 'TASK',
    priority: 'HIGH',
    status: 'AWAITING_APPROVAL',
    createdById: 'usr-member-infra',
    assigneeId: 'usr-member-infra',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-member-infra', fullName: 'Alyx Vance (Infra Member)', email: 'member.infra@newtonite.io' },
    assignee: { id: 'usr-member-infra', fullName: 'Alyx Vance (Infra Member)', email: 'member.infra@newtonite.io' },
  },
  {
    id: 'item-inf-4',
    teamId: 'team-infra',
    title: 'Upgrade Redis Cluster to Version 7.2 with In-Memory TLS',
    description: 'Rolling update of caching layer across 24 shards with zero downtime.',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdById: 'usr-lead-infra',
    assigneeId: 'usr-lead-infra',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-lead-infra', fullName: 'Gordon Freeman (Infra Lead)', email: 'lead.infra@newtonite.io' },
    assignee: { id: 'usr-lead-infra', fullName: 'Gordon Freeman (Infra Lead)', email: 'lead.infra@newtonite.io' },
  },
  {
    id: 'item-inf-5',
    teamId: 'team-infra',
    title: 'Deprecate Ubuntu 20.04 Golden AMI Images in Favor of Alpine/Debian 12',
    description: 'All base container images migrated to distroless images, reducing vulnerability footprint by 82%.',
    type: 'TASK',
    priority: 'LOW',
    status: 'RESOLVED',
    createdById: 'usr-lead-infra',
    assigneeId: 'usr-member-infra',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 350).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-lead-infra', fullName: 'Gordon Freeman (Infra Lead)', email: 'lead.infra@newtonite.io' },
    assignee: { id: 'usr-member-infra', fullName: 'Alyx Vance (Infra Member)', email: 'member.infra@newtonite.io' },
  },
  {
    id: 'item-inf-6',
    teamId: 'team-infra',
    title: 'Cross-Region VPC Peering Packet Loss (ap-south-1 to us-east-1)',
    description: 'Inter-region transit gateway observing 18% packet drop. Latency spiked to 260ms.',
    type: 'INCIDENT',
    priority: 'URGENT',
    status: 'OPEN',
    createdById: 'usr-admin',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
  },
  {
    id: 'item-inf-7',
    teamId: 'team-infra',
    title: 'Prometheus Long-Term Storage Migration to Cortex/Thanos',
    description: 'Historical metrics retention strategy to offload local SSDs to S3 cold storage.',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'AWAITING_APPROVAL',
    createdById: 'usr-aryan',
    assigneeId: 'usr-aryan',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-aryan', fullName: 'Aryan Duve', email: 'aryandubey825@gmail.com' },
    assignee: { id: 'usr-aryan', fullName: 'Aryan Duve', email: 'aryandubey825@gmail.com' },
  },
  {
    id: 'item-inf-8',
    teamId: 'team-infra',
    title: 'Ingress Nginx OOMKilled Under High WebSocket Load',
    description: 'Memory limit bumped from 2Gi to 8Gi and worker connection limits tuned.',
    type: 'INCIDENT',
    priority: 'HIGH',
    status: 'RESOLVED',
    createdById: 'usr-lead-infra',
    assigneeId: 'usr-lead-infra',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-lead-infra', fullName: 'Gordon Freeman (Infra Lead)', email: 'lead.infra@newtonite.io' },
    assignee: { id: 'usr-lead-infra', fullName: 'Gordon Freeman (Infra Lead)', email: 'lead.infra@newtonite.io' },
  },
  {
    id: 'item-inf-9',
    teamId: 'team-infra',
    title: 'Terraform State Backend Lock Resolution on S3 DynamoDB',
    description: 'Cleaned up orphaned lock after failed CI pipeline run.',
    type: 'TASK',
    priority: 'LOW',
    status: 'CLOSED',
    createdById: 'usr-member-infra',
    assigneeId: 'usr-member-infra',
    version: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-member-infra', fullName: 'Alyx Vance (Infra Member)', email: 'member.infra@newtonite.io' },
    assignee: { id: 'usr-member-infra', fullName: 'Alyx Vance (Infra Member)', email: 'member.infra@newtonite.io' },
  },
  {
    id: 'item-inf-10',
    teamId: 'team-infra',
    title: 'Implement Distributed Tracing with OpenTelemetry and Jaeger',
    description: 'Trace context propagation configured across all HTTP and gRPC service boundaries.',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'CLOSED',
    createdById: 'usr-admin',
    assigneeId: 'usr-lead-infra',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    team: { id: 'team-infra', name: 'Platform & Infrastructure', slug: 'infra' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
    assignee: { id: 'usr-lead-infra', fullName: 'Gordon Freeman (Infra Lead)', email: 'lead.infra@newtonite.io' },
  },

  // ==================== 4. TRUST & COMPLIANCE TEAM (9 Items) ====================
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
  {
    id: 'item-cmp-2',
    teamId: 'team-compliance',
    title: 'GDPR Article 17 "Right to be Forgotten" Data Erasure Pipeline',
    description: 'User deletion request for 42 EU customer accounts. Crypto-shredding keys generated; awaiting legal Lead sign-off.',
    type: 'COMPLIANCE',
    priority: 'HIGH',
    status: 'AWAITING_APPROVAL',
    createdById: 'usr-member-compliance',
    assigneeId: 'usr-member-compliance',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-member-compliance', fullName: 'Harvey Specter (Compliance Member)', email: 'member.compliance@newtonite.io' },
    assignee: { id: 'usr-member-compliance', fullName: 'Harvey Specter (Compliance Member)', email: 'member.compliance@newtonite.io' },
  },
  {
    id: 'item-cmp-3',
    teamId: 'team-compliance',
    title: '🚨 FinCEN Suspicious Activity Report (SAR) Filing Deadline',
    description: '30-day statutory clock expires in 48 hours for structuring transaction pattern flagged by AML rules.',
    type: 'COMPLIANCE',
    priority: 'URGENT',
    status: 'OPEN',
    createdById: 'usr-lead-compliance',
    assigneeId: null,
    version: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-lead-compliance', fullName: 'Donna Paulsen (Compliance Lead)', email: 'lead.compliance@newtonite.io' },
  },
  {
    id: 'item-cmp-4',
    teamId: 'team-compliance',
    title: 'Vendor Risk Assessment for Third-Party AI Inference API',
    description: 'Evaluating data sovereignty, model prompt retention, and zero-data retention agreements with vendor.',
    type: 'COMPLIANCE',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdById: 'usr-lead-compliance',
    assigneeId: 'usr-member-compliance',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-lead-compliance', fullName: 'Donna Paulsen (Compliance Lead)', email: 'lead.compliance@newtonite.io' },
    assignee: { id: 'usr-member-compliance', fullName: 'Harvey Specter (Compliance Member)', email: 'member.compliance@newtonite.io' },
  },
  {
    id: 'item-cmp-5',
    teamId: 'team-compliance',
    title: 'KYC Verification Anomaly Spike on High-Risk Passports',
    description: 'Biometric face-match threshold failing on new biometric microchip passports.',
    type: 'CUSTOMER_ISSUE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdById: 'usr-admin',
    assigneeId: 'usr-lead-compliance',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 135).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
    assignee: { id: 'usr-lead-compliance', fullName: 'Donna Paulsen (Compliance Lead)', email: 'lead.compliance@newtonite.io' },
  },
  {
    id: 'item-cmp-6',
    teamId: 'team-compliance',
    title: 'Quarterly Employee Access Rights Certification',
    description: 'Managers verified and re-certified role assignments for all 340 active employees.',
    type: 'TASK',
    priority: 'LOW',
    status: 'RESOLVED',
    createdById: 'usr-lead-compliance',
    assigneeId: 'usr-lead-compliance',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-lead-compliance', fullName: 'Donna Paulsen (Compliance Lead)', email: 'lead.compliance@newtonite.io' },
    assignee: { id: 'usr-lead-compliance', fullName: 'Donna Paulsen (Compliance Lead)', email: 'lead.compliance@newtonite.io' },
  },
  {
    id: 'item-cmp-7',
    teamId: 'team-compliance',
    title: 'CCPA Consumer Privacy Disclosure Notice Update',
    description: 'Annual California Consumer Privacy Act privacy policy updates ready for publication.',
    type: 'COMPLIANCE',
    priority: 'MEDIUM',
    status: 'AWAITING_APPROVAL',
    createdById: 'usr-member-compliance',
    assigneeId: 'usr-member-compliance',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-member-compliance', fullName: 'Harvey Specter (Compliance Member)', email: 'member.compliance@newtonite.io' },
    assignee: { id: 'usr-member-compliance', fullName: 'Harvey Specter (Compliance Member)', email: 'member.compliance@newtonite.io' },
  },
  {
    id: 'item-cmp-8',
    teamId: 'team-compliance',
    title: 'Data Protection Officer (DPO) Annual Regulatory Audit',
    description: 'Annual DPO comprehensive report submitted to Data Protection Commission with no critical findings.',
    type: 'TASK',
    priority: 'LOW',
    status: 'CLOSED',
    createdById: 'usr-lead-compliance',
    assigneeId: 'usr-lead-compliance',
    version: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-lead-compliance', fullName: 'Donna Paulsen (Compliance Lead)', email: 'lead.compliance@newtonite.io' },
    assignee: { id: 'usr-lead-compliance', fullName: 'Donna Paulsen (Compliance Lead)', email: 'lead.compliance@newtonite.io' },
  },
  {
    id: 'item-cmp-9',
    teamId: 'team-compliance',
    title: 'Cardholder Data Environment (CDE) Boundary Network Pentest',
    description: 'External penetration test confirmed zero data leakage across network isolation boundaries.',
    type: 'COMPLIANCE',
    priority: 'HIGH',
    status: 'CLOSED',
    createdById: 'usr-admin',
    assigneeId: 'usr-admin',
    version: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    team: { id: 'team-compliance', name: 'Trust & Compliance', slug: 'compliance' },
    createdBy: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
    assignee: { id: 'usr-admin', fullName: 'Alex Mercer (Global Admin)', email: 'admin@newtonite.io' },
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
    {
      id: 'mem-aryan-secops',
      userId: 'usr-aryan',
      teamId: 'team-secops',
      role: 'ADMIN',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[10],
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
    {
      id: 'mem-aryan-payments',
      userId: 'usr-aryan',
      teamId: 'team-payments',
      role: 'ADMIN',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[10],
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
    {
      id: 'mem-aryan-infra',
      userId: 'usr-aryan',
      teamId: 'team-infra',
      role: 'ADMIN',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[10],
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
    {
      id: 'mem-aryan-compliance',
      userId: 'usr-aryan',
      teamId: 'team-compliance',
      role: 'ADMIN',
      createdAt: '2026-10-18T00:00:00.000Z',
      user: DEMO_WORKSPACE_USERS[10],
    },
  ],
};

let teamMembersStore: Record<string, TeamMember[]> = { ...INITIAL_TEAM_MEMBERS };

export function handleDemoRequest<T = any>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(endpoint, 'http://localhost');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

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
    return {
      token: `demo-jwt-token-${matchedUser.id}`,
      user: matchedUser,
    } as T;
  }

  // 2. Auth: Me
  if (pathname === '/api/auth/me') {
    return { user: currentDemoUser } as T;
  }

  // 2b. Auth: Invite Info
  if (pathname === '/api/auth/invite-info' && method === 'GET') {
    const token = searchParams.get('token') || '';
    let email = 'aryandubey825@gmail.com';
    let fullName = 'Aryan Duve';
    let role: TeamRole = 'MEMBER';
    let team = { id: 'team-secops', name: 'SecOps & Incident Response', slug: 'secops' };
    let inviterName = 'Alex Mercer (Global Admin)';

    if (token && token.includes('.')) {
      try {
        const payloadBase64 = token.split('.')[1];
        const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr = decodeURIComponent(
          atob(normalizedBase64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonStr);
        if (decoded.email) email = decoded.email;
        if (decoded.fullName) fullName = decoded.fullName;
        if (decoded.role) role = decoded.role as TeamRole;
        if (decoded.inviterName) inviterName = decoded.inviterName;
        if (decoded.teamId) {
          const matchedTeam = teamsStore.find((t) => t.id === decoded.teamId);
          if (matchedTeam) {
            team = { id: matchedTeam.id, name: matchedTeam.name, slug: matchedTeam.slug };
          }
        }
      } catch (err) {
        console.warn('Could not decode JWT payload in demo store:', err);
      }
    }

    return {
      email,
      fullName,
      role,
      team,
      inviterName,
    } as T;
  }

  // 2c. Auth: Accept Invite
  if (pathname === '/api/auth/accept-invite' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    let email = 'aryandubey825@gmail.com';
    let fullName = body.fullName || 'Aryan Duve';
    let role: TeamRole = 'MEMBER';
    let teamId = 'team-secops';
    let teamName = 'SecOps & Incident Response';
    let teamSlug = 'secops';

    if (body.token && body.token.includes('.')) {
      try {
        const payloadBase64 = body.token.split('.')[1];
        const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr = decodeURIComponent(
          atob(normalizedBase64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonStr);
        if (decoded.email) email = decoded.email;
        if (decoded.fullName && !body.fullName) fullName = decoded.fullName;
        if (decoded.role) role = decoded.role as TeamRole;
        if (decoded.teamId) {
          const matchedTeam = teamsStore.find((t) => t.id === decoded.teamId);
          if (matchedTeam) {
            teamId = matchedTeam.id;
            teamName = matchedTeam.name;
            teamSlug = matchedTeam.slug;
          }
        }
      } catch (err) {
        console.warn('Could not decode JWT payload in accept-invite demo store:', err);
      }
    }

    const chosenPassword = body.password || '';
    if (chosenPassword.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.');
    }

    const acceptedUser: User = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      memberships: [{ teamId, teamName, teamSlug, role }],
    };
    currentDemoUser = acceptedUser;

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
    const members = teamMembersStore[teamId] || teamMembersStore['team-secops'] || [];
    return { members } as T;
  }

  // 7. Teams: Add Member
  if (teamMembersMatch && method === 'POST') {
    const teamId = teamMembersMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const newMemberId = body.userId || `usr-${Date.now()}`;
    const newMember: WorkspaceUser = {
      id: newMemberId,
      fullName: body.fullName || (body.email ? body.email.split('@')[0] : 'New Member'),
      email: body.email || 'newmember@newtonite.io',
      avatarUrl: undefined,
    };

    if (!DEMO_WORKSPACE_USERS.some((u) => u.id === newMemberId)) {
      DEMO_WORKSPACE_USERS.push(newMember);
    }

    const newMembership: TeamMember = {
      id: `mem-${newMemberId}-${teamId}`,
      userId: newMemberId,
      teamId,
      role: (body.role || 'MEMBER') as TeamRole,
      createdAt: new Date().toISOString(),
      user: newMember,
    };

    if (!teamMembersStore[teamId]) {
      teamMembersStore[teamId] = [];
    }
    teamMembersStore[teamId] = [newMembership, ...teamMembersStore[teamId]];

    const targetTeam = teamsStore.find((t) => t.id === teamId);
    if (targetTeam && targetTeam._count) {
      targetTeam._count.memberships = teamMembersStore[teamId].length;
    }

    return {
      success: true,
      membership: newMembership,
      inviteUrl: `https://newtonite-ops-blue.vercel.app/accept-invite?token=demo-token-${Date.now()}`,
      message: `User "${newMember.fullName}" invited and added to team!`,
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

    const teamBase = teamId ? workItemsStore.filter((i) => i.teamId === teamId) : workItemsStore;
    const allCount = teamBase.length;
    const assignedCount = teamBase.filter((i) => i.assigneeId === currentDemoUser.id && i.status !== 'CLOSED' && i.status !== 'CANCELLED').length;
    const urgentCount = teamBase.filter((i) => !i.assigneeId && i.priority === 'URGENT' && i.status !== 'CLOSED' && i.status !== 'CANCELLED').length;
    const awaitingApprovalCount = teamBase.filter((i) => i.status === 'AWAITING_APPROVAL').length;

    let filtered = [...teamBase];

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

    let itemsForView = filtered;
    if (view === 'assigned_to_me') {
      itemsForView = filtered.filter((i) => i.assigneeId === currentDemoUser.id && i.status !== 'CLOSED' && i.status !== 'CANCELLED');
    } else if (view === 'unassigned_urgent') {
      itemsForView = filtered.filter((i) => !i.assigneeId && i.priority === 'URGENT' && i.status !== 'CLOSED' && i.status !== 'CANCELLED');
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
