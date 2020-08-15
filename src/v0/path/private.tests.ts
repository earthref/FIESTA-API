import { jest, describe, beforeAll, test, expect } from '@jest/globals';
import * as dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';

dotenv.config();
jest.setTimeout(30000);
const v = 'v0';

describe(`FIESTA API ${v} Private Create/Update/Delete Tests`, () => {
	let client: AxiosInstance;

	beforeAll(async () => {
		client = axios.create({
			baseURL: `http://localhost:${process.env.PORT}`,
			validateStatus: () => true,
		});
	});

	test(`POST /${v}/MagIC/private should return status 401`, async () => {
		const res = await client.post(`/${v}/MagIC/private`);
		expect(res.status).toBe(401);
		expect(res.data).toHaveProperty('errors');
	});

	test(`POST /${v}/MagIC/private and DELETE /${v}/MagIC/private`, async () => {
		const createRes = await client.post(`/${v}/MagIC/private`, {}, {
			auth: {
				username: process.env.TEST_USERNAME,
				password: process.env.TEST_PASSWORD,
			},
		});
		expect(createRes.status).toBe(200);
		expect(createRes.data).toHaveProperty('id');
		expect(createRes.data.id).toBeGreaterThanOrEqual(1);
		const deleteRes = await client.delete(
			`/${v}/MagIC/private?id=${createRes.data.id}`,
			{
				auth: {
					username: process.env.TEST_USERNAME,
					password: process.env.TEST_PASSWORD,
				},
			}
		);
		expect(deleteRes.status).toBe(200);
		expect(deleteRes.data).toHaveProperty('records_deleted');
		expect(deleteRes.data.records_deleted).toEqual(1);
	});
});
