import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import InterviewScheduleModal from '../components/InterviewScheduleModal';
import CalendarPage from '../pages/CalendarPage';
import { AuthProvider } from '../context/AuthContext';

describe('InterviewScheduleModal', () => {
  const mockCandidate = {
    id: 1,
    full_name: 'Ananya Verma',
    email: 'ananya@example.com',
    job_title: 'Full Stack Engineer',
    stage: 'Screening',
  };

  it('renders modal with prefilled candidate information and email toggle', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <InterviewScheduleModal
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidate}
          />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Schedule Interview & Mail Invite/i)).toBeInTheDocument();
    expect(screen.getByText(/Ananya Verma/i)).toBeInTheDocument();
    expect(screen.getByText(/Send Official Invitation Email to Candidate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schedule & Dispatch Email/i })).toBeInTheDocument();
  });

  it('toggles email customization preview', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <InterviewScheduleModal
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidate}
          />
        </BrowserRouter>
      </AuthProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /Customize Email Template/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Email Subject Line:/i)).toBeInTheDocument();
    expect(screen.getByText(/Email Body Content:/i)).toBeInTheDocument();
  });
});
