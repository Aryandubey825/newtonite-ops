import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  User,
  Edit3,
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
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
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

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto transition-all"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              #{item?.id.slice(0, 8)}
            </span>
            {item && <VersionBadge version={item.version} />}
            {item && <TypeBadge type={item.type} />}
            {item && <PriorityBadge priority={item.priority} />}
            {item && <StatusBadge status={item.status} />}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conflict / Rejection Alert Banner */}
        {conflictMessage && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <div className="flex-1 font-medium">{conflictMessage}</div>
            <button
              onClick={() => fetchItemAndActivity(itemId)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium shadow-sm transition"
            >
              Reload Latest State
            </button>
          </div>
        )}

        {/* Action Error Alert Banner */}
        {actionError && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <div className="flex-1 font-medium">{actionError}</div>
          </div>
        )}

        {/* Content Body */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-medium">Loading telemetry details...</div>
        ) : item ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Quick Action Toolbar */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-2 text-xs">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 font-medium">Assignee:</span>
                <span className="font-semibold text-slate-800">
                  {item.assignee ? item.assignee.fullName : 'Unassigned (Open)'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Claim Button */}
                {isClaimable && (
                  <button
                    onClick={handleClaim}
                    disabled={isActionLoading}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
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
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
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
                      className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-md text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                    <button
                      onClick={() => handleTransition('RESOLVED', approvalComment)}
                      disabled={isActionLoading}
                      title="Only Team Leads or Admins can pass this gate"
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
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
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white rounded-md text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Close Work Item</span>
                  </button>
                )}

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium border border-slate-200 shadow-sm transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs (Plane Style) */}
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 flex space-x-1 text-xs">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === 'details'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                    : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Work Item Details
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-1.5 rounded-md text-xs flex items-center justify-center space-x-1.5 transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                    : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Audit Timeline ({activities.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-1.5 rounded-md text-xs flex items-center justify-center space-x-1.5 transition-colors ${
                  activeTab === 'comments'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm border border-slate-200/60'
                    : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Discussion ({item.comments?.length || 0})</span>
              </button>
            </div>

            {/* Tab 1: Details / Edit Form */}
            {activeTab === 'details' && (
              <div>
                {isEditing ? (
                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/60 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-1.5 text-xs text-slate-800 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as WorkItemPriority)}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-1.5 text-xs text-slate-800 transition-colors"
                      >
                        <option value="URGENT">Urgent</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/60 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-xs text-slate-800 transition-colors resize-none"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="submit"
                        disabled={isActionLoading}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors"
                      >
                        {isActionLoading ? 'Saving...' : `Save (OCC v${item.version})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium border border-slate-200 shadow-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Reported by <strong className="text-slate-700">{item.createdBy?.fullName || 'Operator'}</strong> on{' '}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Operational Description
                      </h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {item.description || 'No operational description provided.'}
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
                  <div className="text-xs text-slate-400 py-6 text-center">No audit trail records yet.</div>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start space-x-3.5 p-3.5 bg-slate-50/60 border border-slate-200/70 rounded-2xl text-xs shadow-sm hover:shadow transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                        {act.actor.fullName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{act.actor.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(act.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Action: <span className="text-blue-600 font-mono font-bold">{act.eventType}</span>
                        </div>
                        {act.oldState && act.newState && (
                          <div className="mt-2 p-2.5 bg-white border border-slate-200/80 rounded-xl font-mono text-[11px] text-slate-700 flex items-center space-x-2 shadow-inner">
                            <span className="text-rose-600 line-through">
                              {JSON.stringify(act.oldState)}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-emerald-600 font-semibold">
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
                    className="flex-1 bg-white hover:bg-slate-50/60 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-1.5 text-xs text-slate-800 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-xs font-medium shadow-sm flex items-center space-x-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>

                <div className="space-y-2.5">
                  {item.comments && item.comments.length > 0 ? (
                    item.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{c.author.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-6">No comments posted yet.</div>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : null}

      </div>
    </div>,
    document.body
  );
};
