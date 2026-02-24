import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchBar } from '../../src/components/common/SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with default placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search agents...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Filter by name..." />);
    expect(screen.getByPlaceholderText('Filter by name...')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<SearchBar value="hello" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search agents...') as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('calls onChange when user types (after debounce)', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Search agents...');
    fireEvent.change(input, { target: { value: 'test query' } });

    // SearchBar has a 300ms debounce
    act(() => { vi.advanceTimersByTime(300); });

    expect(handleChange).toHaveBeenCalledWith('test query');
  });

  it('debounces multiple rapid changes', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Search agents...');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });

    // Only the last value should be emitted after debounce
    act(() => { vi.advanceTimersByTime(300); });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('ab');
  });

  it('shows clear button when value is non-empty', () => {
    render(<SearchBar value="something" onChange={vi.fn()} />);
    // The clear button is a <button> element
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('does not show clear button when value is empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('calls onChange with empty string when clear button is clicked', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="something" onChange={handleChange} />);

    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('renders a search icon', () => {
    const { container } = render(<SearchBar value="" onChange={vi.fn()} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
