import { SovereignAgent } from './sovereign-agent';

// Mock dependencies
jest.mock('./vertex-ai', () => ({
    getVertexAIClient: jest.fn().mockReturnValue({
        preview: {
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockResolvedValue({
                    response: {
                        candidates: [{ content: { parts: [{ text: JSON.stringify({ status: "NOMINAL", reasoning: "Test run", actions: [] }) }] } }]
                    }
                })
            })
        }
    }),
    GEMINI_MODEL: 'gemini-1.5-pro-preview-0409'
}));

const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockResolvedValue({ data: [{ rule_content: "Test Rule" }] });

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
            eq: mockEq
        })
    })
}));

describe('SovereignAgent', () => {
    let agent: SovereignAgent;

    beforeEach(() => {
        jest.clearAllMocks();
        agent = new SovereignAgent();
    });

    it('should execute the OODA loop successfully', async () => {
        const result = await agent.run();

        expect(result.status).toBe('success');
        expect(result.plan).toBeDefined();
        expect(result.plan.status).toBe('NOMINAL');

        // Verify logs were written
        expect(mockInsert).toHaveBeenCalled();
    });
});
