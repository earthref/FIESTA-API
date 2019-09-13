import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') { dotenv.config(); }

import { Server } from 'http';
import axios, { AxiosInstance } from 'axios';
import waitOn from 'wait-on';
import { API } from '../index';

jest.setTimeout(60000);

describe('FIESTA API v0', () => {
  let api: Server;
  let client: AxiosInstance;

  beforeAll(async () => {
    client = axios.create({ baseURL: `http://localhost:${process.env.PORT}`, validateStatus: () => true });
    api = API.listen(process.env.PORT);
    await waitOn({ resources: [`tcp:localhost:${process.env.PORT}`] });
  });

  afterAll(() => {
    api.close();
  });

  test('GET /health-check returns 200', async () => {
    const res = await client.get('/health-check', { headers: { 'Accept': 'text/plain' }});
    expect(res.status).toBe(200);
  });

});
