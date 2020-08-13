import { jest, describe, beforeAll, test, expect } from '@jest/globals';
import * as dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';

dotenv.config();
jest.setTimeout(30000);

describe('FIESTA API v1 Private Create/Update/Delete Tests', () => {
	let client: AxiosInstance;

	beforeAll(async () => {
		client = axios.create({
			baseURL: `http://localhost:${process.env.PORT}`,
			validateStatus: () => true,
		});
	});

	test('POST /v1/MagIC/private should return status 401', async () => {
		const res = await client.post('/v1/MagIC/private');
		expect(res.status).toBe(401);
		expect(res.data).toHaveProperty('errors');
	});
});
