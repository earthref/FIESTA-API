import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import { esAuthenticate, esCreatePrivate, esDeletePrivate } from '../server/es';

export default {
	privateCreate: async (c: OpenAPIContext, ctx: Koa.Context): Promise<void> => {
		try {
			const user = await esAuthenticate(ctx.headers.authorization);
			if (user === false) {
				ctx.body = {
					errors: [{ message: 'Username or password is not recognized.' }],
				};
				ctx.status = 401;
				return;
			}
			if (!user.handle) {
				ctx.body = {
					errors: [{ message: 'Account handle is blank. Please log in to EarthRef.org and choose a unique handle.' }],
				};
				ctx.status = 500;
				return;
			}
			const { repository: repositories } = c.request.params;
			const repository: string =
				repositories instanceof Array ? repositories[0] : repositories;
			ctx.status = 200;
			ctx.body = {
				id: await esCreatePrivate({
					repository,
					contributor: user.handle ? `@${user.handle}` : `@user${user.id}`,
					contributorName: `${user.name.given} ${user.name.family}`,
				}),
			};
		} catch (e) {
			ctx.app.emit('error', e, ctx);
			ctx.status = 500;
			ctx.body = { errors: [{ message: e.message }] };
		}
	},
	privateUpdate: async (c: OpenAPIContext, ctx: Koa.Context): Promise<void> => {
		try {
			const user = await esAuthenticate(ctx.headers.authorization);
			if (user === false) {
				ctx.body = {
					errors: [{ message: 'Username or password is not recognized.' }],
				};
				ctx.status = 401;
				return;
			}
		} catch (e) {
			ctx.app.emit('error', e, ctx);
			ctx.status = 500;
			ctx.body = { errors: [{ message: e.message }] };
		}
	},
	privateDelete: async (c: OpenAPIContext, ctx: Koa.Context): Promise<void> => {
		try {
			const user = await esAuthenticate(ctx.headers.authorization);
			if (user === false) {
				ctx.body = {
					errors: [{ message: 'Username or password is not recognized.' }],
				};
				ctx.status = 401;
				return;
			}
			if (!user.handle) {
				ctx.body = {
					errors: [{ message: 'Account handle is blank. Please log in to EarthRef.org and choose a unique handle.' }],
				};
				ctx.status = 500;
				return;
			}
			const { repository: repositories, id: ids } = c.request.params;
			const repository: string =
				repositories instanceof Array ? repositories[0] : repositories;
      const id: string = ids instanceof Array ? ids[0] : ids;
			ctx.status = 200;
			ctx.body = {
				id: await esDeletePrivate({
					repository,
					contributor: user.handle ? `@${user.handle}` : `@user${user.id}`,
					id
				}),
			};
		} catch (e) {
			ctx.app.emit('error', e, ctx);
			ctx.status = 500;
			ctx.body = { errors: [{ message: e.message }] };
		}
	},
};
