import * as dotenv from 'dotenv';
dotenv.config();

import axios, { AxiosInstance } from 'axios';
import waitOn from 'wait-on';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

jest.setTimeout(60000);

describe('FIESTA API v1', () => {
  let start: ChildProcessWithoutNullStreams;
  let client: AxiosInstance;

  beforeAll(async () => {
    client = axios.create({ baseURL: `http://localhost:${process.env.TEST_PORT}`, validateStatus: () => true });
    start = spawn('npm', ['start'], { cwd: __dirname, detached: true });
    await waitOn({ resources: [`tcp:localhost:${process.env.TEST_PORT}`] });
  });

  afterAll(async () => {
    process.kill(-start.pid, 'SIGINT');
    await waitOn({ reverse: true, resources: [`tcp:localhost:${process.env.TEST_PORT}`] });
  });

  test('GET /health-check returns 200', async () => {
    const res = await client.get('/health-check', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(200);
  });

  // Contribution
  test('GET /v1/MagIC/contribution/0 returns 204', async () => {
    const res = await client.get('/v1/MagIC/contribution/0', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(204);
  });
  test('GET /v1/MagIC/contribution/[latest contribution ID] returns 200', async () => {
    const latestRes = await client.get('/v1/MagIC/search/contributions?size=1');
    const latestCID = latestRes.data.results[0].id;
    const res = await client.get(`/v1/MagIC/contribution/${latestCID}`, { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(200);
  });
  test('POST /v1/MagIC/contribution returns 404', async () => {
    const res = await client.post('/v1/MagIC/contribution', {});
    expect(res.status).toBe(404);
  });
  test('GET /v1/MagIC/contribution/1a returns 400 with validation error', async () => {
    const res = await client.get('/v1/MagIC/contribution/1a', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('err');
  });

  // Download
  test('POST /v1/MagIC/download doi=10.1029/JZ072I012P03247 returns 200', async () => {
    const res = await client.post('/v1/MagIC/download', { doi: '10.1029/JZ072I012P03247' }, { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(200);
  });

  // Search
  test('GET /v1/MagIC/search/contributions returns 10 or less results', async () => {
    const res = await client.get('/v1/MagIC/search/contributions');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('total');
    expect(res.data).toHaveProperty('size');
    expect(res.data.size).toBeLessThanOrEqual(10);
    expect(res.data).toHaveProperty('from');
    expect(res.data.from).toBe(0);
    expect(res.data).toHaveProperty('results');
    expect(res.data.results.length).toBeLessThanOrEqual(res.data.size);
  });
  test('GET /v1/MagIC/search/contributions returns 5 or less results', async () => {
    const res = await client.get('/v1/MagIC/search/contributions?size=5');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('total');
    expect(res.data).toHaveProperty('size');
    expect(res.data.size).toBeLessThanOrEqual(5);
    expect(res.data).toHaveProperty('from');
    expect(res.data.from).toBe(0);
    expect(res.data).toHaveProperty('results');
    expect(res.data.results.length).toBeLessThanOrEqual(res.data.size);
  });
  test('GET /v1/MagIC/search/contributions query for "basalt" returns 800 or more results', async () => {
    const res = await client.get('/v1/MagIC/search/contributions?query=basalt&size=1');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('total');
    expect(res.data.total).toBeGreaterThanOrEqual(800);
    expect(res.data).toHaveProperty('from');
    expect(res.data.from).toBe(0);
    expect(res.data).toHaveProperty('results');
    expect(res.data.results.length).toBeLessThanOrEqual(res.data.size);
  });

});
