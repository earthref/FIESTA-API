/* eslint-disable import/no-named-default */
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import * as fs from 'fs';
import { default as archiver } from 'archiver';
import { DateTime } from 'luxon';
import { s3GetContributionByID } from '../server/s3';
import { esGetSearchByTable } from '../server/es';

export default {
  downloadContributionFilesByID: async (c: OpenAPIContext, ctx: Koa.Context) => {
    const id: string = c.request.params.id instanceof Array ? c.request.params.id[0] : c.request.params.id;
    try {
      ctx.body = await s3GetContributionByID({ id, format: ctx.accepts('text/plain') ? 'txt' : 'json' });
      if (ctx.body === undefined) {
        ctx.status = 204;
      }
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  },
  downloadContributionFiles: async (c: OpenAPIContext, ctx: Koa.Context) => {
    try {
      if (!c.request.query.query && !c.request.query.id && !c.request.query.doi && !c.request.query.contributor_name) {
        ctx.status = 400;
        ctx.body = { err: 'At least one query parameter is required.' };
      } else {
        // const fileTypes: string[] = c.request.query.file_type instanceof Array ? c.request.query.file_type : [c.request.query.file_type];
        const nMaxContributions: string = c.request.params.n_max_contributions instanceof Array ? c.request.params.n_max_contributions[0] : c.request.params.n_max_contributions;
        const size: number = (nMaxContributions && parseInt(nMaxContributions, 10)) || 1;
        // const id: string = c.request.query.id instanceof Array ? c.request.query.id[0] : c.request.query.id;
        const dois: string[] = c.request.query.doi instanceof Array ? c.request.query.doi : [c.request.query.doi];
        const doi: string = dois[0];
        const archive = archiver('zip');
        archive.on('error', (error: archiver.ArchiverError) => {
          throw new Error(`${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`);
        });
        const fileName = `MagIC Download - Public - ${DateTime.utc().toISO()}.zip`;

        const contributions = await esGetSearchByTable({
          table: 'contribution',
          size,
          doi,
        });
        if (contributions && contributions.results.length >= 1) {
          let emptyArchive = true;
          await Promise.all(contributions.results.map(async (contribution: { id: string; }) => {
            const { id } = contribution;
            const contributionFile = await s3GetContributionByID({ id, format: ctx.accepts('text/plain') ? 'txt' : 'json' });
            if (contributionFile) {
              archive.append(contributionFile, { name: `${id}/magic_contribution_${id}.txt` });
              emptyArchive = false;
            }
          }));
          if (!emptyArchive) {
            if (!fs.existsSync('downloads')) {
              fs.mkdirSync('downloads');
            }
            await new Promise((resolve: () => void, reject: () => void) => {
              archive.on('close', resolve);
              archive.on('end', resolve);
              archive.on('error', reject);
              archive.pipe(fs.createWriteStream(`downloads/${fileName}`));
              archive.finalize();
            });
            ctx.body = fs.createReadStream(`downloads/${fileName}`);
            ctx.type = 'application/zip';
            ctx.response.attachment(fileName);
          } else {
            ctx.body = undefined;
            ctx.status = 204;
          }
        } else {
          ctx.body = undefined;
          ctx.status = 204;
        }
      }
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  },
};
