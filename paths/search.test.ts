import * as dotenv from 'dotenv';
dotenv.config();

import { Server } from 'http';
import axios, { AxiosInstance } from 'axios';
import waitOn from 'wait-on';
import { API } from '../api';

jest.setTimeout(15000);

describe('MagIC API v0 - Search', () => {
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

  test('GET /v0/MagIC/search/contributions returns 10 or less results', async () => {
    const res = await client.get('/v0/MagIC/search/contributions');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('total');
    expect(res.data).toHaveProperty('size');
    expect(res.data.size).toBeLessThanOrEqual(10);
    expect(res.data).toHaveProperty('from');
    expect(res.data.from).toBe(0);
    expect(res.data).toHaveProperty('results');
    expect(res.data.results.length).toBeLessThanOrEqual(res.data.size);
  });

  test('GET /v0/MagIC/search/contributions returns 5 or less results', async () => {
    const res = await client.get('/v0/MagIC/search/contributions?size=5');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('total');
    expect(res.data).toHaveProperty('size');
    expect(res.data.size).toBeLessThanOrEqual(5);
    expect(res.data).toHaveProperty('from');
    expect(res.data.from).toBe(0);
    expect(res.data).toHaveProperty('results');
    expect(res.data.results.length).toBeLessThanOrEqual(res.data.size);
  });

});
