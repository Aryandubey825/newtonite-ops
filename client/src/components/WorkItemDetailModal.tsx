import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../api/client';
import { WorkItem, ActivityEvent, WorkItemPriority, WorkItemStatus } from '../types';
import { PriorityBadge, StatusBadge, TypeBadge, VersionBadge } from './Badges';
import {
  X,
  UserCheck,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  History,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  itemId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const WorkItemDetailModal: React.FC<Props> = ({ itemId, onClose, onUpdated }) => {
  const { user } = useAuth();
  const [item, setItem] = useState<WorkItem | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments'>('details');

  // Edit form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<WorkItemPriority>('MEDIUM');
  const [isEditing, setIsEditing] = useState(false);

  // Comment input
  const [commentInput, setCommentInput] = useState('');
  const [approvalComment, setApprovalComment] = useState('');

  // Conflict / Error handling
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchItemAndActivity = async (id: string) => {
    setIsLoading(true);
    try {
      const itemRes = await apiRequest<{ item: WorkItem }>(`/api/items/${id}`);
      setItem(itemRes.item);
      setTitle(itemRes.item.title);
      setDescription(itemRes.item.description || '');
      setPriority(itemRes.item.priority);

      const actRes = await apiRequest<{ activities: ActivityEvent[] }>(`/api/items/${id}/activity`);
      setActivities(actRes.activities);
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch work item');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) {
      setConflictMessage(null);
      setActionError(null);
      setIsEditing(false);
      fetchItemAndActivity(itemId);
    }
  }, [itemId]);

  if (!itemId) return null;

  // Optimistic Claim Handler
  const handleClaim = async () => {
    if (!item || !user) return;
    setIsActionLoading(true);
    setActionError(null);
    setConflictMessage(null);

    // Optimistic UI state update
    const previous = { ...item };
    setItem({
      ...item,
      assigneeId: user.id,
      assignee: { id: user.id, fullName: user.fullName, email: user.email },
      status: 'IN_PROGRESS',
      version: item.version + 1,
    });

    try {
      const res = await apiRequest<{ item: WorkItem }>(`/api/items/${item.id}/claim`, {
        method: 'POST',
      });
      setItem(res.item);
      onUpdated();
      fetchItemAndActivity(item.id);
    } catch (err: any) {
      // Rollback optimistic update
      setItem(previous);

      if (err instanceof ApiError && err.status === 409) {
        setConflictMessage(`Claim Conflict: ${err.message}`);
      } else {
        setActionError(err.message || 'Claim failed');
      }
      fetchItemAndActivity(item.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  // OCC Update Handler (Sends client version)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsActionLoading(true);
    setActionError(null);
    setConflictMessage(null);

    try {
      const res = await apiRequest<{ item: WorkItem }>(`/api/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description: description || undefined,
          priority,
          version: item.version, // Mandatory OCC version check!
        }),
      });

      setItem(res.item);
      setIsEditing(false);
      onUpdated();
      fetchItemAndActivity(item.id);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setConflictMessage(
          `Stale Edit Rejected (409 Conflict): ${err.message}. Current server state has been reloaded.`
        );
        // Refresh to latest server state
        fetchItemAndActivity(item.id);
      } else {
        setActionError(err.message || 'Update failed');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // Workflow Transition Handler
  const handleTransition = async (targetStatus: WorkItemStatus, comment?: string) => {
    if (!item) return;
    setIsActionLoading(true);
    setActionError(null);
    setConflictMessage(null);

    try {
      const res = await apiRequest<{ item: WorkItem }>(`/api/items/${item.id}/transition`, {
        method: 'POST',
        body: JSON.stringify({
          status: targetStatus,
          comment: comment || undefined,
        }),
      });

      setItem(res.item);
      setApprovalComment('');
      onUpdated();
      fetchItemAndActivity(item.id);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        setActionError(`Permission Denied (403): ${err.message}`);
      } else if (err instanceof ApiError && err.status === 422) {
        setActionError(`Invalid Workflow State (422): ${err.message}`);
      } else {
        setActionError(err.message || 'Transition failed');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add Comment Handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !commentInput.trim()) return;

    try {
      await apiRequest(`/api/items/${item.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentInput }),
      });
      setCommentInput('');
      fetchItemAndActivity(item.id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to post comment');
    }
  };

  const isClaimable = item?.status === 'OPEN' && !item.assigneeId;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400">ID: {item?.id.slice(0, 8)}</span>
            {item && <VersionBadge version={item.version} />}
            {item && <TypeBadge type={item.type} />}
            {item && <PriorityBadge priority={item.priority} />}
            {item && <StatusBadge status={item.status} />}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict / Rejection Alert Banner */}
        {conflictMessage && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <div className="flex-1 font-medium">{conflictMessage}</div>
            <button
              onClick={() => fetchItemAndActivity(itemId)}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded text-[11px] font-bold"
            >
              Reload State
            </button>
          </div>
        )}

        {/* Action Error Alert Banner */}
        {actionError && (
          <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <div className="flex-1 font-medium">{actionError}</div>
          </div>
        )}

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading work item telemetry...</div>
        ) : item ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Quick Action Toolbar */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                <span>Assignee: </span>
                <span className="text-slate-200 font-semibold">
                  {item.assignee ? item.assignee.fullName : 'Unassigned'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Claim Button */}
                {isClaimable && (
                  <button
                    onClick={handleClaim}
                    disabled={isActionLoading}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Claim Item</span>
                  </button>
                )}

                {/* Submit for Approval */}
                {item.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleTransition('AWAITING_APPROVAL')}
                    disabled={isActionLoading}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </button>
                )}

                {/* Lead Approval Gate */}
                {item.status === 'AWAITING_APPROVAL' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Approval note..."
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-xs px-2 py-1 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleTransition('RESOLVED', approvalComment)}
                      disabled={isActionLoading}
                      title="Only Team Leads or Admins can pass this gate"
                      className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Resolve (Lead Gate)</span>
                    </button>
                  </div>
                )}

                {/* Close Item */}
                {item.status === 'RESOLVED' && (
                  <button
                    onClick={() => handleTransition('CLOSED')}
                    disabled={isActionLoading}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Close Work Item</span>
                  </button>
                )}

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    Edit Details
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-800 flex space-x-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 transition ${
                  activeTab === 'details'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Work Item Details
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2.5 flex items-center space-x-1.5 transition ${
                  activeTab === 'history'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Timeline ({activities.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-2.5 flex items-center space-x-1.5 transition ${
                  activeTab === 'comments'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments ({item.comments?.length || 0})</span>
              </button>
            </div>

            {/* Tab 1: Details / Edit Form */}
            {activeTab === 'details' && (
              <div>
                {isEditing ? (
                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as WorkItemPriority)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="URGENT">Urgent</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="submit"
                        disabled={isActionLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        {isActionLoading ? 'Saving...' : `Save Changes (OCC v${item.version})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Created by {item.createdBy?.fullName || 'Operator'} on{' '}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Operational Description
                      </h4>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Activity Timeline */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4 text-center">No activity events logged yet.</div>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start space-x-3 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">
                        {act.actor.fullName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{act.actor.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(act.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-slate-400 mt-0.5">
                          Event: <span className="text-emerald-400 font-mono font-medium">{act.eventType}</span>
                        </div>
                        {act.oldState && act.newState && (
                          <div className="mt-1.5 p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300 flex items-center space-x-2">
                            <span className="text-red-400 line-through">
                              {JSON.stringify(act.oldState)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="text-emerald-400">
                              {JSON.stringify(act.newState)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Comments */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add operational notes or post-mortem comment..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Comment</span>
                  </button>
                </form>

                <div className="space-y-3">
                  {item.comments && item.comments.length > 0 ? (
                    item.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{c.author.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-4">No comments posted yet.</div>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : null}

      </div>
    </div>
  );
};
