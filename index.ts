import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import OpenAPIBackend from 'openapi-backend';
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import KoaBodyparser from 'koa-bodyparser';
import json from 'koa-json';
import logger from 'koa-logger';

import contribution from './paths/contribution';
import search from './paths/search';

const latest = 'v0';

const API = new Koa();
API.use(KoaBodyparser());

// Define API
const server = new OpenAPIBackend({
  definition: path.join(__dirname, 'docs', 'v0', 'openapi.yaml'),
  handlers: {
    ... contribution,
    ... search,
    validationFail: async (c: OpenAPIContext, ctx: Koa.Context) => {
      ctx.body = { err: c.validation.errors };
      ctx.status = 400;
    },
    notFound: async (c: OpenAPIContext, ctx: Koa.Context) => {
      if (ctx.request.path === '/') {
        ctx.redirect(latest);
      } else if (ctx.request.path === '/openapi.yaml') {
        ctx.redirect(`${latest}/openapi.yaml`);
      } else if (ctx.request.path === '/v0') {
          ctx.body = fs.readFileSync('docs/v0/index.html', {'encoding': 'utf8'});
          ctx.state = 200;
      } else if (ctx.request.path === '/v0/openapi.yaml') {
          ctx.body = fs.readFileSync('docs/v0/openapi.yaml', {'encoding': 'utf8'});
          ctx.state = 200;
      } else {
        ctx.body = { err: 'not found here' };
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

// Log requests
API.use(logger());

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

API.listen(process.env.API_PORT);
