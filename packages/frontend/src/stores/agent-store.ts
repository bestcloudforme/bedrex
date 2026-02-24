import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentFilters, AgentSort, AgentSortField, SortDirection } from '@bedrex/shared';

type ViewMode = 'grid' | 'table';

interface AgentStoreState {
  filters: AgentFilters;
  sort: AgentSort;
  viewMode: ViewMode;
  selectedAgentIds: string[];
  setFilters: (filters: Partial<AgentFilters>) => void;
  clearFilters: () => void;
  setSort: (field: AgentSortField, direction?: SortDirection) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleAgentSelection: (id: string) => void;
  clearSelection: () => void;
}

const defaultFilters: AgentFilters = {};
const defaultSort: AgentSort = { field: 'name', direction: 'asc' };

export const useAgentStore = create<AgentStoreState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      sort: defaultSort,
      viewMode: 'grid',
      selectedAgentIds: [],
      setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      clearFilters: () => set({ filters: defaultFilters }),
      setSort: (field, direction) =>
        set((state) => ({
          sort: {
            field,
            direction: direction ?? (state.sort.field === field && state.sort.direction === 'asc' ? 'desc' : 'asc'),
          },
        })),
      setViewMode: (viewMode) => set({ viewMode }),
      toggleAgentSelection: (id) =>
        set((state) => ({
          selectedAgentIds: state.selectedAgentIds.includes(id)
            ? state.selectedAgentIds.filter((i) => i !== id)
            : [...state.selectedAgentIds, id],
        })),
      clearSelection: () => set({ selectedAgentIds: [] }),
    }),
    {
      name: 'bedrex-agent-prefs',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sort: state.sort,
      }),
    }
  )
);
