import * as dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';

dotenv.config();
jest.setTimeout(30000);

describe('FIESTA API v1 Root Tests', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    client = axios.create({ baseURL: `http://localhost:${process.env.TEST_PORT}`, validateStatus: () => true });
  });
  
  test('GET /health-check returns 200 OK', async () => {
    const res = await client.get('/v1/health-check', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(200);
  });
  
  test('GET /authenticate returns 401 Unauthorized', async () => {
    const res = await client.get('/v1/authenticate', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(401);
  });

});
