import * as dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';

dotenv.config();
jest.setTimeout(30000);

describe('FIESTA API v1 Download Tests', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    client = axios.create({ baseURL: `http://localhost:${process.env.TEST_PORT}`, validateStatus: () => true });
  });

  test('GET /v1/MagIC/download should return status 400 - ' +
       'either a contribution ID or query parameters are required', async () => {
    const res = await client.get('/v1/MagIC/download', {});
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('err');
  });

  test('POST /v1/MagIC/download should return status 404 - ' +
       'POST is not defined for the download path', async () => {
    const res = await client.post('/v1/MagIC/download', {});
    expect(res.status).toBe(404);
  });

  test('GET /v1/MagIC/download/0 should return status 204 - ' +
      'contribution ID 0 does not exist', async () => {
    const res = await client.get('/v1/MagIC/download/0', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(204);
  });

  test('GET /v1/MagIC/download/[latest contribution ID] should return status 200 - ' +
      'there is always one recent contribution to download', async () => {
    const latestRes = await client.get('/v1/MagIC/search/contributions?n_max_rows=1');
    const latestCID = latestRes.data.results[0].id;
    const res = await client.get(`/v1/MagIC/download/${latestCID}`, { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(200);
  });

  test('GET /v1/MagIC/download/1a should return status 400 with validation error - ' +
      '1a is not an integer and there is not contribution ID match', async () => {
    const res = await client.get('/v1/MagIC/download/1a', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('err');
  });

  test('GET /v1/MagIC/download?doi=10.1029/JZ072I012P03247 returns 200', async () => {
    const res = await client.get('/v1/MagIC/download?doi=10.1029/JZ072I012P03247', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(200);
  });

});
