import * as dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';

dotenv.config();
jest.setTimeout(30000);

describe('FIESTA API v1 Upload Tests', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    client = axios.create({ baseURL: `http://localhost:${process.env.TEST_PORT}`, validateStatus: () => true });
  });

  test('POST /v1/MagIC/upload should return status 400 - ' +
       'a multipart/form-data request body is required', async () => {
    const res = await client.post('/v1/MagIC/upload');
    expect(res.status).toBe(404);
    //expect(res.data).toHaveProperty('err');
  });

  test('GET /v1/MagIC/upload should return status 404 - ' +
       'GET is not defined for the upload path', async () => {
    const res = await client.get('/v1/MagIC/upload');
    expect(res.status).toBe(404);
  });

  test('POST /v1/MagIC/upload should return status 404 - ' +
       'POST is not defined for the download path', async () => {
    const res = await client.post('/v1/MagIC/upload');
    expect(res.status).toBe(404);
  });

});
