import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') { dotenv.config(); }

import path from 'path';
import OpenAPIBackend from 'openapi-backend';
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import KoaBodyparser from 'koa-bodyparser';
import json from 'koa-json';
import logger from 'koa-logger';

import api from './paths/api';
import contribution from './paths/contribution';
import search from './paths/search';

const latest = 'v0';

const API = new Koa();
API.use(KoaBodyparser());

// Define API
const server = new OpenAPIBackend({
  definition: path.join(__dirname, 'docs', 'v0', 'openapi.yaml'),
  handlers: {
    ... api,
    ... contribution,
    ... search,
    validationFail: async (c: OpenAPIContext, ctx: Koa.Context) => {
      ctx.body = { err: c.validation.errors };
      ctx.status = 400;
    },
    notFound: async (c: OpenAPIContext, ctx: Koa.Context) => {
      if (
        ctx.request.path === '/' ||
        ctx.request.path === `/${latest}` ||
        ctx.request.path === `/${latest}/`
      ) {
        ctx.redirect('https://api.docs.earthref.org');
      } else if (
        ctx.request.path === '/openapi.yaml' ||
        ctx.request.path === `/${latest}/openapi.yaml`
      ) {
        ctx.redirect(`https://api.docs.earthref.org/${latest}/openapi.yaml`);
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

// Log requests
if (process.env.NODE_ENV === 'development') { API.use(logger()); }

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

API.listen(process.env.PORT);
export { API };
