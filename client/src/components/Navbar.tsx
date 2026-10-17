import React, { useState, useRef, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { Zap, ChevronDown, Check, Layers, RefreshCw, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, teams, selectedTeamId, setSelectedTeamId, switchDemoUser, isLoading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeMembership = user?.memberships.find(
    (m) => selectedTeamId ? m.teamId === selectedTeamId : true
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0066ff] to-[#1400ff] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                Operations Under Pressure
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/80">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Live Dispatch</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              High-Integrity Operational Coordination
            </p>
          </div>
        </div>

        {/* Center: Team Selector */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-100/90 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs shadow-inner">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-medium">Team:</span>
          <select
            value={selectedTeamId || ''}
            onChange={(e) => setSelectedTeamId(e.target.value || null)}
            className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white text-slate-900">All Teams ({teams.length})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-white text-slate-900">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: 1-Click Role Switcher Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 px-3 py-1.5 rounded-full shadow-sm hover:shadow transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-white shadow-inner">
              {user?.fullName.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{user?.fullName || 'Anonymous'}</div>
              <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                <span className="font-semibold text-blue-600">
                  {activeMembership?.role || 'OPERATOR'}
                </span>
                <span>• Click to Switch</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* 1-Click Role Switcher Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-billow-modal py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>1-Click Role Switcher</span>
                <span className="flex items-center text-slate-400 gap-1 font-normal lowercase">
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  instant RBAC test
                </span>
              </div>

              <div className="p-1.5 space-y-1">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isActive = user?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      onClick={() => {
                        switchDemoUser(acc.email);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-blue-50/80 border border-blue-200/80 text-blue-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {acc.label.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{acc.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <div className="text-[10px] text-slate-500">{acc.team}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          acc.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : acc.role === 'LEAD'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : acc.role === 'MEMBER'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {acc.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
