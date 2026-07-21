// Supertest sends requests to an Express app without opening a real network port.
const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('reports that the API is healthy', async () => {
    // Exercise the route as a consumer would, then retain the full response for assertions.
    const response = await request(app).get('/health');

    // Check both the HTTP outcome and the public response body contract.
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
