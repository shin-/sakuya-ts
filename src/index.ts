import type { HttpError } from 'http-errors'
import Koa from 'koa'
import * as serve from 'koa-static'
import { mountPaths } from './router.js'

const app = new Koa({ proxy: true })

mountPaths().then(rootRouter => {
  app
    .use(serve.default('./staticfiles', {}))
    .use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        console.error(err)
        if ((err as HttpError).expose) {
          const error = err as HttpError
          ctx.status = error.status
          ctx.body = `Error: ${error.message}`
          return
        }
        ctx.status = 500
        ctx.body = `Error: An unexpected error has occurred`
      }
    })
    .use(rootRouter.routes())
    .use(rootRouter.allowedMethods())

  app
    .listen('1990', () => console.log('🔪 Sakuya ready to listen'))
    .on('error', (err: Error) => console.error(err))
})
