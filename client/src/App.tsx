import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Database, ShieldCheck, Cpu } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1">
        <DashboardView />
      </main>

      {/* System Status Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-3 px-4 sm:px-8 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL 16 Engine</span>
            </span>
            <span className="flex items-center space-x-1.5 text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OCC & Atomic Claim Active</span>
            </span>
            <span className="flex items-center space-x-1.5 text-purple-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>Transactional Outbox Active</span>
            </span>
          </div>
          <div className="text-slate-500 font-mono">
            Newtonite Challenge: Operations Under Pressure
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
