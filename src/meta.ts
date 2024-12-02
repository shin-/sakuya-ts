import type { Index } from './content-processing.js'

export function findArticlesForTag(index: Index, tag: string) {
  return Object.keys(index.articles).filter(function(name) {
    return index.articles[name]!.tags.indexOf(tag) >= 0;
  });
}

// @sync
// Retrieve tag instructions in `contents` string and return
// a list of tags (duplicates are eliminated)
export function parseTags(contents: string) {
  const re = /<!-- tags: ([^>]+)-->/g
  const tags = new Set<string>()
  let matchArray: RegExpExecArray | null

  while (matchArray = re.exec(contents)) {
    const matchedTags = matchArray[1]!.split(',')
    for (const tag of matchedTags) {
      tags.add(tag.trim())
    }
  }
  return Array.from(tags)
}

// @sync
// Retrieve title instruction in `contents` string and return it
export function parseTitle(contents: string) {
  const re = /<!-- title: ([^>]+)-->/g
  const match = re.exec(contents)
  if (!match) {
      return ''
  }
  return match[1]!.trim()
}

export function parseDate(contents: string) {
  const re = /<!-- date: ([^>]+)-->/g
  const match = re.exec(contents)
  if (!match) {
    return null
  }
  return new Date(match[1]!.trim())
}
