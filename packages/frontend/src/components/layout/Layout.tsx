import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useUIStore } from '../../stores/ui-store';
import { PageTransition } from '../common/PageTransition';
import { Sidebar, MobileSidebar } from './Sidebar';
import { clsx } from 'clsx';

function BackendOfflineBanner() {
  const queryClient = useQueryClient();
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkQueryErrors = useCallback(() => {
    const queries = queryClient.getQueryCache().findAll();
    const recentQueries = queries.filter((q) => q.state.dataUpdatedAt > 0 || q.state.errorUpdatedAt > 0);
    if (recentQueries.length === 0) return;

    const failedCount = recentQueries.filter((q) => q.state.status === 'error').length;
    if (failedCount >= 3) {
      setIsOffline(true);
      setDismissed(false);
    } else if (failedCount === 0) {
      setIsOffline(false);
    }
  }, [queryClient]);

  useEffect(() => {
    const interval = setInterval(checkQueryErrors, 5000);
    return () => clearInterval(interval);
  }, [checkQueryErrors]);

  if (!isOffline || dismissed) return null;

  return (
    <div className="bg-amber-600/90 px-4 py-2 text-center text-sm text-white flex items-center justify-center gap-3">
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <span>Unable to connect to backend. Retrying...</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 rounded px-1.5 py-0.5 text-white/80 hover:text-white hover:bg-white/10"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function Layout() {
  useKeyboardShortcuts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navSidebarOpen = useUIStore((s) => s.navSidebarOpen);

  useEffect(() => {
    const titles: Record<string, string> = {
      '/agents': 'Agents',
      '/topology': 'Topology',
      '/metrics': 'Metrics',
      '/settings': 'Settings',
    };
    const title = titles[location.pathname];
    if (title) {
      document.title = `${title} | BedRex`;
    }
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg-dark text-white">
      <BackendOfflineBanner />

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-white/[0.06] glass-surface">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
            B
          </div>
          <span className="text-sm font-semibold text-text-primary">
            BedRex
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-1.5 text-text-faint hover:text-white hover:bg-white/10"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </header>

      {/* Main content */}
      <main
        className={clsx(
          'flex-1 min-h-screen transition-all duration-300',
          navSidebarOpen ? 'md:ml-[240px]' : 'md:ml-[64px]'
        )}
      >
        <div className="mx-auto w-full max-w-[1920px] p-4 md:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
