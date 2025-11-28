
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/farms/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}));

describe('Farm Creation Flow', () => {
    it('should create a farm successfully', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' };

        // Mock Supabase auth response
        (createClient as jest.Mock).mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
            },
            from: jest.fn().mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'farm-123' }, error: null }),
                    }),
                }),
                upsert: jest.fn().mockResolvedValue({ error: null }), // For farm_owners bridge
            }),
        });

        const { req, res } = createMocks({
            method: 'POST',
            body: {
                name: 'Test Farm',
                location: 'Cairo, Egypt',
                total_area: 100,
            },
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.id).toBe('farm-123');
    });

    it('should reject invalid input', async () => {
        const { req } = createMocks({
            method: 'POST',
            body: {
                // Missing name and location
            },
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
