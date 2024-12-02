import Router from '@koa/router'
import * as swig from 'free-swig'

import { config } from './config.js'
import { generateIndex, type Article } from './content-processing.js'
import { findArticlesForTag } from './meta.js'
import { registerArticleName, renderMarkdown, viewCommons } from './middlewares.js'

export const rootRouter = new Router()

rootRouter.get('/robots.txt', ctx => {
  ctx.set('Content-type', 'text/plain')
  ctx.body = ''
  ctx.status = 200
})

export const mountPaths = async () => {
  const index = await generateIndex(config.contents)
  for (const articleName in index.articles) {
    console.log(`Registering article "${articleName}"...`)
    rootRouter.get(
      `/${articleName}`,
      registerArticleName(articleName),
      renderMarkdown,
      viewCommons(config, index),
      async ctx => {
        const article = index.articles[ctx.state.articleName] as Article
        const locals = ctx.state.commons({
          prev: article.prev,
          next: article.next,
          articleContents: () => ctx.state.articleHtml,
        })
        const htmlData = swig.renderFile(
          './templates/layout.html',
          locals,
        )
        ctx.set('Content-type', 'text/html')
        ctx.status = 200
        ctx.body = htmlData
      }
    )
  }

  rootRouter.get('/', async ctx => {
    return ctx.redirect(index.first)
  })

  rootRouter.get('/tags/:tag', viewCommons(config, index), async ctx => {
    const articles = findArticlesForTag(index, ctx.params.tag as string)
    const locals = ctx.state['commons']({
      articles: articles.map(art => ({
        id: art,
        title: index.articles[art]!.title,
      })),
      tag: ctx.params.tag,
    }) as Record<string, unknown>

    const htmlData = swig.renderFile(
      './templates/tags.html',
      locals,
    )
    ctx.set('Content-type', 'text/html')
    ctx.status = 200
    ctx.body = htmlData
  })

  rootRouter.get('/tags', viewCommons(config, index), async ctx => {
    const locals = ctx.state['commons']({
      articles: index.tags.map(tag => ({
        id: tag,
        title: tag,
      })),
    }) as Record<string, unknown>

    const htmlData = swig.renderFile(
      './templates/tags.html',
      locals,
    )
    ctx.set('Content-type', 'text/html')
    ctx.status = 200
    ctx.body = htmlData
  })

  return rootRouter
}
