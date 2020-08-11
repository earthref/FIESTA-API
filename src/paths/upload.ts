/* eslint-disable camelcase */
import { Context as OpenAPIContext } from 'openapi-backend/backend';
import Koa from 'koa';

export default {
  uploadFiles: async (c: OpenAPIContext, ctx: Koa.Context) => {
    // const { repository, id } = c.request.params;
    console.log(c.request);
  },
};
