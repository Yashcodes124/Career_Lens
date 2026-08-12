import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../config/db.js', () => ({
  checkDatabaseConnection: vi.fn(async () => true),
}));

describe('health endpoint', () => {
  let app: typeof import('../app.js').default;

  beforeAll(async () => {
    app = (await import('../app.js')).default;
  });

  it('returns service health telemetry', async () => {
    const server = app.listen(0);

    try {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Test server did not bind to a local port.');
      }

      const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        status: 'ok',
        service: 'truehire-api',
        version: '1.0.0',
      });
      expect(typeof body.timestamp).toBe('string');
      expect(typeof body.uptime).toBe('number');
      expect(typeof body.database.connected).toBe('boolean');
      expect(typeof body.database.status).toBe('string');
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
