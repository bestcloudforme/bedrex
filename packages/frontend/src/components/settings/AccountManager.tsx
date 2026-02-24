import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings } from '../../services/api';
import { useToastStore } from '../../stores/toast-store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BEDROCK_REGIONS } from '@bedrex/shared';
import type { AccountConfig } from '@bedrex/shared';

export function AccountManager() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });
  const accounts = data?.data?.accounts ?? [];

  const [newAccount, setNewAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (account: AccountConfig) =>
      fetch('/api/settings/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setNewAccount(false);
      addToast({ type: 'success', message: 'Account added' });
    },
    onError: (err: Error) => {
      addToast({ type: 'error', message: err.message || 'Operation failed' });
    },
  });

  /* Task 5.4: PUT mutation for editing */
  const editMutation = useMutation({
    mutationFn: (account: AccountConfig) =>
      fetch(`/api/settings/accounts/${account.accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditingAccount(null);
      addToast({ type: 'success', message: 'Account updated' });
    },
    onError: (err: Error) => {
      addToast({ type: 'error', message: err.message || 'Operation failed' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (accountId: string) =>
      fetch(`/api/settings/accounts/${accountId}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast({ type: 'success', message: 'Account removed' });
    },
    onError: (err: Error) => {
      addToast({ type: 'error', message: err.message || 'Operation failed' });
    },
  });

  const handleStartEdit = (accountId: string) => {
    setNewAccount(false);
    setEditingAccount(accountId);
  };

  const handleStartNew = () => {
    setEditingAccount(null);
    setNewAccount(true);
  };

  if (isLoading) return <div className="animate-pulse text-text-faint">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={handleStartNew}
          className="rounded-xl bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/80 transition-colors duration-200"
        >
          Add Account
        </button>
      </div>

      {newAccount && (
        <AccountForm
          existingIds={accounts.map((a: AccountConfig) => a.accountId)}
          onSubmit={(account) => addMutation.mutate(account)}
          onCancel={() => setNewAccount(false)}
        />
      )}

      {accounts.map((account: AccountConfig) => (
        <div key={account.accountId}>
          {editingAccount === account.accountId ? (
            <AccountForm
              initialValues={account}
              existingIds={accounts
                .filter((a: AccountConfig) => a.accountId !== account.accountId)
                .map((a: AccountConfig) => a.accountId)}
              onSubmit={(updated) => editMutation.mutate(updated)}
              onCancel={() => setEditingAccount(null)}
            />
          ) : (
            <div className="rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_24px_rgba(79,143,255,0.06)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{account.displayName}</p>
                  <p className="text-xs text-text-faint">{account.accountId}</p>
                </div>
                <div className="flex items-center gap-2">
                  {account.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 text-success border border-success/20 px-2 py-0.5 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-text-faint">Inactive</span>
                  )}
                  <button
                    onClick={() => handleStartEdit(account.accountId)}
                    className="rounded-md px-2 py-1 text-xs text-text-muted hover:text-white hover:bg-white/10 transition-colors duration-200"
                  >
                    Edit
                  </button>
                  {accounts.length <= 1 ? (
                    <span
                      className="rounded-md px-2 py-1 text-xs text-text-faint cursor-not-allowed"
                      title="Cannot remove last account"
                    >
                      Remove
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(account.accountId)}
                      className="rounded-md px-2 py-1 text-xs text-error/50 hover:text-error hover:bg-error/10 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {account.regions.map((r: string) => (
                  <span key={r} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-text-muted">
                    {r}
                  </span>
                ))}
              </div>
              {account.roleArn && (
                <p className="mt-1 truncate text-[10px] text-text-faint">Role: {account.roleArn}</p>
              )}
            </div>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remove Account"
        message="This will stop monitoring agents in this account. Are you sure?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) deleteMutation.mutate(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function validate(form: AccountConfig, existingIds: string[]): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.accountId) errs.accountId = 'Account ID is required';
  else if (!/^\d{12}$/.test(form.accountId)) errs.accountId = 'Must be exactly 12 digits';
  else if (existingIds.includes(form.accountId)) errs.accountId = 'Account already exists';
  if (!form.displayName.trim()) errs.displayName = 'Display name is required';
  if (form.roleArn && !/^arn:aws:iam::\d{12}:role\//.test(form.roleArn)) errs.roleArn = 'Invalid Role ARN format';
  if (form.regions.length === 0) errs.regions = 'At least one region is required';
  return errs;
}

function AccountForm({
  existingIds = [],
  initialValues,
  onSubmit,
  onCancel,
}: {
  existingIds?: string[];
  initialValues?: AccountConfig;
  onSubmit: (a: AccountConfig) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AccountConfig>(
    initialValues ?? {
      accountId: '',
      displayName: '',
      regions: ['us-east-1'],
      isActive: true,
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialValues;

  const handleSave = () => {
    const errs = validate(form, existingIds);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  };

  /* Task 5.5: Multi-region toggle helper */
  const toggleRegion = (region: string) => {
    setErrors((prev) => ({ ...prev, regions: '' }));
    setForm((prev) => {
      const has = prev.regions.includes(region);
      if (has && prev.regions.length === 1) return prev; // keep at least one
      const regions = has ? prev.regions.filter((r) => r !== region) : [...prev.regions, region];
      return { ...prev, regions };
    });
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-white/[0.04] backdrop-blur-md p-4 space-y-3">
      <div>
        <input
          placeholder="Account ID (12 digits)"
          value={form.accountId}
          disabled={isEditing}
          onChange={(e) => { setForm({ ...form, accountId: e.target.value }); setErrors(prev => ({ ...prev, accountId: '' })); }}
          className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-3 py-1.5 text-sm text-white placeholder-text-faint focus:border-primary focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {errors.accountId && <p className="text-error text-xs mt-1">{errors.accountId}</p>}
      </div>
      <div>
        <input
          placeholder="Display Name"
          value={form.displayName}
          onChange={(e) => { setForm({ ...form, displayName: e.target.value }); setErrors(prev => ({ ...prev, displayName: '' })); }}
          className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-3 py-1.5 text-sm text-white placeholder-text-faint focus:border-primary focus:outline-none transition-colors duration-200"
        />
        {errors.displayName && <p className="text-error text-xs mt-1">{errors.displayName}</p>}
      </div>
      <div>
        <input
          placeholder="Role ARN (optional)"
          value={form.roleArn || ''}
          onChange={(e) => { setForm({ ...form, roleArn: e.target.value || undefined }); setErrors(prev => ({ ...prev, roleArn: '' })); }}
          className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-3 py-1.5 text-sm text-white placeholder-text-faint focus:border-primary focus:outline-none transition-colors duration-200"
        />
        {errors.roleArn && <p className="text-error text-xs mt-1">{errors.roleArn}</p>}
      </div>

      {/* Task 5.5: Multi-Region Select */}
      <div>
        <label className="text-xs text-text-faint mb-1 block">Regions</label>

        {/* Selected regions chips */}
        {form.regions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {form.regions.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary"
              >
                {r}
                <button
                  type="button"
                  onClick={() => toggleRegion(r)}
                  className="hover:text-white transition-colors duration-200"
                  disabled={form.regions.length === 1}
                >
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Checkbox grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {BEDROCK_REGIONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-1.5 cursor-pointer text-xs text-text-muted hover:text-text-secondary"
            >
              <input
                type="checkbox"
                checked={form.regions.includes(r)}
                onChange={() => toggleRegion(r)}
                className="h-3 w-3 rounded border-border-default bg-transparent text-primary focus:ring-primary/50 cursor-pointer"
              />
              {r}
            </label>
          ))}
        </div>
        {errors.regions && <p className="text-error text-xs mt-1">{errors.regions}</p>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="rounded-xl bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/80 transition-colors duration-200"
        >
          {isEditing ? 'Update' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-white/[0.08] px-3 py-1.5 text-xs text-text-muted hover:text-white transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
