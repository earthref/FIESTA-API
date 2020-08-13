import * as dotenv from 'dotenv';

const isTest = process.env.NODE_ENV === 'testing';
const isDev = isTest || process.env.NODE_ENV === 'development';
if (isDev) {
	dotenv.config();
}

import { createReadStream } from 'fs';
import OpenAPIBackend from 'openapi-backend';
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import KoaBodyparser from 'koa-bodyparser';
import json from 'koa-json';
import logger from 'koa-logger';

import root from './paths/root';
import download from './paths/download';
import search from './paths/search';
import privateCreateUpdateDelete from './paths/private';
import privateDownload from './paths/private.download';
import privateSearch from './paths/private.search';

const v = 'v1';
const src = `${isDev ? 'src' : 'dist'}/public`;

// Define API
const server = new OpenAPIBackend({
	definition: `${src}/${v}/openapi.yaml`,
	handlers: {
		...root,
		...download,
		...search,
		...privateCreateUpdateDelete,
		...privateDownload,
		...privateSearch,
		validationFail: async (c: OpenAPIContext, ctx: Koa.Context) => {
			ctx.status = 400;
			ctx.body = { err: c.validation.errors };
		},
		notFound: async (c: OpenAPIContext, ctx: Koa.Context) => {
			const { url } = ctx.request;
			if (url === '/' || url === '/index.html') {
				ctx.redirect(`/${v}`);
			} else if (
				url === `/${v}` ||
				url === `/${v}/` ||
				url === `/${v}/index.html`
			) {
				ctx.type = 'text/html; charset=utf-8';
				ctx.body = createReadStream(`${src}/${v}/index.html`);
			} else if (url === '/openapi.yaml' || url === `/${v}/openapi.yaml`) {
				ctx.type = 'text/plain; charset=utf-8';
				ctx.body = createReadStream(`${src}/${v}/openapi.yaml`);
			} else if (url === '/favicon.ico') {
				ctx.type = 'image/x-icon';
				ctx.body = createReadStream(`${src}/favicon.ico`);
			} else {
				ctx.status = 404;
				ctx.body = {
					err:
						`Path '${ctx.request.path}' is not defined for this API. ` +
						'See https://api.earthref.org for more information.',
				};
			}
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
