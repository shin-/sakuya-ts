interface Backend {
  get: <T>(category: string, name: string) => Promise<T | null>
  set: <T>(category: string, name: string, value: T) => Promise<void>
}

class ArticlesCache {
  backend: Backend

  constructor() {
    this.backend = new MemBackend()
  }

  async getArticle(name: string) {
    return this.backend.get<string>('articles', name)
  }

  async setArticle(name: string, value: string) {
    return this.backend.set<string>('articles', name, value)
  }

  async getRaw(name: string) {
    return this.backend.get<string>('raws', name)
  }

  async setRaw(name: string, value: string) {
    return this.backend.set<string>('raws', name, value)
  }
}

class MemBackend implements Backend {
  cache: Record<string, unknown>

  constructor() {
    this.cache = {}
  }

  async set<T>(category: string, name: string, value: T) {
    this.cache[`${category}:${name}`] = value
  }

  async get<T>(category: string, name: string) {
    return this.cache[`${category}:${name}`] as T || null
  }
}

export const cache = new ArticlesCache()
