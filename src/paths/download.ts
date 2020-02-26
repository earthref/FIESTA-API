import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import { s3GetContributionByID } from '../server/s3';
import { esGetSearchByTable } from '../server/es';

export default {
  downloadContribution: async (c: OpenAPIContext, ctx: Koa.Context) => {
    const doi: string = c.request.body.doi instanceof Array ? c.request.body.doi[0] : c.request.body.doi;
    try {
      console.log('doi:', doi);
      const contributions = await esGetSearchByTable({
        table: 'contribution',
        size: 1,
        doi,
      });
      if (contributions && contributions.results.length >= 1) {
        const contribution = contributions.results[0];
        console.log('contribution:', contribution);
        const id: string = contribution.id;
        ctx.body = await s3GetContributionByID({ id, format: ctx.accepts('text/plain') ? 'text' : 'json' });
        if (ctx.body === undefined) {
          ctx.status = 204;
        }
      } else {
        ctx.body = undefined;
        ctx.status = 204;
      }
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  },
};
