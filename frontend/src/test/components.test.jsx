import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import Pagination from '../components/Pagination';

describe('StatusBadge', () => {
  it('renders correct text and accessibility label for Applied', () => {
    render(<StatusBadge stage="Applied" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Applied');
    expect(badge).toHaveAttribute('aria-label', 'Stage: Applied');
  });

  it('renders correct text for Hired', () => {
    render(<StatusBadge stage="Hired" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Hired');
  });
});

describe('MetricCard', () => {
  it('renders title, value, and description', () => {
    render(
      <MetricCard
        title="Total Candidates"
        value={42}
        description="All time applicants"
      />
    );
    expect(screen.getByText('Total Candidates')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('All time applicants')).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  const paginationData = {
    page: 2,
    pages: 5,
    total: 50,
    limit: 10,
    has_prev: true,
    has_next: true,
  };

  it('renders page info and navigation buttons', () => {
    const onChange = vi.fn();
    render(<Pagination pagination={paginationData} onChange={onChange} />);

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText('11–20')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    const prevBtn = screen.getByLabelText('Previous page');
    const nextBtn = screen.getByLabelText('Next page');

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(prevBtn);
    expect(onChange).toHaveBeenCalledWith(1);

    fireEvent.click(nextBtn);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('disables previous button on first page', () => {
    const onChange = vi.fn();
    render(
      <Pagination
        pagination={{ ...paginationData, page: 1, has_prev: false }}
        onChange={onChange}
      />
    );
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });
});
