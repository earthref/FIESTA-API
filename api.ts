import path from 'path';
import OpenAPIBackend from 'openapi-backend';
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import KoaBodyparser from 'koa-bodyparser';
import json from 'koa-json';
import logger from 'koa-logger';

import contribution from './paths/contribution';
import search from './paths/search';

const API = new Koa();
API.use(KoaBodyparser());

// Define API
const server = new OpenAPIBackend({
  definition: path.join(__dirname, 'docs', 'openapi.yaml'),
  handlers: {
    ... contribution,
    ... search,
    validationFail: async (c: OpenAPIContext, ctx: Koa.Context) => {
      ctx.body = { err: c.validation.errors };
      ctx.status = 400;
    },
    notFound: async (c: OpenAPIContext, ctx: Koa.Context) => {
      ctx.body = { err: 'not found here' };
      ctx.status = 404;
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

export { API };
