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
    <div className="min-h-screen flex flex-col billow-grid-bg text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1">
        <DashboardView />
      </main>

      {/* Billow System Status Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-sm py-4 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-5 flex-wrap gap-y-2">
            <span className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px] bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-sm">
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL 16 Storage Engine</span>
            </span>
            <span className="flex items-center space-x-1.5 text-blue-700 font-semibold text-[11px] bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-full shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OCC & Atomic Claim Active</span>
            </span>
            <span className="flex items-center space-x-1.5 text-purple-700 font-semibold text-[11px] bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-full shadow-sm">
              <Cpu className="w-3.5 h-3.5" />
              <span>Transactional Outbox Active</span>
            </span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Newtonite Software Engineering Challenge • Operations Under Pressure
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
