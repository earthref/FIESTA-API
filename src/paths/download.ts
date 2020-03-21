/* eslint-disable camelcase */
/* eslint-disable import/no-named-default */
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import * as fs from 'fs';
import { default as archiver } from 'archiver';
import { DateTime } from 'luxon';
import { s3GetContributionByID } from '../server/s3';
import { esGetSearchByTable } from '../server/es';

export default {
  downloadContributionFiles: async (c: OpenAPIContext, ctx: Koa.Context) => {
    const { n_max_contributions, query, id, doi, contributor_name } = c.request.query;
    if (
      query === undefined &&
      id === undefined &&
      doi === undefined &&
      contributor_name === undefined
    ) {
      ctx.status = 400;
      ctx.body = { err: [{ message: 'at least one query parameter is required' }]};
    } else {
      // const fileTypes: string[] = c.request.query.file_type instanceof Array ? c.request.query.file_type : [c.request.query.file_type];
      const size: number = parseInt(n_max_contributions instanceof Array ? n_max_contributions[0] : n_max_contributions, 10);
      const ids: string[] = id instanceof Array ? id : [id];
      const dois: string[] = doi instanceof Array ? doi : [doi];
      const contributions = await esGetSearchByTable({
        table: 'contribution',
        size: n_max_contributions !== undefined ? size : 1,
        ids: id !== undefined ? ids : undefined,
        dois: doi !== undefined ? dois : undefined,
      });
      console.log('0: ', contributions);
      if (contributions && contributions.results.length >= 1) {
        const archive = archiver('zip');
        const fileName = `MagIC Download - Public - ${DateTime.utc().toISO().replace(/(-|:)/g,'')}.zip`;
        let emptyArchive = true;
        await Promise.all(contributions.results.map(async (contribution: { id: string; }) => {
          console.log('1: ', contribution.id);
          const cid = contribution.id;
          const contributionFile = await s3GetContributionByID({ id: cid, format: ctx.accepts('text/plain') ? 'txt' : 'json' });
          if (contributionFile) {
            archive.append(contributionFile, { name: `${cid}/magic_contribution_${cid}.txt` });
            emptyArchive = false;
          }
        }));
        if (!emptyArchive) {
          if (!fs.existsSync('downloads')) {
            fs.mkdirSync('downloads');
          }
          await new Promise((resolve: () => void, reject: () => void) => {
            archive.pipe(fs.createWriteStream(`downloads/${fileName}`));
            archive.on('end', resolve);
            archive.on('error', (error: archiver.ArchiverError) => {
              reject();
              throw new Error(`${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`);
            });
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
  },
};
