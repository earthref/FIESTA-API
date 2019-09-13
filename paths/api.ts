import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import { esCheckConnection } from '../server/es';

export default {
  getHealthCheck: async (c: OpenAPIContext, ctx: Koa.Context) => {
    try {
      ctx.status = await esCheckConnection() ? 200 : 500;
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  },
};
