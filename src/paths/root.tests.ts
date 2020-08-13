import { jest, describe, beforeAll, test, expect } from '@jest/globals';
import * as dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';

dotenv.config();
jest.setTimeout(30000);

describe('FIESTA API v1 Root Tests', () => {
	let client: AxiosInstance;

	beforeAll(async () => {
		client = axios.create({
			baseURL: `http://localhost:${process.env.PORT}`,
			validateStatus: () => true,
		});
	});

	test('GET /v1/health-check returns 200', async () => {
		const res = await client.get('/v1/health-check', {
			headers: { Accept: 'text/plain' },
		});
		expect(res.status).toBe(200);
	});

	test('GET /v1/authenticate returns 401', async () => {
		const res = await client.get('/v1/authenticate', {
			headers: { Accept: 'text/plain' },
		});
		expect(res.status).toBe(401);
	});

	test('GET /v1/authenticate with incorrect basic auth returns 200', async () => {
		const res = await client.get('/v1/authenticate', {
			headers: { Accept: 'text/plain' },
			auth: {
				username: process.env.TEST_USERNAME,
				password: 'wrong',
			},
		});
		expect(res.status).toBe(401);
	});

	test('GET /v1/authenticate with correct basic auth returns 401', async () => {
		const res = await client.get('/v1/authenticate', {
			headers: { Accept: 'text/plain' },
			auth: {
				username: process.env.TEST_USERNAME,
				password: process.env.TEST_PASSWORD,
			},
		});
		expect(res.status).toBe(200);
	});
});
