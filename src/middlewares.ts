import format from 'date-fns/format'
import type { Context, Next } from 'koa'
import { marked } from 'marked'

import { cache } from './cache.js'
import type { Article, Index } from './content-processing.js'
import type { Config } from './config.js'

export function registerArticleName(name: string) {
  const wrapped = async (ctx: Context, next: Next) => {
    ctx.state.articleName = name
    return await next()
  }
  return wrapped
}

export async function renderMarkdown(ctx: Context, next: Next) {
  const articleName = ctx.state.articleName
  let articleHtml = await cache.getArticle(articleName)
  if (articleHtml) {
    ctx.state.articleHtml = articleHtml
    return await next()
  }

  const raw = await cache.getRaw(`${articleName}.md`)
  if (!raw) {
    return ctx.throw(404, 'Article not found')
  }

  articleHtml = await marked(raw)
  ctx.state.articleHtml = articleHtml
  await cache.setArticle(articleName, articleHtml as string)
  return await next()
}

export function viewCommons(cfg: Config, index: Index) {
  const wrapped = async (ctx: Context, next: Next) => {
    const data: Record<string, unknown> = {
      blogTitle: cfg.title,
      hltheme: cfg['highlight-theme']
    }
    if (ctx.state.articleName) {
      const art = index.articles[ctx.state.articleName] as Article
      data.tags = art.tags
      data.pageTitle = art.title
      data.date = format(art.file.mtime, 'yyyy-MM-dd')
    }
    ctx.state.commons = (obj: Record<string, unknown>) => {
      for (const k in data) {
        obj[k] = data[k]
      }
      return obj
    }
    return await next()
  }
  return wrapped
}
