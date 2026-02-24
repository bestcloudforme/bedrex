import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStoreState {
  filterSidebarOpen: boolean;
  setFilterSidebarOpen: (open: boolean) => void;
  navSidebarOpen: boolean;
  setNavSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      filterSidebarOpen: true,
      setFilterSidebarOpen: (filterSidebarOpen) => set({ filterSidebarOpen }),
      navSidebarOpen: true,
      setNavSidebarOpen: (navSidebarOpen) => set({ navSidebarOpen }),
    }),
    {
      name: 'bedrex-ui-prefs',
      partialize: (state) => ({
        filterSidebarOpen: state.filterSidebarOpen,
        navSidebarOpen: state.navSidebarOpen,
      }),
    }
  )
);
