import { jest, describe, beforeAll, test, expect } from '@jest/globals';
import * as dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';

dotenv.config();
jest.setTimeout(30000);

describe('FIESTA API v0 Private Download Tests', () => {
	let client: AxiosInstance;

	beforeAll(async () => {
		client = axios.create({
			baseURL: `http://localhost:${process.env.PORT}`,
			validateStatus: () => true,
		});
	});

	test('GET /v0/MagIC/private/download should return status 401', async () => {
		const res = await client.get('/v0/MagIC/private/download');
		expect(res.status).toBe(401);
		expect(res.data).toHaveProperty('errors');
	});

	test(
		'GET /v0/MagIC/private/download should return status 400 - ' +
			'either a contribution ID or query parameters are required',
		async () => {
			const res = await client.get('/v0/MagIC/private/download', {
				auth: {
					username: process.env.TEST_USERNAME,
					password: process.env.TEST_PASSWORD,
				},
			});
			expect(res.status).toBe(400);
			expect(res.data).toHaveProperty('errors');
		}
	);

	test(
		'POST /v0/MagIC/private/download should return status 404 - ' +
			'POST is not defined for the download path',
		async () => {
			const res = await client.post('/v0/MagIC/private/download', {
				auth: {
					username: process.env.TEST_USERNAME,
					password: process.env.TEST_PASSWORD,
				},
			});
			expect(res.status).toBe(404);
		}
	);

	test(
		'GET /v0/MagIC/private/download?id=1 should return status 204 - ' +
			'there are no private contributions with this contribution ID',
		async () => {
			const res = await client.get('/v0/MagIC/private/download?id=1', {
				auth: {
					username: process.env.TEST_USERNAME,
					password: process.env.TEST_PASSWORD,
				},
			});
			expect(res.status).toBe(204);
		}
	);

	test(
		'GET /v0/MagIC/download?id=[latest contribution ID] should return status 200 - ' +
			'there is always one recent contribution to download',
		async () => {
			const latestRes = await client.get(
				'/v0/MagIC/private/search/contributions?n_max_rows=1'
			);
			const latestCID = latestRes.data.results[0].id;
			const res = await client.get(
				`/v0/MagIC/private/download?id=${latestCID}`
			);
			expect(res.status).toBe(200);
		}
	);

	test(
		'GET /v0/MagIC/download?id=1a should return status 400 with validation error - ' +
			'1a is not an integer and there is not contribution ID match',
		async () => {
			const res = await client.get('/v0/MagIC/private/download?id=1a');
			expect(res.status).toBe(400);
			expect(res.data).toHaveProperty('errors');
		}
	);
});
