import * as dotenv from 'dotenv';
dotenv.config();

import { Server } from 'http';
import axios, { AxiosInstance } from 'axios';
import waitOn from 'wait-on';
import { API } from '../api';

jest.setTimeout(60000);

describe('MagIC API v0 - Contributions', () => {
  let api: Server;
  let client: AxiosInstance;

  beforeAll(async () => {
    client = axios.create({ baseURL: `http://localhost:${process.env.API_PORT}`, validateStatus: () => true });
    api = API.listen(process.env.API_PORT);
    await waitOn({ resources: [`tcp:localhost:${process.env.API_PORT}`] });
  });

  afterAll(() => {
    api.close();
  });

  test('GET /v0/MagIC/contribution/0 returns 204', async () => {
    const res = await client.get('/v0/MagIC/contribution/0', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(204);
  });

  test('GET /v0/MagIC/contribution/[latest contribution ID] returns 200', async () => {
    const latestRes = await client.get('/v0/MagIC/search/contributions?size=1');
    const latestCID = latestRes.data.results[0][0].id;
    const res = await client.get(`/v0/MagIC/contribution/${latestCID}`, { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(200);
  });

  test('POST /v0/MagIC/contribution returns 404', async () => {
    const res = await client.post('/v0/MagIC/contribution', {});
    expect(res.status).toBe(404);
  });

  test('GET /v0/MagIC/contribution/1a returns 400 with validation error', async () => {
    const res = await client.get('/v0/MagIC/contribution/1a', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('err');
  });

});
