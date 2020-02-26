const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';
import * as dotenv from 'dotenv';
if (isDev) { dotenv.config(); }

import { createReadStream } from 'fs';
import OpenAPIBackend from 'openapi-backend';
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import KoaBodyparser from 'koa-bodyparser';
import json from 'koa-json';
import logger from 'koa-logger';

import root from './paths/root';
import contribution from './paths/contribution';
import download from './paths/download';
import search from './paths/search';

// Define API
const server = new OpenAPIBackend({
  definition: 'dist/public/v0/openapi.yaml',
  handlers: {
    ... root,
    ... contribution,
    ... download,
    ... search,
    validationFail: async (c: OpenAPIContext, ctx: Koa.Context) => {
      ctx.body = { err: c.validation.errors };
      ctx.status = 400;
    },
    notFound: async (c: OpenAPIContext, ctx: Koa.Context) => {
      if (ctx.request.url === '/' ||
          ctx.request.url === '/index.html') {
        ctx.redirect('/v0')
      } else if (ctx.request.url === '/v0' ||
          ctx.request.url === '/v0/' ||
          ctx.request.url === '/v0/index.html') {
        ctx.type = 'html';
        ctx.body = createReadStream('dist/public/v0/index.html');
      } else if (ctx.request.url === '/openapi.yaml' ||
          ctx.request.url === '/v0/openapi.yaml') {
        ctx.type = 'text';
        ctx.body = createReadStream('dist/public/v0/openapi.yaml');
      } else {
        ctx.body = { err: `Path '${ctx.request.path}' is not defined for this API. See https://api.docs.earthref.org for more information.` };
        ctx.status = 404;
      }
    },
    notImplemented: async (c: OpenAPIContext, ctx: Koa.Context) => {
      const { status, mock } = c.api.mockResponseForOperation(c.operation.operationId);
      ctx.body = mock;
      ctx.status = status;
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
      message: err.message
    };
  }
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
    ctx,
  ),
);
API.listen(isTest && process.env.TEST_PORT || process.env.PORT);
export { API };
console.log('FIESTA API listening on port', isTest && process.env.TEST_PORT || process.env.PORT);
