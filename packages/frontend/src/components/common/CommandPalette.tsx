import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { fetchAgents } from '../../services/api';
import { useAgentStore } from '../../stores/agent-store';
import { useToastStore } from '../../stores/toast-store';

interface CommandItem {
  id: string;
  label: string;
  category: 'agent' | 'page' | 'action';
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const { setViewMode } = useAgentStore();

  const { data } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetchAgents(),
    staleTime: 60_000,
  });
  const agents = data?.data ?? [];

  // Build command items
  const items: CommandItem[] = useMemo(() => {
    const cmds: CommandItem[] = [
      { id: 'page-agents', label: 'Go to Agents', category: 'page', action: () => navigate('/agents') },
      { id: 'page-topology', label: 'Go to Topology', category: 'page', action: () => navigate('/topology') },
      { id: 'page-metrics', label: 'Go to Metrics', category: 'page', action: () => navigate('/metrics') },
      { id: 'page-settings', label: 'Go to Settings', category: 'page', action: () => navigate('/settings') },
      { id: 'action-refresh', label: 'Refresh agents', category: 'action', action: () => { queryClient.invalidateQueries({ queryKey: ['agents'] }); addToast({ type: 'info', message: 'Refreshing agents...' }); } },
      { id: 'action-clear-cache', label: 'Clear cache', category: 'action', action: () => { queryClient.clear(); addToast({ type: 'success', message: 'Cache cleared' }); } },
      { id: 'action-grid-view', label: 'Switch to Grid view', category: 'action', action: () => { setViewMode('grid'); navigate('/agents'); } },
      { id: 'action-table-view', label: 'Switch to Table view', category: 'action', action: () => { setViewMode('table'); navigate('/agents'); } },
    ];
    for (const agent of agents) {
      cmds.push({
        id: `agent-${agent.id}`,
        label: agent.name,
        category: 'agent',
        action: () => navigate(`/agents?agent=${agent.id}`),
      });
    }
    return cmds;
  }, [agents, navigate, queryClient, addToast, setViewMode]);

  const fuse = useMemo(() => new Fuse(items, { keys: ['label'], threshold: 0.4 }), [items]);

  const results = query.trim()
    ? fuse.search(query).map((r) => r.item)
    : items;

  // Cmd+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const execute = (item: CommandItem) => {
    item.action();
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      execute(results[selectedIndex]);
    }
  };

  if (!open) return null;

  const categoryLabels = { agent: 'Agents', page: 'Pages', action: 'Actions' };
  const categoryOrder = ['page', 'action', 'agent'] as const;

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    label: categoryLabels[cat],
    items: results.filter((r) => r.category === cat),
  })).filter((g) => g.items.length > 0);

  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-[#0a0d16]/95 backdrop-blur-2xl" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#0e1120]/95 backdrop-blur-2xl shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center border-b border-border-default px-4 py-3">
          <svg className="h-4 w-4 text-text-faint mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-white placeholder-text-faint outline-none"
          />
          <kbd className="ml-2 rounded border border-border-default bg-white/5 px-1.5 py-0.5 text-[10px] text-text-faint">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {grouped.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-faint">No results found</div>
          ) : (
            <>
              {grouped.map((group) => (
                <div key={group.category}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-faint">{group.label}</div>
                  {group.items.map((item) => {
                    globalIdx++;
                    const idx = globalIdx;
                    return (
                      <button
                        key={item.id}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors rounded-lg ${idx === selectedIndex ? 'bg-primary/15 text-white' : 'text-text-secondary hover:bg-white/5'}`}
                        onClick={() => execute(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-faint">Shortcuts</div>
                {[
                  { keys: 'g a', desc: 'Agents' },
                  { keys: 'g t', desc: 'Topology' },
                  { keys: 'g m', desc: 'Metrics' },
                  { keys: 'g s', desc: 'Settings' },
                  { keys: '\u2318K', desc: 'Command Palette' },
                ].map((s) => (
                  <div key={s.keys} className="flex items-center justify-between px-4 py-2 text-sm text-text-faint">
                    <kbd className="rounded border border-border-default bg-white/5 px-1.5 py-0.5 text-[11px] font-mono">{s.keys}</kbd>
                    <span className="text-xs text-text-secondary">{s.desc}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="border-t border-border-default px-4 py-2 flex items-center gap-4 text-[10px] text-text-faint">
          <span><kbd className="rounded border border-border-default bg-white/5 px-1 py-0.5">&#8593;&#8595;</kbd> navigate</span>
          <span><kbd className="rounded border border-border-default bg-white/5 px-1 py-0.5">&#8629;</kbd> select</span>
          <span><kbd className="rounded border border-border-default bg-white/5 px-1 py-0.5">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
