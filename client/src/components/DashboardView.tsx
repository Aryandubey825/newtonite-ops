import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { WorkItem, WorkItemListResponse } from '../types';
import { PriorityBadge, StatusBadge, TypeBadge, VersionBadge } from './Badges';
import { WorkItemModal } from './WorkItemModal';
import { WorkItemDetailModal } from './WorkItemDetailModal';
import {
  Search,
  Filter,
  Plus,
  AlertCircle,
  Inbox,
  Clock,
  UserCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';

type DashboardViewType = 'all' | 'assigned_to_me' | 'unassigned_urgent' | 'awaiting_approval';

export const DashboardView: React.FC = () => {
  const { selectedTeamId } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardViewType>('all');
  const [items, setItems] = useState<WorkItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner / Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <span>Operational Dispatch Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {totalCount} total items
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tenant work items with atomic concurrency, OCC, and server-side RBAC.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Item</span>
        </button>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-4 h-4 text-slate-400" />
          <span>All Items</span>
        </button>

        <button
          onClick={() => setActiveTab('assigned_to_me')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'assigned_to_me'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <UserCheck className="w-4 h-4 text-indigo-400" />
          <span>Assigned to Me</span>
        </button>

        <button
          onClick={() => setActiveTab('unassigned_urgent')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'unassigned_urgent'
              ? 'bg-red-600 text-white shadow animate-pulse'
              : 'text-red-400 hover:text-red-300 hover:bg-red-950/30'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>Unassigned Urgent</span>
        </button>

        <button
          onClick={() => setActiveTab('awaiting_approval')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'awaiting_approval'
              ? 'bg-amber-600 text-white shadow'
              : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Awaiting My Approval</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search items by title or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
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
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
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
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
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

      {/* Items Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading && items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <span>Loading telemetry feed...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-x-2">
            <Inbox className="w-8 h-8 text-slate-600 mb-2" />
            <span>No work items matched the active filters.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="p-4 hover:bg-slate-800/50 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-start space-x-3 max-w-3xl">
                  <div className="pt-0.5">
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition">
                        {item.title}
                      </span>
                      <VersionBadge version={item.version} />
                      <TypeBadge type={item.type} />
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                      <span>Team: <strong className="text-slate-300">{item.team?.name || 'Assigned'}</strong></span>
                      <span>•</span>
                      <span>
                        Assignee:{' '}
                        <strong className={item.assignee ? 'text-slate-200' : 'text-amber-400 font-mono'}>
                          {item.assignee ? item.assignee.fullName : 'Unassigned'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <StatusBadge status={item.status} />
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cursor Pagination Load More */}
        {hasMore && (
          <div className="p-4 bg-slate-950/40 border-t border-slate-800 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Seeking next cursor...' : 'Load Next Cursor Batch (25+)'}
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
