import Sentry from '@sentry/node';
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
    dsn: "https://30ae127d9fbc1a9d9228e2be8518a63a@o4510790707052544.ingest.us.sentry.io/4510790713212928",
    integrations: [
        nodeProfilingIntegration(),
    ],

    // Send structured logs to Sentry
    enableLogs: true,
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is evaluated only once per SDK.init call
    profileSessionSampleRate: 1.0,
    // Trace lifecycle automatically enables profiling during active traces
    profileLifecycle: 'trace',
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});

import { createReadStream } from 'fs';
import OpenAPIBackend from 'openapi-backend';
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import KoaBody from 'koa-body';
import json from 'koa-json';
import logger from 'koa-logger';

import v1Handers from './v1/handlers';
import v1InternalHanders from './v1/internal.handlers';
import vNextHanders from './vNext/handlers';

const isTest = process.env.NODE_ENV === 'testing';
export const isDev = isTest || process.env.TS_NODE_DEV;
const src = `${isDev ? 'src' : 'dist'}/public`;
const vs = ['v1', 'v1/internal', 'vNext'];
const vDefault = 'v1'; // default version

const server = new OpenAPIBackend({
	definition: `${isDev ? 'src' : 'dist'}/openapi.yaml`,
	handlers: {
		...v1Handers,
		...v1InternalHanders,
		...vNextHanders,
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
				errors: [
					{
						message:
							`Path '${ctx.request.path}' is not defined for this API. ` +
							'See https://api.earthref.org for more information.',
					},
				],
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
						errors: validation.errors,
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
						errors: headerValidation.errors,
					};
					return;
				}
			}
		},
		notImplemented: async (c: OpenAPIContext, ctx: Koa.Context) => {
			ctx.status = 501;
			ctx.body = {
				errors: [
					{ message: 'This endpoint is defined, but not yet implemented.' },
				],
			};
		},
	},
	ajvOpts: {
		schemaId: 'id',
	},
});
server.init();

const API = new Koa();

Sentry.setupKoaErrorHandler(API);

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

// Parse request bodies
API.use(
	KoaBody({
		multipart: true,
		jsonLimit: '1GB',
		textLimit: '1GB',
	})
);

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
