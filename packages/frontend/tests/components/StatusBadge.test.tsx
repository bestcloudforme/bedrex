import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import type { AgentStatus } from '@bedrex/shared';

describe('StatusBadge', () => {
  const statuses: { status: AgentStatus; label: string }[] = [
    { status: 'ACTIVE', label: 'Active' },
    { status: 'PREPARED', label: 'Prepared' },
    { status: 'INACTIVE', label: 'Inactive' },
    { status: 'PREPARING', label: 'Preparing' },
    { status: 'FAILED', label: 'Failed' },
    { status: 'NOT_PREPARED', label: 'Not Prepared' },
    { status: 'DELETING', label: 'Deleting' },
  ];

  for (const { status, label } of statuses) {
    it(`renders "${label}" for status "${status}"`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  }

  it('renders with success styling for ACTIVE status', () => {
    const { container } = render(<StatusBadge status="ACTIVE" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-success/20');
    expect(badge?.className).toContain('text-success');
  });

  it('renders with success styling for PREPARED status', () => {
    const { container } = render(<StatusBadge status="PREPARED" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-success/20');
    expect(badge?.className).toContain('text-success');
  });

  it('renders with error styling for FAILED status', () => {
    const { container } = render(<StatusBadge status="FAILED" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-error/20');
    expect(badge?.className).toContain('text-error');
  });

  it('renders with warning styling for PREPARING status', () => {
    const { container } = render(<StatusBadge status="PREPARING" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-warning/20');
    expect(badge?.className).toContain('text-warning');
  });

  it('renders the colored dot indicator', () => {
    const { container } = render(<StatusBadge status="ACTIVE" />);
    const dot = container.querySelector('span span');
    expect(dot).not.toBeNull();
    expect(dot?.className).toContain('rounded-full');
    expect(dot?.className).toContain('bg-success');
  });

  it('renders error dot for FAILED status', () => {
    const { container } = render(<StatusBadge status="FAILED" />);
    const dot = container.querySelector('span span');
    expect(dot?.className).toContain('bg-error');
  });

  it('renders muted dot for NOT_PREPARED status', () => {
    const { container } = render(<StatusBadge status="NOT_PREPARED" />);
    const dot = container.querySelector('span span');
    expect(dot?.className).toContain('bg-white/40');
  });
});
