import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import * as fs from 'fs';
import { default as archiver } from 'archiver';
import { DateTime } from 'luxon';
import { esAuthenticate, esGetPrivateSearchByTable, esGetPrivateTSV } from '../server/es';

export default {
	privateDownloadContributionFiles: async (
		c: OpenAPIContext,
		ctx: Koa.Context
	): Promise<void> => {
		try {
			const user = await esAuthenticate(ctx.headers.authorization);
			if (user === false) {
				ctx.body = {
					errors: [{ message: 'Username or password is not recognized' }],
				};
				ctx.status = 401;
				return;
			}
			const { repository: repositories } = c.request.params;
			const { n_max_contributions, query, id, doi } = c.request.query;
			if (query === undefined && id === undefined && doi === undefined) {
				ctx.status = 400;
				ctx.body = {
					errors: [{ message: 'At least one query parameter is required' }],
				};
			} else {
				// const fileTypes: string[] = c.request.query.file_type instanceof Array ? c.request.query.file_type : [c.request.query.file_type];
				const size: number = parseInt(
					n_max_contributions instanceof Array
						? n_max_contributions[0]
						: n_max_contributions,
					10
				);
				const repository: string =
					repositories instanceof Array ? repositories[0] : repositories;
				const ids: string[] = id instanceof Array ? id : [id];
				const dois: string[] = doi instanceof Array ? doi : [doi];
				const contributions = await esGetPrivateSearchByTable({
					repository,
					contributor: `@${user.handle}`,
					table: 'contribution',
					size: n_max_contributions !== undefined ? size : 10,
					ids: id !== undefined ? ids : undefined,
					dois: doi !== undefined ? dois : undefined,
				});
				if (contributions && contributions.results.length >= 1) {
					const cids = contributions.results.map(
						(contribution) => contribution.id
					);
					const archive = archiver('zip');
					const fileName = `MagIC Download - Public - ${DateTime.utc()
						.toISO()
						.replace(/(-|:)/g, '')}.zip`;
					let emptyArchive = true;
					await Promise.all(
						cids.map(async (cid) => {
							/* const contributionFile = await s3GetContributionByID({
								id: cid,
								format: ctx.accepts('text/plain') ? 'txt' : 'json',
							}); */
							const contributionFile = await esGetPrivateTSV({
								repository,
								contributor: `@${user.handle}`,
								id: cid
							});
							if (contributionFile) {
								archive.append(contributionFile, {
									name: `${cid}/magic_contribution_${cid}.txt`,
								});
								emptyArchive = false;
							}
						})
					);
					if (!emptyArchive) {
						if (!fs.existsSync('downloads')) {
							fs.mkdirSync('downloads');
						}
						await new Promise((resolve: () => void, reject: () => void) => {
							archive.pipe(fs.createWriteStream(`downloads/${fileName}`));
							archive.on('end', resolve);
							archive.on('error', (error: archiver.ArchiverError) => {
								reject();
								throw new Error(
									`${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`
								);
							});
							archive.finalize();
						});
						ctx.body = fs
							.createReadStream(`downloads/${fileName}`)
							.on('end', () => {
								fs.unlinkSync(`downloads/${fileName}`);
							});
						ctx.type = 'application/zip';
						ctx.response.attachment(fileName);
					} else {
						ctx.status = 500;
						ctx.body = {
							errors: [
								{
									message: `Failed to retrieve contributions [${cids.join(
										', '
									)}] for download`,
								},
							],
						};
					}
				} else {
					ctx.status = 204;
				}
			}
		} catch (e) {
			ctx.app.emit('error', e, ctx);
			ctx.status = 500;
			ctx.body = { errors: [{ message: e.message }] };
		}
	},
};
