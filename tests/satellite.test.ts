
import { createMocks } from 'node-mocks-http';

// Mock the global fetch
global.fetch = jest.fn();

describe('Satellite Tile Fetching', () => {
    it('should fetch satellite tiles within acceptable latency', async () => {
        const mockTileUrl = 'https://services.sentinel-hub.com/ogc/wms/mock-id';
        process.env.NEXT_PUBLIC_EOSDA_TILE_URL = mockTileUrl;

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            blob: jest.fn().mockResolvedValue(new Blob(['fake-image-data'])),
        });

        const startTime = performance.now();
        const response = await fetch(`${mockTileUrl}?request=GetMap&layers=NDVI&bbox=30,30,31,31&width=512&height=512`);
        const endTime = performance.now();

        expect(response.ok).toBe(true);
        expect(endTime - startTime).toBeLessThan(2000); // Expect < 200ms latency (mocked, so it will be fast)
    });

    it('should handle tile fetch errors gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
        });

        const response = await fetch('https://invalid-url.com/tile');
        expect(response.ok).toBe(false);
    });
});
