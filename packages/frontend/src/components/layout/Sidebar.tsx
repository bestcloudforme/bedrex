import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAgents } from '../../services/api';
import { useUIStore } from '../../stores/ui-store';
import { clsx } from 'clsx';
import {
  IconAgents,
  IconTopology,
  IconChart,
  IconSettingsGear,
  IconSidebarCollapse,
  IconSidebarExpand,
} from '../common/Icons';

const navItems = [
  { path: '/agents', label: 'Agents', icon: IconAgents },
  { path: '/topology', label: 'Topology', icon: IconTopology },
  { path: '/metrics', label: 'Metrics', icon: IconChart },
  { path: '/settings', label: 'Settings', icon: IconSettingsGear },
];

export function Sidebar() {
  const { navSidebarOpen, setNavSidebarOpen } = useUIStore();
  const { data, status } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetchAgents(),
    staleTime: 60_000,
  });

  const agents = data?.data ?? [];
  const agentCount = agents.length;
  const region = agents[0]?.region || '';
  const isConnected = status === 'success';

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 hidden md:flex flex-col glass-surface transition-all duration-300',
        navSidebarOpen ? 'w-[240px]' : 'w-[64px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-white/[0.06]">
        <div
          role={!navSidebarOpen ? 'button' : undefined}
          tabIndex={!navSidebarOpen ? 0 : undefined}
          onClick={() => { if (!navSidebarOpen) setNavSidebarOpen(true); }}
          onKeyDown={(e) => { if (!navSidebarOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setNavSidebarOpen(true); } }}
          className={clsx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm',
            !navSidebarOpen && 'cursor-pointer hover:bg-primary/30 transition-colors'
          )}
        >
          B
        </div>
        {navSidebarOpen && (
          <span className="text-sm font-semibold text-text-primary truncate">
            BedRex
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.path} className="relative group">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/[0.08] text-primary border-l-2 border-primary'
                    : 'text-text-muted hover:bg-white/[0.04] hover:text-text-secondary'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {navSidebarOpen && <span>{item.label}</span>}
            </NavLink>
            {!navSidebarOpen && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap bg-[#0e1120]/95 backdrop-blur-xl text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/[0.08] shadow-lg z-50">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.06] px-3 py-3 space-y-2">
        {/* Connected status */}
        <div className={clsx('relative group flex items-center gap-2', !navSidebarOpen && 'justify-center')}>
          <div
            className={clsx(
              'h-1.5 w-1.5 rounded-full shrink-0',
              isConnected ? 'bg-success animate-pulse' : 'bg-text-faint'
            )}
          />
          {navSidebarOpen && (
            <span className="text-[10px] text-text-faint">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          )}
          {!navSidebarOpen && (
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap bg-[#0e1120]/95 backdrop-blur-xl text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/[0.08] shadow-lg z-50">
              {isConnected ? 'Connected' : 'Disconnected'}
              {agentCount > 0 && <> &middot; {agentCount} agents</>}
              {region && <> &middot; {region}</>}
            </div>
          )}
        </div>

        {/* Agent count & region */}
        {navSidebarOpen && agentCount > 0 && (
          <div className="text-[10px] text-text-faint font-mono tabular-nums">
            {agentCount} agents{region && <> &middot; {region}</>}
          </div>
        )}

        {/* Command palette hint */}
        {navSidebarOpen && (
          <kbd className="inline-flex rounded-md border border-border-default bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-text-faint">
            Cmd+K
          </kbd>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setNavSidebarOpen(!navSidebarOpen)}
          className={clsx(
            'flex items-center gap-2 rounded-lg p-2 text-text-faint hover:text-text-secondary hover:bg-white/[0.04] transition-colors w-full',
            !navSidebarOpen && 'justify-center'
          )}
          title={navSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {navSidebarOpen ? (
            <>
              <IconSidebarCollapse className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          ) : (
            <IconSidebarExpand className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const { data, status } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetchAgents(),
    staleTime: 60_000,
  });

  const agents = data?.data ?? [];
  const agentCount = agents.length;
  const region = agents[0]?.region || '';
  const isConnected = status === 'success';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sidebar panel */}
      <aside className="fixed inset-y-0 left-0 w-[240px] glass-surface bg-bg-dark/95 animate-slide-in-right flex flex-col"
        style={{ animationName: 'none', transform: 'translateX(0)' }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-white/[0.06]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
            B
          </div>
          <span className="text-sm font-semibold text-text-primary truncate">
            BedRex
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/[0.08] text-primary border-l-2 border-primary'
                    : 'text-text-muted hover:bg-white/[0.04] hover:text-text-secondary'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/[0.06] px-3 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                'h-1.5 w-1.5 rounded-full shrink-0',
                isConnected ? 'bg-success animate-pulse' : 'bg-text-faint'
              )}
            />
            <span className="text-[10px] text-text-faint">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {agentCount > 0 && (
            <div className="text-[10px] text-text-faint font-mono tabular-nums">
              {agentCount} agents{region && <> &middot; {region}</>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
