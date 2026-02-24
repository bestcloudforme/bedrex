import { AccountManager } from '../components/settings/AccountManager';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAgents } from '../services/api';
import { useToastStore } from '../stores/toast-store';
import { Button } from '../components/common/Button';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-6 transition-all duration-200 hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_24px_rgba(79,143,255,0.06)]">
      <div className="mb-5 flex items-center gap-2">
        <span className="h-5 w-0.5 rounded-full bg-primary" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {description && <p className="text-[10px] text-text-faint mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ActiveConfig() {
  const { data } = useQuery({ queryKey: ['agents'], queryFn: () => fetchAgents(), staleTime: 60_000 });
  const agents = data?.data ?? [];
  const region = agents[0]?.region || '--';
  const accountId = agents[0]?.accountId || '--';

  return (
    <Section title="Active Configuration" description="Current AWS account and region settings">
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-text-faint">Region</span>
          <p className="text-text-secondary font-mono mt-0.5">{region}</p>
        </div>
        <div>
          <span className="text-text-faint">Account ID</span>
          <p className="text-text-secondary font-mono mt-0.5">{accountId}</p>
        </div>
        <div>
          <span className="text-text-faint">Total Agents</span>
          <p className="text-text-secondary mt-0.5">{agents.length}</p>
        </div>
        <div>
          <span className="text-text-faint">Data Source</span>
          <p className="text-text-secondary mt-0.5">AWS API (Live)</p>
        </div>
      </div>
    </Section>
  );
}

function DataSettings() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const clearCache = () => {
    queryClient.clear();
    addToast({ type: 'success', message: 'Cache cleared' });
  };

  return (
    <Section title="Data" description="Cache and data refresh settings">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Clear Cache</p>
            <p className="text-xs text-text-faint">Force reload all data from AWS APIs</p>
          </div>
          <Button variant="secondary" onClick={clearCache}>
            Clear Cache
          </Button>
        </div>
      </div>
    </Section>
  );
}

export function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Settings</h2>
        <p className="text-xs text-text-muted mt-0.5">Manage AWS accounts, data sources, and application preferences</p>
      </div>
      <ActiveConfig />
      <Section title="AWS Accounts" description="Manage monitored AWS accounts and their regions">
        <AccountManager />
      </Section>
      <DataSettings />
    </div>
  );
}
