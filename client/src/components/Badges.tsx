import React from 'react';
import { WorkItemPriority, WorkItemStatus, WorkItemType } from '../types';

export const PriorityBadge: React.FC<{ priority: WorkItemPriority }> = ({ priority }) => {
  const styles: Record<WorkItemPriority, string> = {
    URGENT: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse',
    HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    LOW: 'bg-slate-700/50 text-slate-300 border-slate-600',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-mono font-medium rounded border ${styles[priority]}`}>
      {priority}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: WorkItemStatus }> = ({ status }) => {
  const styles: Record<WorkItemStatus, string> = {
    OPEN: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    IN_PROGRESS: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    AWAITING_APPROVAL: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    RESOLVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CLOSED: 'bg-slate-800 text-slate-400 border-slate-700',
    CANCELLED: 'bg-red-950 text-red-400 border-red-800',
  };

  const labels: Record<WorkItemStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    AWAITING_APPROVAL: 'Awaiting Approval',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    CANCELLED: 'Cancelled',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export const TypeBadge: React.FC<{ type: WorkItemType }> = ({ type }) => {
  const styles: Record<WorkItemType, string> = {
    INCIDENT: 'text-red-400 bg-red-950/40 border-red-800/40',
    CUSTOMER_ISSUE: 'text-sky-400 bg-sky-950/40 border-sky-800/40',
    PAYMENT: 'text-purple-400 bg-purple-950/40 border-purple-800/40',
    COMPLIANCE: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
    TASK: 'text-slate-300 bg-slate-800 border-slate-700',
  };

  return (
    <span className={`px-1.5 py-0.5 text-[11px] font-mono rounded border ${styles[type]}`}>
      {type}
    </span>
  );
};

export const VersionBadge: React.FC<{ version: number }> = ({ version }) => {
  return (
    <span
      title="Optimistic Concurrency Control Version"
      className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700"
    >
      v{version}
    </span>
  );
};
