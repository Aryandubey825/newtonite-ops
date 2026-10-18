import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown,
  Check,
  UserPlus,
  Plus,
  LogOut,
} from 'lucide-react';
import { TeamManagementModal } from './TeamManagementModal';

export const Navbar: React.FC = () => {
  const {
    user,
    teams,
    totalWorkspaceUsers,
    selectedTeamId,
    setSelectedTeamId,
    logout,
  } = useAuth();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'teams' | 'members'>('teams');
  const [modalMemberMode, setModalMemberMode] = useState<'existing' | 'new'>('existing');

  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const activeMembership = user?.memberships.find(
    (m) => (selectedTeamId ? m.teamId === selectedTeamId : true)
  );

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target as Node)
      ) {
        setWorkspaceDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active workspace / team details
  const activeTeam = teams.find((t) => t.id === selectedTeamId);
  const currentWorkspaceName = activeTeam ? activeTeam.name : 'Newtonite Ops';
  const currentInitial = currentWorkspaceName.charAt(0).toUpperCase();
  const currentMemberCount = activeTeam
    ? (activeTeam._count?.memberships ?? 1)
    : (totalWorkspaceUsers || 11);
  const currentRole =
    activeMembership?.role ||
    (user?.memberships.some((m) => m.role === 'ADMIN') ? 'ADMIN' : 'MEMBER');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Left: Plane.so-style Workspace & Team Switcher */}
        <div className="relative" ref={workspaceDropdownRef}>
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 shadow-2xs transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded bg-[#9d2a6a] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {currentInitial}
            </div>
            <span className="text-xs font-semibold text-slate-900 group-hover:text-slate-950 max-w-[200px] truncate">
              {currentWorkspaceName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${
                workspaceDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Plane.so Workspace Dropdown Menu */}
          {workspaceDropdownOpen && (
            <div className="absolute left-0 mt-2 w-[380px] bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
              
              {/* Active Workspace / Team Card */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="w-8 h-8 rounded-md bg-[#9d2a6a] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {currentInitial}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {currentWorkspaceName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {currentRole} • {currentMemberCount}{' '}
                        {currentMemberCount === 1 ? 'Member' : 'Members'}
                      </div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                </div>

                {/* Quick Action Buttons inside Card: Create Team & Invite Members */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    onClick={() => {
                      setModalTab('teams');
                      setIsTeamModalOpen(true);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Create team</span>
                  </button>

                  <button
                    onClick={() => {
                      setModalTab('members');
                      setModalMemberMode('new');
                      setIsTeamModalOpen(true);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Invite members</span>
                  </button>
                </div>
              </div>

              {/* Team Switcher List */}
              <div className="py-1 mt-1 space-y-0.5 max-h-56 overflow-y-auto">
                <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Team / Workspace
                </div>
                <button
                  onClick={() => {
                    setSelectedTeamId(null);
                    setWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between transition-colors ${
                    !selectedTeamId
                      ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200/60'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate font-medium">All Teams ({teams.length})</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-normal">
                      {totalWorkspaceUsers} members
                    </span>
                    {!selectedTeamId && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                </button>

                {teams.map((t) => {
                  const isSelected = selectedTeamId === t.id;
                  const memberCount = t._count?.memberships || 0;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTeamId(t.id);
                        setWorkspaceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-purple-50 text-purple-900 font-semibold border border-purple-200/60'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        <span className="truncate">{t.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-normal">
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* Right: Clean User Profile Menu */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer group"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-[11px] text-white shadow-2xs">
                {user?.fullName.charAt(0) || 'U'}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 group-hover:text-slate-950">
                {user?.fullName || 'User'}
              </div>
              <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold ${
                  currentRole === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : currentRole === 'LEAD'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentRole}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${
                profileDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* User Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-2xs">
                      {user?.fullName.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {user?.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Workspace Role:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    currentRole === 'ADMIN'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : currentRole === 'LEAD'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {currentRole}
                  </span>
                </div>
              </div>

              {/* Team Memberships Summary */}
              {user?.memberships && user.memberships.length > 0 && (
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assigned Teams ({user.memberships.length})
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {user.memberships.map((m) => (
                      <div
                        key={m.teamId}
                        className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-50"
                      >
                        <span className="text-slate-700 truncate">{m.teamName}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign Out Action */}
              <div className="pt-1.5 px-2">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Team & Member Management Modal */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        initialTeamId={selectedTeamId}
        initialTab={modalTab}
        initialMemberMode={modalMemberMode}
      />
    </header>
  );
};
