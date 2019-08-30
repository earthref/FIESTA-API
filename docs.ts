import Koa from 'koa';
import KoaStatic from 'koa-static';
import mount from 'koa-mount';

const Docs = new Koa();
Docs.use(mount('/MagIC/v0', KoaStatic('docs')));
export { Docs };
