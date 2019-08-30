import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import { s3GetContributionByID } from '../server/s3';

export default {
  getContributionByID: async (c: OpenAPIContext, ctx: Koa.Context) => {
    const id: string = c.request.params.id instanceof Array ? c.request.params.id[0] : c.request.params.id;
    try {
      ctx.body = await s3GetContributionByID({ id, format: ctx.accepts('text/plain') ? 'text' : 'json' });
      if (ctx.body === undefined) {
        ctx.status = 204;
      }
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  },
};
