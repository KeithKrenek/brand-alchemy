// src/components/__tests__/Auth.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Auth from '@/components/Auth';
import { mockAuth, mockFirestore, mockNavigate } from '@/setupTests';

describe('Auth Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderAuth = () => {
    return render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );
  };

  it('renders the auth form', () => {
    renderAuth();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('handles successful login for existing user', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    mockAuth.signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
    mockFirestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        hasCompletedInterview: false,
        interviewId: null
      })
    });

    renderAuth();

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});