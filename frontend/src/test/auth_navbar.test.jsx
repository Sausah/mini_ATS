import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

describe('Navbar Tools', () => {
  it('renders quick search input, notifications button, and user avatar', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthProvider>
    );

    // Quick search input
    expect(screen.getByPlaceholderText(/Quick search candidates…/i)).toBeInTheDocument();

    // Notification bell
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();

    // User profile avatar button
    expect(screen.getByLabelText('User profile menu')).toBeInTheDocument();
  });

  it('toggles user profile menu on click', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthProvider>
    );

    const avatarBtn = screen.getByLabelText('User profile menu');
    fireEvent.click(avatarBtn);

    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });
});

describe('Login Page', () => {
  it('renders email, password inputs, submit button, and demo login button', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In as Admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1-Click Demo Admin Login/i })).toBeInTheDocument();
  });
});
