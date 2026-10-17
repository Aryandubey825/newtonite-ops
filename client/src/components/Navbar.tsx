import React from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { ShieldAlert, Users, ChevronDown, RefreshCw } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, teams, selectedTeamId, setSelectedTeamId, switchDemoUser, isLoading } = useAuth();

  const activeMembership = user?.memberships.find(
    (m) => selectedTeamId ? m.teamId === selectedTeamId : true
  );

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Operations Under Pressure</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">High-Integrity Cross-Team Dispatch</p>
          </div>
        </div>

        {/* Center: Team Selector */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg text-sm">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-xs font-medium">Team:</span>
          <select
            value={selectedTeamId || ''}
            onChange={(e) => setSelectedTeamId(e.target.value || null)}
            className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Demo User Switcher & Profile */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                {user?.fullName.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{user?.fullName || 'Not Logged In'}</div>
                <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                  <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-mono font-bold">
                    {activeMembership?.role || 'OPERATOR'}
                  </span>
                  <span>▼ Switch Role</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {/* Quick Demo Switcher Dropdown */}
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>1-Click Role Switcher</span>
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              {DEMO_ACCOUNTS.map((acc) => {
                const isActive = user?.email === acc.email;
                return (
                  <button
                    key={acc.email}
                    onClick={() => switchDemoUser(acc.email)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                      isActive ? 'bg-slate-800/70 border-l-2 border-emerald-500' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-200">{acc.label}</div>
                      <div className="text-[10px] text-slate-400">{acc.team}</div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        acc.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-300'
                          : acc.role === 'LEAD'
                          ? 'bg-amber-500/20 text-amber-300'
                          : acc.role === 'MEMBER'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
