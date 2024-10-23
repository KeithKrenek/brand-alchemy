// src/components/__tests__/Chat.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Chat from '@/components/Chat';
import { mockAuth, mockFirestore, mockNavigate } from '@/setupTests';

// Mock Firebase auth and firestore
const mockGetDoc = getDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockAuth = getAuth as jest.Mock;

describe('Chat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated user
    mockAuth.mockImplementation(() => ({
      currentUser: { uid: 'test-uid' }
    }));
    // Mock existing interview
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        threadId: 'mock-thread-id',
        messages: []
      })
    });
  });

  const renderChat = () => {
    return render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );
  };

  it('renders chat interface', () => {
    renderChat();
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('maintains focus on textarea after sending message', async () => {
    renderChat();
    const textarea = screen.getByPlaceholderText(/type your message/i);
    
    await userEvent.type(textarea, 'Test message');
    expect(textarea).toHaveFocus();
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(textarea).toHaveFocus();
    });
  });

  it('handles message submission', async () => {
    renderChat();
    const textarea = screen.getByPlaceholderText(/type your message/i);
    
    await userEvent.type(textarea, 'Test message');
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      // Check if message appears in chat
      expect(screen.getByText('Test message')).toBeInTheDocument();
      // Check if textarea is cleared
      expect(textarea).toHaveValue('');
    });
  });

  it('displays loading state while sending message', async () => {
    renderChat();
    const textarea = screen.getByPlaceholderText(/type your message/i);
    
    await userEvent.type(textarea, 'Test message');
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled();
    });
  });

  it('handles errors gracefully', async () => {
    // Mock API error
    vi.mock('../hooks/useOpenAI', () => ({
      useOpenAI: () => ({
        callOpenAI: vi.fn().mockRejectedValue(new Error('API Error')),
        isLoading: false
      })
    }));

    renderChat();
    const textarea = screen.getByPlaceholderText(/type your message/i);
    
    await userEvent.type(textarea, 'Test message');
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/failed to send your message/i)).toBeInTheDocument();
    });
  });
});