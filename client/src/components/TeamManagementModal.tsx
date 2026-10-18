import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Team, TeamMember, WorkspaceUser, TeamRole } from '../types';
import { apiRequest } from '../api/client';
import { RoleBadge } from './Badges';
import {
  X,
  Users,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  UserPlus,
  Check,
  AlertCircle,
  Building,
  Layers,
  Lock,
  ArrowRight,
  RefreshCw,
  Mail,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTeamId?: string | null;
  initialTab?: 'teams' | 'members';
  initialMemberMode?: 'existing' | 'new';
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  initialTeamId,
  initialTab = 'teams',
  initialMemberMode = 'existing',
}) => {
  const { user, teams, refreshTeams, setSelectedTeamId } = useAuth();
  const [activeTab, setActiveTab] = useState<'teams' | 'members'>(initialTab);

  // Selected team for member management
  const [targetTeamId, setTargetTeamId] = useState<string>(
    initialTeamId || (teams[0] ? teams[0].id : '')
  );

  // Data states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlug, setNewTeamSlug] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  // Add Member form state
  const [memberAddMode, setMemberAddMode] = useState<'existing' | 'new'>('new');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamRole>('MEMBER');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Check if current user is an Admin
  const isGlobalAdmin = user?.memberships.some((m) => m.role === 'ADMIN');
  const isTeamAdmin = isGlobalAdmin || user?.memberships.some(
    (m) => m.teamId === targetTeamId && m.role === 'ADMIN'
  );

  // Sync targetTeamId when initialTeamId changes or teams load
  useEffect(() => {
    if (initialTeamId) {
      setTargetTeamId(initialTeamId);
    } else if (!targetTeamId && teams.length > 0) {
      setTargetTeamId(teams[0].id);
    }
  }, [initialTeamId, teams]);

  // Lock body scroll when modal is mounted
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialTab) setActiveTab(initialTab);
      if (initialMemberMode) setMemberAddMode(initialMemberMode);
      loadWorkspaceUsers();
    } else {
      document.body.style.overflow = '';
      setErrorMsg(null);
      setSuccessMsg(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load team members whenever targetTeamId changes
  useEffect(() => {
    if (isOpen && targetTeamId) {
      loadTeamMembers(targetTeamId);
    }
  }, [isOpen, targetTeamId]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadWorkspaceUsers = async () => {
    try {
      const res = await apiRequest<{ users: WorkspaceUser[] }>('/api/teams/users/all');
      setWorkspaceUsers(res.users);
      if (res.users.length > 0 && !selectedUserId) {
        setSelectedUserId(res.users[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load workspace users', err);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    setIsLoadingMembers(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ members: TeamMember[] }>(`/api/teams/${teamId}/members`);
      setTeamMembers(res.members);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch team members.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Handler for creating a new team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setErrorMsg('Team name cannot be empty.');
      return;
    }

    setIsSubmittingTeam(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiRequest<{ team: Team }>('/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: newTeamName.trim(),
          slug: newTeamSlug.trim() || undefined,
          description: newTeamDescription.trim() || undefined,
        }),
      });

      await refreshTeams();
      setSuccessMsg(`Team "${res.team.name}" created successfully! You were assigned as ADMIN.`);
      setNewTeamName('');
      setNewTeamSlug('');
      setNewTeamDescription('');
      setTargetTeamId(res.team.id);
      setSelectedTeamId(res.team.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create team. Ensure you have Admin privileges.');
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  // Handler for adding or updating a team member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeamId) return;

    setIsSubmittingMember(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (memberAddMode === 'new') {
        const email = newMemberEmail.trim();
        const fullName = newMemberName.trim();
        if (!email) {
          setErrorMsg('Please enter a valid email address.');
          setIsSubmittingMember(false);
          return;
        }

        const res = await apiRequest<{ membership: TeamMember; inviteUrl?: string }>(`/api/teams/${targetTeamId}/members`, {
          method: 'POST',
          body: JSON.stringify({
            email,
            fullName: fullName || undefined,
            role: selectedRole,
          }),
        });

        if (res.inviteUrl && email && !email.endsWith('@newtonite.io')) {
          try {
            await fetch('/api/send-invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email,
                fullName: fullName || email.split('@')[0],
                teamName: currentTeam?.name || 'Operational Team',
                role: selectedRole,
                inviteUrl: res.inviteUrl,
                inviterName: user?.fullName || 'Alex Mercer (Global Admin)',
              }),
            });
          } catch (e) {
            console.warn('[Direct invite dispatch error]:', e);
          }
        }

        await loadTeamMembers(targetTeamId);
        await loadWorkspaceUsers();
        await refreshTeams();
        if (res.inviteUrl) {
          setLastInviteUrl(res.inviteUrl);
        }
        const userName = res.membership?.user?.fullName || fullName || email;
        const userEmail = res.membership?.user?.email || email;
        setSuccessMsg(`User "${userName}" (${userEmail}) invited! Real Gmail dispatched to ${userEmail} (and copied to your inbox).`);
        setErrorMsg(null);
        setNewMemberName('');
        setNewMemberEmail('');
      } else {
        if (!selectedUserId) {
          setErrorMsg('Please select a workspace user.');
          setIsSubmittingMember(false);
          return;
        }

        await apiRequest(`/api/teams/${targetTeamId}/members`, {
          method: 'POST',
          body: JSON.stringify({
            userId: selectedUserId,
            role: selectedRole,
          }),
        });

        await loadTeamMembers(targetTeamId);
        await refreshTeams();
        setSuccessMsg('Team member assigned successfully.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign team member.');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // Handler for changing a member's role inline
  const handleUpdateRole = async (userId: string, newRole: TeamRole) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await apiRequest(`/api/teams/${targetTeamId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      await loadTeamMembers(targetTeamId);
      await refreshTeams();
      setSuccessMsg(`Role updated to ${newRole}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update member role.');
    }
  };

  // Handler for removing a member
  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this team?`)) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await apiRequest(`/api/teams/${targetTeamId}/members/${userId}`, {
        method: 'DELETE',
      });

      await loadTeamMembers(targetTeamId);
      await loadWorkspaceUsers();
      await refreshTeams();
      setSuccessMsg(`Member ${memberName} removed from team.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member.');
    }
  };

  if (!isOpen) return null;

  const currentTeam = teams.find((t) => t.id === targetTeamId) || teams[0];

  // Users not currently in the selected team
  const availableUsers = workspaceUsers.filter(
    (wu) => !teamMembers.some((tm) => tm.userId === wu.id)
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  Team & Workspace Management
                </h2>
                {isGlobalAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Shield className="w-3 h-3 text-blue-600" />
                    Admin Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Read-Only (Non-Admin)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Configure operational dispatch teams, memberships, and role-based permissions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
          <button
            onClick={() => {
              setActiveTab('teams');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'teams'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Teams Directory ({teams.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('members');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Team Members & Roles</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Operation Restricted</p>
              <p className="text-red-600 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'teams' ? (
            <div className="space-y-6">
              {/* Admin Creation Section */}
              {isGlobalAdmin ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Create New Team (Admin Only)
                    </h3>
                  </div>

                  <form onSubmit={handleCreateTeam} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Team Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newTeamName}
                          onChange={(e) => {
                            setNewTeamName(e.target.value);
                            if (!newTeamSlug) {
                              setNewTeamSlug(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, '-')
                                  .replace(/(^-|-$)/g, '')
                              );
                            }
                          }}
                          placeholder="e.g. SRE & Core Infrastructure"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Team Slug (URL Identifier)
                        </label>
                        <input
                          type="text"
                          value={newTeamSlug}
                          onChange={(e) => setNewTeamSlug(e.target.value)}
                          placeholder="e.g. core-infra"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Description / Scope
                      </label>
                      <input
                        type="text"
                        value={newTeamDescription}
                        onChange={(e) => setNewTeamDescription(e.target.value)}
                        placeholder="e.g. Handles distributed cluster failures, database failovers, and latency regressions."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSubmittingTeam}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                      >
                        {isSubmittingTeam ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Create Operational Team</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Admin Provisioning Guard:</span> Only Workspace
                    Administrators have the authority to provision new teams. To test creating a team, switch your
                    demo persona to <strong className="font-semibold text-slate-900">Alex (Global Admin)</strong> via
                    the top-right dropdown.
                  </div>
                </div>
              )}

              {/* Existing Teams Directory */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Active Teams ({teams.length})
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {teams.map((t) => (
                    <div
                      key={t.id}
                      className="border border-slate-200 rounded-lg p-3.5 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{t.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                            {t.slug}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-xl">
                          {t.description || 'No description configured.'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {t._count && (
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mr-2">
                            <span>{t._count.memberships} members</span>
                            <span>•</span>
                            <span>{t._count.workItems} items</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setTargetTeamId(t.id);
                            setActiveTab('members');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                        >
                          <span>Manage Members</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Members & Roles */
            <div className="space-y-6">
              {/* Team Selector & Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-700">Managing Team:</span>
                  <select
                    value={targetTeamId}
                    onChange={(e) => setTargetTeamId(e.target.value)}
                    className="bg-white border border-slate-300 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-slate-500 flex items-center space-x-1">
                  <span>Your Role in this Team:</span>
                  <span className="font-semibold text-blue-600">
                    {user?.memberships.find((m) => m.teamId === targetTeamId)?.role ||
                      (isGlobalAdmin ? 'GLOBAL ADMIN' : 'NON-MEMBER')}
                  </span>
                </div>
              </div>

              {/* Add Member Form (Admin Only) */}
              {isTeamAdmin ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Add Member to {currentTeam?.name} (Admin Only)
                      </h3>
                    </div>

                    {/* Mode Toggle: Existing User vs Invite Brand New User */}
                    <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-md text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setMemberAddMode('existing');
                          setErrorMsg(null);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-all ${
                          memberAddMode === 'existing'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Select Existing User
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMemberAddMode('new');
                          setErrorMsg(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-all ${
                          memberAddMode === 'new'
                            ? 'bg-white text-blue-600 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create / Invite New Person</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleAddMember} className="space-y-3">
                    {memberAddMode === 'new' ? (
                      /* Create & Invite Brand New Person */
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            placeholder="e.g. Alex Morgan"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            placeholder="e.g. alex@example.com"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Assigned Role
                          </label>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="VIEWER">VIEWER</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="LEAD">LEAD</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={isSubmittingMember || !newMemberEmail.trim()}
                            className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                          >
                            {isSubmittingMember ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>Create & Add</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Pick Existing Workspace User */
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Select Workspace User
                          </label>
                          <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          >
                            {availableUsers.length === 0 ? (
                              <option value="">All workspace users are already in this team</option>
                            ) : (
                              availableUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.fullName} ({u.email})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Assigned Role
                          </label>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="VIEWER">VIEWER (Read-Only)</option>
                            <option value="MEMBER">MEMBER (Claim & Work)</option>
                            <option value="LEAD">LEAD (Approvals & Escalate)</option>
                            <option value="ADMIN">ADMIN (Full Team Control)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="submit"
                            disabled={isSubmittingMember || !selectedUserId || availableUsers.length === 0}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                          >
                            {isSubmittingMember ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>Add Member</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </form>

                  {/* Invitation Link & Outbox Notice (Appears directly below the form) */}
                  {lastInviteUrl && (
                    <div className="mt-4 p-3.5 bg-blue-50/90 border border-blue-200 rounded-lg space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>
                            {lastInviteUrl.includes('demo-')
                              ? 'Gmail Invitation Sent & Link Ready'
                              : 'Invitation Email Dispatched via Outbox Worker'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          {lastInviteUrl.includes('demo-') ? 'Email Dispatched' : 'Valid for 7 days'}
                        </span>
                      </div>

                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        {lastInviteUrl.includes('demo-')
                          ? 'Real Gmail Invitation Dispatched! An invitation email has been sent via Vercel Cloud Serverless to the recipient\'s inbox (check inbox/spam). You can also test immediately with "Open Link" below:'
                          : 'An invitation email has been scheduled and dispatched via Gmail SMTP. The member can also click the link below to set their password and enter the workspace:'}
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={lastInviteUrl}
                          className="w-full px-2.5 py-1 text-[11px] font-mono bg-white border border-blue-200 rounded text-slate-700 select-all focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(lastInviteUrl);
                            setCopiedInvite(true);
                            setTimeout(() => setCopiedInvite(false), 2000);
                          }}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-blue-100/60 border border-blue-300 text-blue-700 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          {copiedInvite ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={lastInviteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Link</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-800">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Read-Only Access:</span> Modifying roles or adding
                    members requires <strong className="font-semibold text-slate-900">ADMIN</strong> role in this
                    team. Switch persona to Alex (Global Admin) or team lead to test role assignments.
                  </div>
                </div>
              )}

              {/* Members Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Current Members ({teamMembers.length})
                  </h3>
                  {isLoadingMembers && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      refreshing...
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Joined</th>
                        {isTeamAdmin && <th className="py-2.5 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {teamMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                                {m.user?.avatarUrl ? (
                                  <img
                                    src={m.user.avatarUrl}
                                    alt={m.user?.fullName || 'User'}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  (m.user?.fullName || 'U').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                                  <span>{m.user?.fullName || 'Workspace Member'}</span>
                                  {m.userId === user?.id && (
                                    <span className="text-[10px] font-normal text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                      you
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500">{m.user?.email || ''}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {isTeamAdmin ? (
                              <select
                                value={m.role}
                                onChange={(e) => handleUpdateRole(m.userId, e.target.value as TeamRole)}
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                              >
                                <option value="VIEWER">VIEWER</option>
                                <option value="MEMBER">MEMBER</option>
                                <option value="LEAD">LEAD</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            ) : (
                              <RoleBadge role={m.role} />
                            )}
                          </td>

                          <td className="py-3 px-4 text-[11px] text-slate-500">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </td>

                          {isTeamAdmin && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleRemoveMember(m.userId, m.user.fullName)}
                                title="Remove from team"
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}

                      {teamMembers.length === 0 && !isLoadingMembers && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                            No members assigned to this team yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Enforced server-side via Newtonite RBAC policies.
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
