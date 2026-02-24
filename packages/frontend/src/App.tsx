import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/Toast';
import { CommandPalette } from './components/common/CommandPalette';
import { AgentsPage } from './pages/AgentsPage';
import { TopologyPage } from './pages/TopologyPage';
import { MetricsPage } from './pages/MetricsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/agents" replace />} />
            <Route path="/agents" element={<ErrorBoundary><AgentsPage /></ErrorBoundary>} />
            <Route path="/topology" element={<ErrorBoundary><TopologyPage /></ErrorBoundary>} />
            <Route path="/metrics" element={<ErrorBoundary><MetricsPage /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <ToastContainer />
        <CommandPalette />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
