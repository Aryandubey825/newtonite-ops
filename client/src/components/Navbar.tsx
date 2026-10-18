import React, { useState, useRef, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import {
  ChevronDown,
  Check,
  RefreshCw,
  LogIn,
  UserPlus,
  Plus,
  LogOut,
} from 'lucide-react';
import { TeamManagementModal } from './TeamManagementModal';
import { LoginModal } from './LoginModal';
import { WorkspaceUser } from '../types';
import { apiRequest } from '../api/client';

export const Navbar: React.FC = () => {
  const {
    user,
    teams,
    totalWorkspaceUsers,
    selectedTeamId,
    setSelectedTeamId,
    switchDemoUser,
    logout,
    isLoading,
  } = useAuth();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'teams' | 'members'>('teams');
  const [modalMemberMode, setModalMemberMode] = useState<'existing' | 'new'>('existing');
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);

  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const personaDropdownRef = useRef<HTMLDivElement>(null);

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
        personaDropdownRef.current &&
        !personaDropdownRef.current.contains(event.target as Node)
      ) {
        setPersonaDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch workspace users on mount and when persona dropdown opens
  useEffect(() => {
    apiRequest<{ users: WorkspaceUser[] }>('/api/teams/users/all')
      .then((res) => setWorkspaceUsers(res.users))
      .catch(() => {});
  }, [personaDropdownOpen, teams]);

  const customUsers = workspaceUsers.filter(
    (wu) => !DEMO_ACCOUNTS.some((da) => da.email.toLowerCase() === wu.email.toLowerCase())
  );

  // Active workspace / team details
  const activeTeam = teams.find((t) => t.id === selectedTeamId);
  const currentWorkspaceName = activeTeam ? activeTeam.name : 'Newtonite Ops';
  const currentInitial = currentWorkspaceName.charAt(0).toUpperCase();
  const currentMemberCount = activeTeam
    ? (activeTeam._count?.memberships ?? 1)
    : (totalWorkspaceUsers || (workspaceUsers.length > 0 ? workspaceUsers.length : 11));
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
            <div className="absolute left-0 mt-2 w-[390px] bg-[#1c1d22] border border-white/10 rounded-xl shadow-2xl p-2.5 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-100">
              
              {/* Active Workspace / Team Card (Matching Image 1) */}
              <div className="bg-[#262830] border border-white/10 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="w-8 h-8 rounded-md bg-[#9d2a6a] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {currentInitial}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">
                        {currentWorkspaceName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {currentRole} • {currentMemberCount}{' '}
                        {currentMemberCount === 1 ? 'Member' : 'Members'}
                      </div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                </div>

                {/* Quick Action Buttons inside Card: Create Team & Invite Members */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setModalTab('teams');
                      setIsTeamModalOpen(true);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-[#1e2025] hover:bg-[#32353f] hover:text-white border border-white/10 rounded-lg transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                    <span>Create team</span>
                  </button>

                  <button
                    onClick={() => {
                      setModalTab('members');
                      setModalMemberMode('new');
                      setIsTeamModalOpen(true);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-[#1e2025] hover:bg-[#32353f] hover:text-white border border-white/10 rounded-lg transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                    <span>Invite members</span>
                  </button>
                </div>
              </div>

              {/* Team Switcher List */}
              <div className="py-1 space-y-0.5 max-h-48 overflow-y-auto">
                <div className="px-2 pt-1.5 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Team / Workspace
                </div>
                <button
                  onClick={() => {
                    setSelectedTeamId(null);
                    setWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between transition-colors ${
                    !selectedTeamId
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">All Teams ({teams.length})</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-normal">
                      {totalWorkspaceUsers} members
                    </span>
                    {!selectedTeamId && <Check className="w-3.5 h-3.5 text-blue-400" />}
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
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-slate-300 hover:bg-white/5'
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
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sign Out Action */}
              <div className="pt-1.5 border-t border-white/10">
                <button
                  onClick={() => {
                    logout();
                    setWorkspaceDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign out</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Right: 1-Click Role & Persona Switcher */}
        <div className="relative" ref={personaDropdownRef}>
          <button
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] text-white">
              {user?.fullName.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{user?.fullName || 'User'}</div>
              <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                <span className="font-medium text-blue-600">
                  {activeMembership?.role || 'OPERATOR'}
                </span>
                <span>• Switch Role</span>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Persona Switcher Dropdown */}
          {personaDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Switch Demo Persona</span>
                <span className="flex items-center text-slate-400 gap-1 font-normal lowercase text-[10px]">
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  instant RBAC test
                </span>
              </div>

              <div className="p-1.5 space-y-1">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isActive = user?.email.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <button
                      key={acc.email}
                      onClick={() => {
                        switchDemoUser(acc.email);
                        setPersonaDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200 text-blue-900 font-medium'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {acc.label.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-1.5">
                            <span>{acc.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <div className="text-[10px] text-slate-500">{acc.team}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                          acc.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : acc.role === 'LEAD'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : acc.role === 'MEMBER'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {acc.role}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom / Registered Workspace Users */}
              {customUsers.length > 0 && (
                <div className="p-1.5 pt-1 border-t border-slate-100 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Custom Workspace Users ({customUsers.length})
                  </div>
                  {customUsers.map((u) => {
                    const isActive = user?.email.toLowerCase() === u.email.toLowerCase();
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchDemoUser(u.email);
                          setPersonaDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-blue-50 border border-blue-200 text-blue-900 font-medium'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-medium text-slate-900 flex items-center gap-1 truncate">
                              <span className="truncate">{u.fullName}</span>
                              {isActive && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          CUSTOM
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sign In with Custom Email & Password */}
              <div className="p-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setPersonaDropdownOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full text-center py-1.5 px-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 rounded-md border border-dashed border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Email & Password</span>
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

      {/* Login with Email & Password Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </header>
  );
};
