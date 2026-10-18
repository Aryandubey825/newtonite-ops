import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { WorkItem, WorkItemListResponse } from '../types';
import { PriorityBadge, StatusBadge, TypeBadge, VersionBadge } from './Badges';
import { WorkItemModal } from './WorkItemModal';
import { WorkItemDetailModal } from './WorkItemDetailModal';
import {
  Search,
  Plus,
  AlertCircle,
  Inbox,
  Clock,
  UserCheck,
  ChevronRight,
  Layers,
  ArrowDownCircle,
} from 'lucide-react';

type DashboardViewType = 'all' | 'assigned_to_me' | 'unassigned_urgent' | 'awaiting_approval';

export const DashboardView: React.FC = () => {
  const { selectedTeamId } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardViewType>('all');
  const [items, setItems] = useState<WorkItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState<{
    all: number;
    assigned_to_me: number;
    unassigned_urgent: number;
    awaiting_approval: number;
  } | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const fetchItems = async (cursorToUse?: string | null, append = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTeamId) params.set('teamId', selectedTeamId);
      if (activeTab !== 'all') params.set('view', activeTab);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (search.trim()) params.set('search', search.trim());
      if (cursorToUse) params.set('cursor', cursorToUse);
      params.set('limit', '25');

      const res = await apiRequest<WorkItemListResponse>(`/api/items?${params.toString()}`);

      if (append) {
        setItems((prev) => [...prev, ...res.items]);
      } else {
        setItems(res.items);
      }
      setTotalCount(res.totalCount);
      if (res.tabCounts) {
        setTabCounts(res.tabCounts);
      }
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(null, false);
  }, [selectedTeamId, activeTab, statusFilter, priorityFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(null, false);
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoading) {
      fetchItems(nextCursor, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* View Switcher Tabs + Action Button (Plane Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>All Items</span>
            <span className="font-mono text-[11px] text-slate-500">
              ({tabCounts ? tabCounts.all : totalCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('assigned_to_me')}
            className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
              activeTab === 'assigned_to_me'
                ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Assigned to Me</span>
            <span className="font-mono text-[11px] text-slate-500">
              ({tabCounts ? tabCounts.assigned_to_me : 0})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unassigned_urgent')}
            className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
              activeTab === 'unassigned_urgent'
                ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Unassigned Urgent</span>
            <span className="font-mono text-[11px] text-slate-500">
              ({tabCounts ? tabCounts.unassigned_urgent : 0})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('awaiting_approval')}
            className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
              activeTab === 'awaiting_approval'
                ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting My Approval</span>
            <span className="font-mono text-[11px] text-slate-500">
              ({tabCounts ? tabCounts.awaiting_approval : 0})
            </span>
          </button>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>New Work Item</span>
        </button>
      </div>

      {/* Filter and Search Bar (Plane / Linear Style) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search work items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white hover:bg-slate-50/60 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="AWAITING_APPROVAL">Awaiting Approval</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-sm"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-sm"
          >
            <option value="">All Types</option>
            <option value="INCIDENT">Incident</option>
            <option value="CUSTOMER_ISSUE">Customer Issue</option>
            <option value="PAYMENT">Payment</option>
            <option value="COMPLIANCE">Compliance</option>
            <option value="TASK">Task</option>
          </select>
        </div>
      </div>

      {/* Items List (Billow Floating Cards Stack) */}
      <div className={`space-y-2.5 min-h-[520px] transition-opacity duration-150 ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
        {isLoading && items.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-200/80 shadow-billow-card min-h-[300px]">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Loading telemetry feed...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2 border border-slate-200/80 shadow-billow-card">
            <Inbox className="w-10 h-10 text-slate-300 mb-1" />
            <span className="font-bold text-slate-700">No operational items found</span>
            <span className="text-slate-400">Try adjusting your filters or search terms.</span>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className="bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-blue-300/80 rounded-2xl p-4 shadow-billow-card hover:shadow-billow-card-hover transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-start space-x-3.5 max-w-3xl">
                <div className="pt-0.5">
                  <PriorityBadge priority={item.priority} />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </span>
                    <VersionBadge version={item.version} />
                    <TypeBadge type={item.type} />
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                    <span>
                      Team: <strong className="text-slate-700">{item.team?.name || 'Assigned'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Assignee:{' '}
                      <strong className={item.assignee ? 'text-slate-800' : 'text-amber-600 font-semibold'}>
                        {item.assignee ? item.assignee.fullName : 'Unassigned'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <StatusBadge status={item.status} />
                <div className="w-6 h-6 rounded-md group-hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Cursor Pagination Load More */}
        {hasMore && (
          <div className="pt-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-md text-xs shadow-sm hover:border-slate-300 active:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <ArrowDownCircle className={`w-3.5 h-3.5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Seeking next cursor...' : 'Load Next Batch (25+)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <WorkItemModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => fetchItems(null, false)}
      />

      <WorkItemDetailModal
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onUpdated={() => fetchItems(null, false)}
      />

    </div>
  );
};
