// SearchBar.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSearchQuestions = vi.fn();
vi.mock('../../services/api', () => ({
  searchAPI: {
    searchQuestions: (...args) => mockSearchQuestions(...args),
  },
}));

import SearchBar from '../../components/engagement/SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchQuestions.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
  });

  it('renders the search input', () => {
    render(<SearchBar />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not call the API for queries shorter than 2 characters', async () => {
    render(<SearchBar />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'a');
    await new Promise((r) => setTimeout(r, 400));
    expect(mockSearchQuestions).not.toHaveBeenCalled();
  });

  it('calls the API after debounce when query is long enough', async () => {
    render(<SearchBar />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'S3');
    await waitFor(() => expect(mockSearchQuestions).toHaveBeenCalled(), { timeout: 1500 });
    expect(mockSearchQuestions.mock.calls[0][0]).toMatch(/S3/);
  });
});
