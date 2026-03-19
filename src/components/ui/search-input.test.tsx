import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchInput } from '@/components/ui/search-input';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams('page=3&status=open'),
}));

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('applies the provided className to the wrapper', () => {
    render(<SearchInput className="max-w-md" />);

    expect(screen.getByPlaceholderText('Search...').parentElement).toHaveClass(
      'max-w-md',
    );
  });

  it('resets pagination and updates the q query param after debounce', () => {
    render(<SearchInput placeholder="Search records" />);

    fireEvent.change(screen.getByPlaceholderText('Search records'), {
      target: { value: 'omega' },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(replace).toHaveBeenCalledWith('?page=1&status=open&q=omega');
  });
});
