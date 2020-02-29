/* eslint-disable camelcase */
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import { esGetSearchByTable } from '../server/es';

export default {
  searchByTable: async (c: OpenAPIContext, ctx: Koa.Context) => {
    const { table } = c.request.params;
    const { n_max_rows, from, query } = c.request.query;
    /* if (
      false
    ) {
      ctx.status = 400;
      ctx.body = { err: [{ message: 'at least one query parameter is required' }]};
    } else { */
      const tableFirst: string = table instanceof Array ? table[0] : table;
      const size: number = parseInt(n_max_rows instanceof Array ? n_max_rows[0] : n_max_rows, 10);
      const fromNumber: number = parseInt(from instanceof Array ? from[0] : from, 10);
      const queries: string[] = query instanceof Array ? query : [query];
      ctx.body = await esGetSearchByTable({
        table: tableFirst === 'contributions' ? 'contribution' : tableFirst,
        size: n_max_rows !== undefined ? size : 10,
        from: from !== undefined ? fromNumber : undefined,
        queries: query !== undefined ? queries : undefined,
      });
      if (ctx.body === undefined) {
        ctx.status = 204;
      }
    // }
  },
};
