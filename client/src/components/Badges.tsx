import React from 'react';
import { WorkItemPriority, WorkItemStatus, WorkItemType } from '../types';

export const PriorityBadge: React.FC<{ priority: WorkItemPriority }> = ({ priority }) => {
  const config: Record<WorkItemPriority, { bg: string; text: string; border: string; dot: string; pulse?: boolean }> = {
    URGENT: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200/90',
      dot: 'bg-rose-500',
      pulse: true,
    },
    HIGH: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200/90',
      dot: 'bg-orange-500',
    },
    MEDIUM: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200/90',
      dot: 'bg-amber-500',
    },
    LOW: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const c = config[priority];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shadow-sm ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-ping' : ''}`} />
      <span>{priority}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: WorkItemStatus }> = ({ status }) => {
  const config: Record<WorkItemStatus, { bg: string; text: string; border: string; dot: string; label: string }> = {
    OPEN: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200/80',
      dot: 'bg-sky-500',
      label: 'Open',
    },
    IN_PROGRESS: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200/80',
      dot: 'bg-indigo-500',
      label: 'In Progress',
    },
    AWAITING_APPROVAL: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200/80',
      dot: 'bg-amber-500',
      label: 'Awaiting Approval',
    },
    RESOLVED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
      label: 'Resolved',
    },
    CLOSED: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      label: 'Closed',
    },
    CANCELLED: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-400',
      label: 'Cancelled',
    },
  };

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full border shadow-sm ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span>{c.label}</span>
    </span>
  );
};

export const TypeBadge: React.FC<{ type: WorkItemType }> = ({ type }) => {
  const styles: Record<WorkItemType, string> = {
    INCIDENT: 'text-rose-700 bg-rose-50 border-rose-200',
    CUSTOMER_ISSUE: 'text-blue-700 bg-blue-50 border-blue-200',
    PAYMENT: 'text-purple-700 bg-purple-50 border-purple-200',
    COMPLIANCE: 'text-teal-700 bg-teal-50 border-teal-200',
    TASK: 'text-slate-700 bg-slate-100 border-slate-200',
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-md border ${styles[type]}`}>
      {type}
    </span>
  );
};

export const VersionBadge: React.FC<{ version: number }> = ({ version }) => {
  return (
    <span
      title="Optimistic Concurrency Control Version"
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200"
    >
      v{version}
    </span>
  );
};
