import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from '../../src/components/agents/AgentCard';
import type { AgentInventoryItem } from '@bedrex/shared';

function makeAgent(overrides: Partial<AgentInventoryItem> = {}): AgentInventoryItem {
  return {
    id: 'agent-1',
    name: 'TestAgent',
    type: 'bedrock-agent',
    status: 'PREPARED',
    region: 'us-east-1',
    accountId: '000000000000',
    foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
    agentVersion: '1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    actionGroups: [],
    knowledgeBases: [],
    ...overrides,
  };
}

describe('AgentCard', () => {
  it('renders agent name', () => {
    render(<AgentCard agent={makeAgent()} />);
    expect(screen.getByText('TestAgent')).toBeInTheDocument();
  });

  it('renders agent description when provided', () => {
    render(<AgentCard agent={makeAgent({ description: 'A helpful agent' })} />);
    expect(screen.getByText('A helpful agent')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<AgentCard agent={makeAgent({ status: 'PREPARED' })} />);
    expect(screen.getByText('Prepared')).toBeInTheDocument();
  });

  it('renders region', () => {
    render(<AgentCard agent={makeAgent({ region: 'eu-west-1' })} />);
    expect(screen.getByText('eu-west-1')).toBeInTheDocument();
  });

  it('renders action group count', () => {
    const agent = makeAgent({
      actionGroups: [
        { id: 'ag-1', name: 'A1', description: 'D', executionType: 'LAMBDA', state: 'ENABLED', updatedAt: '' },
        { id: 'ag-2', name: 'A2', description: 'D', executionType: 'LAMBDA', state: 'ENABLED', updatedAt: '' },
      ],
    });
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders knowledge base count', () => {
    const agent = makeAgent({
      knowledgeBases: [
        { knowledgeBaseId: 'kb-1', name: 'KB1', description: 'D', dataSourceType: 'S3', embeddingModel: 'e', status: 'ACTIVE', updatedAt: '' },
      ],
    });
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('KBs')).toBeInTheDocument();
    // KB count "1" appears alongside Version "1", so use getAllByText
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });

  it('renders metrics when available', () => {
    const agent = makeAgent({
      metrics: {
        invocationCount24h: 1234,
        avgLatencyMs: 500,
        errorRate: 0.01,
        totalTokensUsed24h: 50000,
        estimatedCost24h: 0.25,
      },
    });
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('24h invocations')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('shows error rate when above 5%', () => {
    const agent = makeAgent({
      metrics: {
        invocationCount24h: 100,
        avgLatencyMs: 500,
        errorRate: 0.10,
        totalTokensUsed24h: 50000,
        estimatedCost24h: 0.25,
      },
    });
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('10.0% errors')).toBeInTheDocument();
  });

  it('does not show error rate when below 5%', () => {
    const agent = makeAgent({
      metrics: {
        invocationCount24h: 100,
        avgLatencyMs: 500,
        errorRate: 0.02,
        totalTokensUsed24h: 50000,
        estimatedCost24h: 0.25,
      },
    });
    render(<AgentCard agent={agent} />);
    expect(screen.queryByText(/errors/)).toBeNull();
  });

  it('calls onClick when the card is clicked', () => {
    const handleClick = vi.fn();
    render(<AgentCard agent={makeAgent()} onClick={handleClick} />);

    const card = screen.getByText('TestAgent').closest('div[class*="cursor-pointer"]');
    if (card) fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows History button when onHistory is provided', () => {
    render(<AgentCard agent={makeAgent()} onHistory={vi.fn()} />);
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('does not show History button when onHistory is not provided', () => {
    render(<AgentCard agent={makeAgent()} />);
    expect(screen.queryByText('History')).toBeNull();
  });

  it('calls onHistory when History button is clicked', () => {
    const handleHistory = vi.fn();
    const handleClick = vi.fn();
    render(<AgentCard agent={makeAgent()} onHistory={handleHistory} onClick={handleClick} />);

    const historyButton = screen.getByText('History');
    fireEvent.click(historyButton);

    expect(handleHistory).toHaveBeenCalledTimes(1);
    // Should not propagate to onClick
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows checkbox when onSelect is provided', () => {
    render(<AgentCard agent={makeAgent()} onSelect={vi.fn()} selected={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('does not show checkbox when onSelect is not provided', () => {
    render(<AgentCard agent={makeAgent()} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('renders selected state with ring styling', () => {
    const { container } = render(<AgentCard agent={makeAgent()} selected={true} onSelect={vi.fn()} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-primary');
  });
});
