// Mock NextResponse before anything else - jsdom doesn't have the Web Response API
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init = {}) => ({
      status: init.status || 200,
      json: async () => data,
    }),
  },
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    calendar: jest.fn().mockReturnValue({
      events: {
        insert: jest.fn(),
      },
    }),
  },
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

const { getServerSession } = require('next-auth/next');
const { google } = require('googleapis');

function makeRequest(body) {
  return {
    json: async () => body,
  };
}

const mockItinerary = {
  summary: 'Test trip',
  total_budget: '₹20000',
  days: [
    {
      day: 1,
      title: 'Arrival',
      location: 'Port Blair',
      transport: 'Taxi',
      estimated_cost: '₹3000',
      places: [
        { name: 'Cellular Jail', time: '10:00 AM', duration: '2 hrs', description: 'Historic site' },
      ],
    },
  ],
};

describe('POST /api/calendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function getPost() {
    const mod = await import('../../app/api/calendar/route.js');
    return mod.POST;
  }

  it('returns 401 when user is not authenticated', async () => {
    getServerSession.mockResolvedValue(null);
    const POST = await getPost();
    const req = makeRequest({ itinerary: mockItinerary });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('returns 401 when session has no accessToken', async () => {
    getServerSession.mockResolvedValue({ user: { name: 'Test' } }); // no accessToken
    const POST = await getPost();
    const req = makeRequest({ itinerary: mockItinerary });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when itinerary is missing', async () => {
    getServerSession.mockResolvedValue({ accessToken: 'valid-token', user: {} });
    const POST = await getPost();
    const req = makeRequest({});
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/invalid or empty/i);
  });

  it('returns 400 when itinerary.days is empty', async () => {
    getServerSession.mockResolvedValue({ accessToken: 'valid-token', user: {} });
    const POST = await getPost();
    const req = makeRequest({ itinerary: { ...mockItinerary, days: [] } });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 413 when itinerary exceeds 30 days', async () => {
    getServerSession.mockResolvedValue({ accessToken: 'valid-token', user: {} });
    const POST = await getPost();
    const bigItinerary = { ...mockItinerary, days: new Array(31).fill(mockItinerary.days[0]) };
    const req = makeRequest({ itinerary: bigItinerary });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(413);
    expect(body.error).toMatch(/exceeds maximum/i);
  });

  it('returns success with event links on valid request', async () => {
    getServerSession.mockResolvedValue({ accessToken: 'valid-token', user: {} });

    const mockCalendar = google.calendar();
    mockCalendar.events.insert.mockResolvedValue({
      data: { htmlLink: 'https://calendar.google.com/event/1' },
    });

    const POST = await getPost();
    const req = makeRequest({ itinerary: mockItinerary });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.events).toEqual(
      expect.arrayContaining([expect.stringContaining('calendar.google.com')])
    );
  });
});
