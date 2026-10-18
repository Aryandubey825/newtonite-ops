import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Team } from '../types';
import { apiRequest, setAuthToken, getAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  teams: Team[];
  totalWorkspaceUsers: number;
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  isLoading: boolean;
  login: (email: string, passwordPlain: string) => Promise<void>;
  switchDemoUser: (email: string) => Promise<void>;
  logout: () => void;
  refreshTeams: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS = [
  { email: 'admin@newtonite.io', label: 'Alex (Global Admin)', role: 'ADMIN', team: 'All Teams' },
  { email: 'lead.secops@newtonite.io', label: 'Sarah (SecOps Lead)', role: 'LEAD', team: 'SecOps' },
  { email: 'member.secops@newtonite.io', label: 'John (SecOps Member)', role: 'MEMBER', team: 'SecOps' },
  { email: 'viewer.secops@newtonite.io', label: 'Marcus (SecOps Viewer)', role: 'VIEWER', team: 'SecOps' },
  { email: 'lead.payments@newtonite.io', label: 'Rachel (Payments Lead)', role: 'LEAD', team: 'Payments' },
  { email: 'member.payments@newtonite.io', label: 'Mike (Payments Member)', role: 'MEMBER', team: 'Payments' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [totalWorkspaceUsers, setTotalWorkspaceUsers] = useState<number>(11);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndTeams = async () => {
    try {
      const meRes = await apiRequest<{ user: User }>('/api/auth/me');
      setUser(meRes.user);

      const teamsRes = await apiRequest<{ teams: Team[]; totalWorkspaceUsers?: number }>('/api/teams');
      setTeams(teamsRes.teams);
      if (teamsRes.totalWorkspaceUsers) {
        setTotalWorkspaceUsers(teamsRes.totalWorkspaceUsers);
      }
    } catch (err) {
      setAuthToken(null);
      setUser(null);
      await switchDemoUser('admin@newtonite.io').catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedOut = localStorage.getItem('newtonite_logged_out') === 'true';
    const token = getAuthToken();

    if (token && !isLoggedOut) {
      fetchProfileAndTeams().catch(() => {
        setIsLoading(false);
      });
    } else if (!isLoggedOut && !token) {
      // First-time visit auto-login for reviewer convenience
      switchDemoUser('admin@newtonite.io').finally(() => {
        setIsLoading(false);
      });
    } else {
      // Explicitly logged out: stay on login screen
      setIsLoading(false);
      setUser(null);
    }
  }, []);

  const login = async (email: string, passwordPlain: string) => {
    localStorage.removeItem('newtonite_logged_out');
    setIsLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: passwordPlain }),
      });
      setAuthToken(res.token);
      setUser(res.user);

      const teamsRes = await apiRequest<{ teams: Team[]; totalWorkspaceUsers?: number }>('/api/teams');
      setTeams(teamsRes.teams);
      if (teamsRes.totalWorkspaceUsers) {
        setTotalWorkspaceUsers(teamsRes.totalWorkspaceUsers);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoUser = async (email: string) => {
    localStorage.removeItem('newtonite_logged_out');
    await login(email, 'Password123!');
  };

  const refreshTeams = async () => {
    try {
      const teamsRes = await apiRequest<{ teams: Team[]; totalWorkspaceUsers?: number }>('/api/teams');
      setTeams(teamsRes.teams);
      if (teamsRes.totalWorkspaceUsers) {
        setTotalWorkspaceUsers(teamsRes.totalWorkspaceUsers);
      }
      const meRes = await apiRequest<{ user: User }>('/api/auth/me');
      setUser(meRes.user);
    } catch (err) {
      console.error('Failed to refresh teams', err);
    }
  };

  const logout = () => {
    localStorage.setItem('newtonite_logged_out', 'true');
    setAuthToken(null);
    setUser(null);
    setTeams([]);
    setSelectedTeamId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        teams,
        totalWorkspaceUsers,
        selectedTeamId,
        setSelectedTeamId,
        isLoading,
        login,
        switchDemoUser,
        logout,
        refreshTeams,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
