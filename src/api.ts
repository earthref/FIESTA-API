import * as dotenv from 'dotenv';

const isTest = process.env.NODE_ENV === 'testing';
const isDev = isTest || process.env.NODE_ENV === 'development';
if (isDev) {
	dotenv.config();
}

import { createReadStream } from 'fs';
import OpenAPIBackend from 'openapi-backend';
import { Context as OpenAPIContext } from 'openapi-backend/backend';
// import { dereference as OpenAPIParse } from 'swagger-parser';

import Koa from 'koa';
import KoaBodyparser from 'koa-bodyparser';
import json from 'koa-json';
import logger from 'koa-logger';

import v0root from './v0/path/root';
import v0download from './v0/path/download';
import v0search from './v0/path/search';
import v0privateCreateUpdateDelete from './v0/path/private';
import v0privateDownload from './v0/path/private.download';
import v0privateSearch from './v0/path/private.search';

import v1root from './v1/path/root';

const vs = ['v0', 'v1'];
const vDefault = 'v0'; // default version
const src = `${isDev ? 'src' : 'dist'}/public`;

// Define API

const server = new OpenAPIBackend({
	definition: `src/openapi.yaml`,
	handlers: {
		...v0root,
		...v0download,
		...v0search,
		...v0privateCreateUpdateDelete,
		...v0privateDownload,
		...v0privateSearch,
		...v1root,
		validationFail: async (c: OpenAPIContext, ctx: Koa.Context) => {
			ctx.status = 400;
			ctx.body = { errors: c.validation.errors };
		},
		notFound: async (c: OpenAPIContext, ctx: Koa.Context) => {
			const { url } = ctx.request;
			if (url === '/' || url === '/index.html') {
				return ctx.redirect(`/${vDefault}`);
			}
			if (url === '/openapi.yaml') {
				ctx.type = 'text/plain; charset=utf-8';
				ctx.body = createReadStream(`${src}/${vDefault}/openapi.yaml`);
				return;
			}
			if (url === '/favicon.ico') {
				ctx.type = 'image/x-icon';
				ctx.body = createReadStream(`${src}/favicon.ico`);
				return;
			}
			for (const v of vs) {
				if (url === `/${v}` || url === `/${v}/` || url === `/${v}/index.html`) {
					ctx.type = 'text/html; charset=utf-8';
					ctx.body = createReadStream(`${src}/${v}/index.html`);
					return;
				}
				if (url === `/${v}/openapi.yaml`) {
					ctx.type = 'text/plain; charset=utf-8';
					ctx.body = createReadStream(`${src}/${v}/openapi.yaml`);
					return;
				}
			}
			ctx.status = 404;
			ctx.body = {
				err:
					`Path '${ctx.request.path}' is not defined for this API. ` +
					'See https://api.earthref.org for more information.',
			};
		},
		postResponseHandler: async (c: OpenAPIContext, ctx: Koa.Context) => {
			if (c.operation) {
				const validation = c.api.validateResponse(
					ctx.body,
					c.operation,
					ctx.status
				);
				if (validation.errors) {
					ctx.status = 502;
					ctx.body = {
						err: validation.errors,
					};
					return;
				}
				const headerValidation = c.api.validateResponseHeaders(
					ctx.headers,
					c.operation,
					{
						statusCode: ctx.status,
					}
				);
				if (headerValidation.errors) {
					ctx.status = 502;
					ctx.body = {
						err: headerValidation.errors,
					};
					return;
				}
			}
		},
	},
	ajvOpts: {
		schemaId: 'auto',
	},
});
server.init();

const API = new Koa();

// Return JSON errors
API.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		ctx.status = err.statusCode || err.status || 500;
		ctx.body = {
			status: ctx.status,
			err: err.message,
		};
		ctx.app.emit('error', err, ctx);
	}
});
API.on('error', (err, ctx) => {
	console.error(ctx.request, err);
});

// Serve API endpoints
API.use(KoaBodyparser());

// Log requests
if (isDev) API.use(logger());

// Pretty print JSON output
API.use(json());

// Use API as Koa middleware
API.use((ctx) =>
	server.handleRequest(
		{
			method: ctx.request.method,
			path: ctx.request.path,
			body: ctx.request.body,
			query: ctx.request.query,
			headers: ctx.request.headers,
		},
		ctx
	)
);
API.listen((isTest && process.env.TEST_PORT) || process.env.PORT);
console.log(
	'FIESTA API is listening on port:',
	(isTest && process.env.TEST_PORT) || process.env.PORT
);
export { API as default };
