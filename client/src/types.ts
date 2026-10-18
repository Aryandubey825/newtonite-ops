export type TeamRole = 'VIEWER' | 'MEMBER' | 'LEAD' | 'ADMIN';

export type WorkItemType = 'INCIDENT' | 'CUSTOMER_ISSUE' | 'PAYMENT' | 'COMPLIANCE' | 'TASK';

export type WorkItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkItemStatus = 'OPEN' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  memberships: {
    teamId: string;
    teamName: string;
    teamSlug: string;
    role: TeamRole;
  }[];
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: {
    workItems: number;
    memberships: number;
  };
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface WorkspaceUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface WorkItem {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  assigneeId?: string | null;
  createdById: string;
  dueDate?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  team?: Team;
  assignee?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  } | null;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  comments?: Comment[];
}

export interface ActivityEvent {
  id: string;
  workItemId: string;
  actorId: string;
  eventType: 'CREATED' | 'STATUS_TRANSITION' | 'ASSIGNED' | 'PRIORITY_CHANGED' | 'DETAILS_UPDATED' | 'COMMENT_ADDED';
  oldState?: any;
  newState?: any;
  metadata?: any;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface Comment {
  id: string;
  workItemId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface WorkItemListResponse {
  items: WorkItem[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
  tabCounts?: {
    all: number;
    assigned_to_me: number;
    unassigned_urgent: number;
    awaiting_approval: number;
  };
}
