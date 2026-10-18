import React, { useState, useEffect } from 'react';
import { apiRequest, setAuthToken } from '../api/client';
import { TeamRole } from '../types';
import { RoleBadge } from './Badges';
import { Zap, Check, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface InviteInfo {
  email: string;
  fullName: string;
  role: TeamRole;
  team: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
  inviterName: string;
}

interface AcceptInviteViewProps {
  token: string;
  onAccepted: () => void;
}

export const AcceptInviteView: React.FC<AcceptInviteViewProps> = ({ token, onAccepted }) => {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await apiRequest<InviteInfo>(`/api/auth/invite-info?token=${encodeURIComponent(token)}`);
        setInviteInfo(data);
        setFullName(data.fullName);
      } catch (err: any) {
        setErrorMsg(err.message || 'The invitation link is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    }
    loadInfo();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiRequest<{ token: string; user: any }>('/api/auth/accept-invite', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password,
          fullName: fullName.trim() || undefined,
        }),
      });

      setAuthToken(res.token);
      setSuccess(true);
      setTimeout(() => {
        // Clear invite query params from URL and navigate to dashboard
        window.history.replaceState({}, document.title, window.location.pathname.replace(/\/accept-invite.*/, ''));
        onAccepted();
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept invitation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 billow-grid-bg">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0066ff] to-[#1400ff] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Operations Under Pressure
            </h1>
            <p className="text-xs text-slate-500">Workspace Invitation</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Validating invitation token...</p>
          </div>
        ) : errorMsg && !inviteInfo ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Invalid Invitation</p>
                <p className="mt-1">{errorMsg}</p>
              </div>
            </div>
            <a
              href="/"
              className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              Return to Workspace
            </a>
          </div>
        ) : success ? (
          <div className="py-8 flex flex-col items-center text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Account Activated!</h2>
            <p className="text-xs text-slate-500 max-w-xs">
              Welcome to <strong>{inviteInfo?.team.name}</strong>. Redirecting you to the live dispatch dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Invited by:</span>
                <span className="text-xs font-bold text-slate-900">{inviteInfo?.inviterName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Assigned Team:</span>
                <span className="text-xs font-bold text-blue-600">{inviteInfo?.team.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Operational Role:</span>
                {inviteInfo?.role && <RoleBadge role={inviteInfo.role} />}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Your Email Address
              </label>
              <input
                type="email"
                disabled
                value={inviteInfo?.email || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Set Account Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type your password"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <>
                  <span>Accept Invitation & Join Team</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
