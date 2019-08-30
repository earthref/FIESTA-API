import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import { esGetSearchByTable } from '../server/es';

export default {
  getSearchByTable: async (c: OpenAPIContext, ctx: Koa.Context) => {
    const table: string = c.request.params.table instanceof Array ? c.request.params.table[0] : c.request.params.table;
    const size: string = c.request.query.size instanceof Array ? c.request.query.size[0] : c.request.query.size;
    const from: string = c.request.query.from instanceof Array ? c.request.query.from[0] : c.request.query.from;
    const query: string = c.request.query.query instanceof Array ? c.request.query.query[0] : c.request.query.query;
    try {
      ctx.body = await esGetSearchByTable({
        table: table === 'contributions' ? 'contribution' : table,
        ...(size !== undefined && { size: Number.parseInt(size, 10) } || {}),
        ...(from !== undefined && { from: Number.parseInt(from, 10) } || {}),
        ...(query !== undefined && { query } || {}),
      });
      if (ctx.body === undefined) {
        ctx.status = 204;
      }
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  },
};
