import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';
import { esCheckConnection, esAuthenticate } from '../server/es';

export default {
  getHealthCheck: async (c: OpenAPIContext, ctx: Koa.Context) => {
    try {
      const healthy: boolean = await esCheckConnection();
      ctx.status = healthy ? 200 : 500;
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  },
  authenticate: async (c: OpenAPIContext, ctx: Koa.Context) => {
    try {
      const b64auth = (ctx.headers.authorization || '').split(' ')[1] || '';
      const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      ctx.body = await esAuthenticate(username, password);
      if (ctx.body === false) {
        ctx.status = 401;
        ctx.body = { err: [{ message: 'username or password is not recognized' }]};
      }
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  },
};
