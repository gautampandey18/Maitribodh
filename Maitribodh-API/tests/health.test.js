import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('returns the load-balancer health response', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('unknown routes', () => {
  it('returns a consistent JSON not-found error', async () => {
    const response = await request(createApp()).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'No route for GET /missing',
      },
    });
  });
});