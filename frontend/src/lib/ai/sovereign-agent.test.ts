import { SovereignAgent } from './sovereign-agent';
import { createClient } from '@supabase/supabase-js';
import { getVertexAIClient } from './vertex-ai';

// Mock dependencies
jest.mock('./vertex-ai');
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ rule_content: "Test Rule" }] })
        }))
    }))
}));
jest.mock('./tools/esoda', () => ({
    fetchESODAData: jest.fn().mockResolvedValue({ moisture: 20, nitrogen: 10 })
}));
jest.mock('./tools/vercel', () => ({
    redeployProject: jest.fn().mockResolvedValue(true)
}));

describe('SovereignAgent', () => {
    let agent: SovereignAgent;
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockResolvedValue({ data: [{ rule_content: "Test Rule" }] });

    const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
            candidates: [{ content: { parts: [{ text: JSON.stringify({ status: "NOMINAL", reasoning: "Test run", actions: [], severity: "NOMINAL", judgment: "All good" }) }] } }]
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Vertex AI Mock
        (getVertexAIClient as jest.Mock).mockReturnValue({
            preview: {
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent
                })
            }
        });

        // Setup Supabase Mock
        (createClient as jest.Mock).mockImplementation(() => ({
            from: jest.fn().mockReturnValue({
                insert: mockInsert,
                select: mockSelect,
                eq: mockEq
            })
        }));

        agent = new SovereignAgent();
    });

    it('should execute the OODA loop successfully', async () => {
        const result = await agent.run();

        expect(result.status).toBe('success');
        expect(result.plan).toBeDefined();

        // Verify logs were written
        expect(mockInsert).toHaveBeenCalled();
    });
});
