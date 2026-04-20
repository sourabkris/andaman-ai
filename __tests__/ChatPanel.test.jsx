import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanel from '../components/ChatPanel';

jest.mock('next-auth/react', () => ({
  __esModule: true,
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: () => {}
}));

describe('ChatPanel Component', () => {
  const mockOnItineraryUpdate = jest.fn();

  beforeEach(() => {
    mockOnItineraryUpdate.mockClear();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation((...args) => {
        process.stdout.write(args.join(' ') + '\n');
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders chat interface with required conversational elements', () => {
    render(<ChatPanel onItineraryUpdate={mockOnItineraryUpdate} />);
    
    // Check for conversational prompt instead of title
    expect(screen.getByText('Tell me about your dream Andaman trip!')).toBeInTheDocument();
    
    // Check for input field placeholder
    expect(screen.getByPlaceholderText(/e.g. 5 days, couple, 30k budget/i)).toBeInTheDocument();
  });

  it('shows loading state and calls API on valid submission', async () => {
    render(<ChatPanel onItineraryUpdate={mockOnItineraryUpdate} />);
    
    // Setup fetch mock for a successful response
    const mockApiResponse = {
      summary: 'A short test trip.',
      total_budget: '1000',
      important_notes: ['Hydrate'],
      days: [
        {
          day: 1,
          title: 'Scuba',
          location: 'Havelock',
          places: [
            { time: '10:00 AM', name: 'Scuba Diving' }
          ]
        }
      ]
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const input = screen.getByPlaceholderText(/e.g. 5 days, couple/i);
    fireEvent.change(input, { target: { value: 'I want a 3-day trip for a couple focusing on scuba diving.' } });
    
    const submitBtn = screen.getByRole('button', { name: /generate itinerary/i });
    fireEvent.click(submitBtn);

    // Verify loading state
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Verify API called with correct payload
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }));

    // Wait for the UI to update to success state
    await waitFor(() => {
      expect(mockOnItineraryUpdate).toHaveBeenCalledWith(mockApiResponse);
      expect(screen.getByText('Itinerary generated!')).toBeInTheDocument();
    });
    
    // Verify input is cleared
    expect(input.value).toBe('');
  });

  it('handles API errors gracefully', async () => {
     render(<ChatPanel onItineraryUpdate={mockOnItineraryUpdate} />);
    
    // Setup fetch mock for a failed response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Too many requests' })
    });

    const input = screen.getByPlaceholderText(/e.g. 5 days, couple/i);
    fireEvent.change(input, { target: { value: 'I want a 3-day trip.' } });
    fireEvent.click(screen.getByRole('button', { name: /generate itinerary/i }));

    // Wait for the UI to show error message
    await waitFor(() => {
      expect(screen.getByText(/Error: Too many requests/i)).toBeInTheDocument();
    });
    
    expect(mockOnItineraryUpdate).not.toHaveBeenCalled();
  });
});
