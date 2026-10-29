// ==============================================================================
// HAMMAD STUDYHUB — PUBLIC APPLICATION LAYOUT
// ==============================================================================

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PwaInstallBanner } from '../common/PwaInstallBanner';
import { useAuth } from '../../context/AuthContext';
import { Database, Info } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isDemoMode } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <PwaInstallBanner />

      {/* Demo Mode Notice Banner (Only shown when live Supabase is not yet configured) */}
      {isDemoMode && (
        <aside
          aria-label="Demo mode notice"
          className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs py-1.5 px-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">
                <strong>Demo Mode Active:</strong> Running with verified local sample data. To connect your cloud database, add your Supabase keys to <code className="bg-amber-200/50 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono">.env</code>.
              </span>
            </div>
            <span className="shrink-0 font-medium text-[11px] hidden sm:inline-block">
              Fully interactive
            </span>
          </div>
        </aside>
      )}

      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
