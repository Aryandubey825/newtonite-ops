import React from 'react';
import { WorkItemPriority, WorkItemStatus, WorkItemType, TeamRole } from '../types';
import {
  SignalLow,
  SignalMedium,
  SignalHigh,
  AlertOctagon,
  Circle,
  CircleDot,
  Clock,
  CheckCircle2,
  CircleCheckBig,
  CircleSlash,
} from 'lucide-react';

export const PriorityBadge: React.FC<{ priority: WorkItemPriority }> = ({ priority }) => {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-rose-50 border border-rose-200 text-rose-700">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 stroke-[2.2]" />
          <span>Urgent</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 shadow-none">
          <SignalHigh className="w-3.5 h-3.5 text-amber-600 stroke-[2.2]" />
          <span>High</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 shadow-none">
          <SignalMedium className="w-3.5 h-3.5 text-blue-600 stroke-[2.2]" />
          <span>Medium</span>
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-600 shadow-none">
          <SignalLow className="w-3.5 h-3.5 text-slate-500 stroke-[2.2]" />
          <span>Low</span>
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: WorkItemStatus }> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700">
          <Circle className="w-3 h-3 text-sky-500 stroke-[2.5]" />
          <span>Open</span>
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-amber-50/70 border border-amber-200/80 text-amber-800">
          <CircleDot className="w-3 h-3 text-amber-600 stroke-[2.5]" />
          <span>In Progress</span>
        </span>
      );
    case 'AWAITING_APPROVAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-indigo-50/70 border border-indigo-200/80 text-indigo-800">
          <Clock className="w-3 h-3 text-indigo-600 stroke-[2.2]" />
          <span>Awaiting Approval</span>
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-50/70 border border-emerald-200/80 text-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.2]" />
          <span>Resolved</span>
        </span>
      );
    case 'CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-slate-50 border border-slate-200 text-slate-600">
          <CircleCheckBig className="w-3 h-3 text-slate-400 stroke-[2.2]" />
          <span>Closed</span>
        </span>
      );
    case 'CANCELLED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-slate-50 border border-slate-200 text-slate-600">
          <CircleSlash className="w-3 h-3 text-rose-500 stroke-[2.2]" />
          <span>Cancelled</span>
        </span>
      );
  }
};

export const TypeBadge: React.FC<{ type: WorkItemType }> = ({ type }) => {
  const typeLabels: Record<WorkItemType, string> = {
    INCIDENT: 'Incident',
    CUSTOMER_ISSUE: 'Customer Issue',
    PAYMENT: 'Payment',
    COMPLIANCE: 'Compliance',
    TASK: 'Task',
  };

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-600 border border-slate-200/80">
      {typeLabels[type] || type}
    </span>
  );
};

export const VersionBadge: React.FC<{ version: number }> = ({ version }) => {
  return (
    <span
      title="Optimistic Concurrency Control Version"
      className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono font-medium rounded bg-slate-50 text-slate-500 border border-slate-200/80"
    >
      v{version}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: TeamRole }> = ({ role }) => {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200">
          ADMIN
        </span>
      );
    case 'LEAD':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
          LEAD
        </span>
      );
    case 'MEMBER':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
          MEMBER
        </span>
      );
    case 'VIEWER':
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
          VIEWER
        </span>
      );
  }
};

