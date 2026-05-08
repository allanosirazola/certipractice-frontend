import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '../components/DateRangePicker.jsx';

describe('DateRangePicker', () => {
  it('renders all preset buttons', () => {
    render(<DateRangePicker days={7} onChange={() => {}} />);
    ['24h', '7d', '14d', '30d', '90d', '1y'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  it('marks current preset as active', () => {
    render(<DateRangePicker days={30} onChange={() => {}} />);
    const active = screen.getByRole('button', { name: '30d' });
    expect(active.className).toContain('bg-[var(--bg-3)]');
  });

  it('calls onChange with selected preset value', () => {
    const onChange = vi.fn();
    render(<DateRangePicker days={7} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '90d' }));
    expect(onChange).toHaveBeenCalledWith(90);
  });
});
