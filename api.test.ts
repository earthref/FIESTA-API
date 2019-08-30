import * as dotenv from 'dotenv';
dotenv.config();

import { Server } from 'http';
import axios, { AxiosInstance } from 'axios';
import waitOn from 'wait-on';
import { API } from './api';

jest.setTimeout(15000);

describe('FIESTA API - Contributions', () => {
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

  test('GET /unknown returns 404', async () => {
    const res = await client.get('/unknown');
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty('err');
  });
});
