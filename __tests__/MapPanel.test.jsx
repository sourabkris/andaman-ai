import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';

// Mock the loader so importLibrary never resolves (avoids async state updates in tests)
jest.mock('@googlemaps/js-api-loader', () => ({
  setOptions: jest.fn(),
  importLibrary: jest.fn().mockReturnValue(new Promise(() => {})), // intentionally pending
}));

import MapPanel from '../components/MapPanel';

describe('MapPanel Component', () => {
  it('renders the map application container', async () => {
    await act(async () => {
      render(<MapPanel itinerary={null} />);
    });
    expect(screen.getByRole('application', { name: /google maps/i })).toBeInTheDocument();
  });

  it('shows placeholder message when no itinerary is provided', async () => {
    await act(async () => {
      render(<MapPanel itinerary={null} />);
    });

    expect(screen.getByText('Interactive Map')).toBeInTheDocument();
    expect(screen.getByText(/generate an itinerary/i)).toBeInTheDocument();
  });

  it('does not show placeholder when itinerary is provided', async () => {
    const mockItinerary = {
      summary: 'Test trip',
      days: [
        {
          day: 1,
          title: 'Day One',
          location: 'Havelock',
          places: [{ name: 'Radhanagar Beach', time: '10:00 AM', duration: '2 hrs', description: 'Beautiful beach' }],
        },
      ],
    };

    await act(async () => {
      render(<MapPanel itinerary={mockItinerary} />);
    });

    expect(screen.queryByText('Interactive Map')).not.toBeInTheDocument();
  });

  it('has a focusable map canvas element', async () => {
    await act(async () => {
      render(<MapPanel itinerary={null} />);
    });
    const mapCanvas = screen.getByLabelText(/map canvas/i);
    expect(mapCanvas).toHaveAttribute('tabIndex', '0');
  });

  it('map container has correct ARIA role and label', async () => {
    await act(async () => {
      render(<MapPanel itinerary={null} />);
    });
    const appRegion = screen.getByRole('application');
    expect(appRegion).toHaveAttribute('aria-label', expect.stringMatching(/google maps/i));
  });
});
