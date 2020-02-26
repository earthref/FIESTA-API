const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';
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

const v = 'v1';

// Define API
const server = new OpenAPIBackend({
  definition: 'src/public/v1/openapi.yaml',
  handlers: {
    ... root,
    ... contribution,
    ... download,
    ... search,
    validationFail: async (c: OpenAPIContext, ctx: Koa.Context) => {
      ctx.status = 400;
      ctx.body = { err: c.validation.errors };
    },
    notFound: async (c: OpenAPIContext, ctx: Koa.Context) => {
      const url = ctx.request.url;
      const src = `${isDev ? 'src' : 'dist'}/public`;
      if (url === '/' || url === '/index.html') {
        ctx.redirect(`/${v}`);
      }
      else if (url === `/${v}` || url === `/${v}/` || url === `/${v}/index.html`) {
        ctx.type = 'html'; ctx.body = createReadStream(`${src}/${v}/index.html`);
      }
      else if (url === '/openapi.yaml' || url === `/${v}/openapi.yaml`) {
        ctx.type = 'text'; ctx.body = createReadStream(`${src}/${v}/openapi.yaml`);
      }
      else if (url === '/favicon.ico') {
        ctx.type = 'ico'; ctx.body = createReadStream(`${src}/favicon.ico`);
      }
      else {
        ctx.status = 404;
        ctx.body = {
          err: `Path '${ctx.request.path}' is not defined for this API. ` +
            `See https://api.earthref.org for more information.`
        };
      }
    },
    notImplemented: async (c: OpenAPIContext, ctx: Koa.Context) => {
      const { status, mock } = c.api.mockResponseForOperation(c.operation.operationId);
      ctx.status = status;
      ctx.body = mock;
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
