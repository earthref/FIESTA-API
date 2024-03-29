import { jest, describe, beforeAll, test, expect } from '@jest/globals';
import * as dotenv from 'dotenv';
import axios, { AxiosInstance } from 'axios';

dotenv.config();
jest.setTimeout(30000);
const v = 'v1';

describe(`FIESTA API ${v} Private Create/Update/Append/Delete Tests`, () => {
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
		const createRes = await client.post(
			`/${v}/MagIC/private`,
			{},
			{
				auth: {
					username: process.env.TEST_USERNAME,
					password: process.env.TEST_PASSWORD,
				},
			}
		);
		expect(createRes.status).toBe(201);
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
		expect(deleteRes.data).toHaveProperty('rowsDeleted');
		expect(deleteRes.data.rowsDeleted).toEqual(1);
	});

	test(`PUT /${v}/MagIC/private`, async () => {
        const updateRes = await client.put(
			`/${v}/MagIC/private?id=19933`,
			{ },
			{
				auth: {
					username: process.env.TEST_USERNAME,
					password: process.env.TEST_PASSWORD,
				},
			}
        );
		expect(updateRes.status).toBe(201);
		expect(updateRes.data).toHaveProperty('id');
        expect(updateRes.data.id).toBeGreaterThanOrEqual(1);
	});

	test(`POST /${v}/MagIC/private, PUT /${v}/MagIC/private and DELETE /${v}/MagIC/private`, async () => {
		const createRes = await client.post(
			`/${v}/MagIC/private`,
			{},
			{
				auth: {
					username: process.env.TEST_USERNAME,
					password: process.env.TEST_PASSWORD,
				},
			}
		);
		expect(createRes.status).toBe(201);
		expect(createRes.data).toHaveProperty('id');
        expect(createRes.data.id).toBeGreaterThanOrEqual(1);
        
        const updateRes = await client.put(
			`/${v}/MagIC/private`,
			{ },
			{
				auth: {
					username: process.env.TEST_USERNAME,
					password: process.env.TEST_PASSWORD,
				},
			}
        );
		expect(updateRes.status).toBe(201);
		expect(updateRes.data).toHaveProperty('id');
        expect(updateRes.data.id).toBeGreaterThanOrEqual(1);

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
		expect(deleteRes.data).toHaveProperty('rowsDeleted');
		expect(deleteRes.data.rowsDeleted).toEqual(1);
	});
});
