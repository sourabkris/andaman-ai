import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarButton from '../components/CalendarButton';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  __esModule: true,
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

const { useSession, signIn } = require('next-auth/react');

const mockItinerary = {
  summary: 'A 3-day trip.',
  total_budget: '₹20000',
  important_notes: ['Carry sunscreen'],
  days: [
    {
      day: 1,
      title: 'Arrival',
      location: 'Port Blair',
      places: [{ name: 'Cellular Jail', time: '10:00 AM', duration: '2 hrs', description: 'Historic jail' }],
      transport: 'Auto',
      estimated_cost: '₹3000',
    },
  ],
};

describe('CalendarButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders nothing when itinerary is null', () => {
    useSession.mockReturnValue({ data: null });
    const { container } = render(<CalendarButton itinerary={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Sign in to Save Trip" when user is not authenticated', () => {
    useSession.mockReturnValue({ data: null });
    render(<CalendarButton itinerary={mockItinerary} />);
    
    expect(screen.getByRole('button', { name: /save current itinerary/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent(/sign in to save trip/i);
  });

  it('calls signIn when unauthenticated user clicks Save', () => {
    useSession.mockReturnValue({ data: null });
    render(<CalendarButton itinerary={mockItinerary} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(signIn).toHaveBeenCalledWith('google');
  });

  it('shows "Save to Google Calendar" when user is authenticated', () => {
    useSession.mockReturnValue({ data: { user: { name: 'Test User' } } });
    render(<CalendarButton itinerary={mockItinerary} />);
    
    expect(screen.getByRole('button')).toHaveTextContent(/save to google calendar/i);
  });

  it('shows saving state and disables button while saving', async () => {
    useSession.mockReturnValue({ data: { user: { name: 'Test' } } });
    
    let resolveRequest;
    global.fetch.mockReturnValue(
      new Promise(res => { resolveRequest = res; })
    );
    
    render(<CalendarButton itinerary={mockItinerary} />);
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent(/saving/i);
      expect(screen.getByRole('button')).toBeDisabled();
    });
    
    // Resolve to not leave hanging promise
    resolveRequest({ ok: true, json: async () => ({ success: true }) });
  });

  it('shows success link after saving', async () => {
    useSession.mockReturnValue({ data: { user: { name: 'Test' } } });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, events: ['https://calendar.google.com/event/1'] }),
    });
    
    render(<CalendarButton itinerary={mockItinerary} />);
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText(/trip saved to your calendar/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /open google calendar/i })).toBeInTheDocument();
    });
  });

  it('shows inline error message (not alert) when saving fails', async () => {
    useSession.mockReturnValue({ data: { user: { name: 'Test' } } });
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Calendar access denied' }),
    });
    
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CalendarButton itinerary={mockItinerary} />);
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText(/failed to save: calendar access denied/i)).toBeInTheDocument();
    });
    
    // CRITICAL: alert must NOT be called
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
