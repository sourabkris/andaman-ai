// Mock NextResponse before anything else - jsdom doesn't have the Web Response API
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init = {}) => ({
      status: init.status || 200,
      json: async () => data,
    }),
  },
}));

jest.mock('@/lib/gemini', () => ({
  getTravelModel: jest.fn(),
}));

const { getTravelModel } = require('@/lib/gemini');

// Helper to create a mock NextRequest
function makeRequest(body, headers = {}) {
  return {
    json: async () => body,
    headers: {
      get: (key) => headers[key] || null,
    },
  };
}

describe('POST /api/chat', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key-1234';
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });

  async function getPost() {
    const mod = await import('../../app/api/chat/route.js');
    return mod.POST;
  }

  it('returns 400 when message is missing', async () => {
    const POST = await getPost();
    const req = makeRequest({ history: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/message is required/i);
  });

  it('returns 400 when message is not a string', async () => {
    const POST = await getPost();
    const req = makeRequest({ message: 42, history: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/must be a string/i);
  });

  it('returns 413 when message exceeds 2000 characters', async () => {
    const POST = await getPost();
    const req = makeRequest({ message: 'a'.repeat(2001), history: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(413);
    expect(body.error).toMatch(/too long/i);
  });

  it('returns 413 when history is too long', async () => {
    const POST = await getPost();
    const req = makeRequest({
      message: 'Plan my trip',
      history: new Array(51).fill({ role: 'user', content: 'hi' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(413);
    expect(body.error).toMatch(/history too long/i);
  });

  it('returns 500 when GEMINI_API_KEY is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    const POST = await getPost();
    const req = makeRequest({ message: 'Plan my trip', history: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/api_key/i);
  });

  it('returns structured JSON on successful Gemini response', async () => {
    const mockItinerary = {
      summary: 'A 5-day trip.',
      total_budget: '₹30000',
      days: [{ day: 1, title: 'Arrival', location: 'Port Blair', places: [] }],
    };

    // Must re-require after resetModules to get a fresh mock reference
    jest.mock('@/lib/gemini', () => ({
      getTravelModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockResolvedValue({
            response: { text: () => JSON.stringify(mockItinerary) },
          }),
        }),
      }),
    }));

    const POST = await getPost();
    const req = makeRequest({ message: 'Plan a 5-day trip', history: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ summary: 'A 5-day trip.' });
    expect(body).toHaveProperty('days');
  });
});
