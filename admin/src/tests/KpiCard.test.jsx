import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KpiCard, { KpiCardSkeleton } from '../components/KpiCard.jsx';

describe('KpiCard', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Active users" value="1,200" />);
    expect(screen.getByText('Active users')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });

  it('shows hint when provided', () => {
    render(<KpiCard label="X" value="1" hint="some helper text" />);
    expect(screen.getByText('some helper text')).toBeInTheDocument();
  });

  it('renders "—" when value is missing', () => {
    render(<KpiCard label="X" value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders positive delta in green by default', () => {
    const { container } = render(<KpiCard label="X" value="1" delta={25} />);
    const deltaEl = container.querySelector('.text-emerald-500');
    expect(deltaEl).not.toBeNull();
    expect(deltaEl.textContent).toBe('+25%');
  });

  it('renders negative delta in red by default', () => {
    const { container } = render(<KpiCard label="X" value="1" delta={-10} />);
    const deltaEl = container.querySelector('.text-red-500');
    expect(deltaEl).not.toBeNull();
    expect(deltaEl.textContent).toBe('-10%');
  });

  it('inverts delta colors when deltaInverted=true', () => {
    // For metrics like "abandonment rate", a decrease is good
    const { container } = render(<KpiCard label="X" value="1" delta={-10} deltaInverted />);
    expect(container.querySelector('.text-emerald-500')).not.toBeNull();
  });

  it('omits delta element when delta is null/undefined', () => {
    const { container } = render(<KpiCard label="X" value="1" />);
    expect(container.querySelector('.text-emerald-500')).toBeNull();
    expect(container.querySelector('.text-red-500')).toBeNull();
  });
});

describe('KpiCardSkeleton', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<KpiCardSkeleton />);
    expect(container.querySelectorAll('.skel').length).toBeGreaterThanOrEqual(2);
  });
});
