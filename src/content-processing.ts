import { stat, readFile, readdir } from 'node:fs/promises'
import * as pathutils from 'node:path'

import { cache } from './cache.js'
import * as meta from './meta.js'

type File = {
  filename: string
  mtime: Date
}

export type Article = {
  file: File
  next: string | null
  prev: string | null
  tags: string[]
  title: string
}

export type Index = {
  articles: Record<string, Article>
  first: string
  tags: string[]
}

// @internal
// Retrieve mtime and contents of file at `path`
// Return { filename, mtime, contents } object.
async function processFile(name: string, path: string) {
  const stats = await stat(path)
  const buf = await readFile(path, 'utf-8')
  const date = meta.parseDate(buf)
  await cache.setRaw(name, buf)
  return {
    mtime: date || stats.mtime,
    filename: name,
  }
}

function stripMd(filename: string) {
  return filename.slice(0, -3);
}

async function filesToIndex(files: Article['file'][]) {
  const index: Index = {
    articles: {},
    first: '',
    tags: [],
  }
  const tags = new Set<string>()

  files = files.sort(function(a, b) {
    // latest first
    return b.mtime.getTime() - a.mtime.getTime();
  })
  const count = files.length
  let i = 0
  for (const file of files) {
    const articleName = stripMd(file.filename)
    const contents = await cache.getRaw(file.filename)
    if (!contents) {
      throw new Error('Raw data not found in cache')
    }
    const articleTags = await meta.parseTags(contents)
    index.articles[articleName] = {
      file,
      next: i != count - 1 ? stripMd((files[i + 1] as File).filename) : null,
      prev: i != 0 ? stripMd((files[i - 1] as File).filename) : null,
      tags: articleTags,
      title: meta.parseTitle(contents),
    }

    articleTags.forEach(tag => tags.add(tag))
    if (i == 0) {
      index.first = articleName
    }
    i++
  }

  index.tags = Array.from(tags)
  return index
}

// Generate an index object with the files found in directory
// at `contentsPath` (default `../contents`)
export async function generateIndex(contentsPath?: string) {
  if (!contentsPath) {
    contentsPath = './contents';
  }
  const files = (await readdir(contentsPath)).filter(
    name => name.substr(-3) == '.md'
  )
  return filesToIndex(
    await Promise.all(
      files.map(
        async file => processFile(file, pathutils.join(contentsPath as string, file)),
      )
    )
  )
}
