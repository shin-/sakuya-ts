import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'

export type Config = {
  title: string
  contents: string
  'highlight-theme': string
  cache: {
    type: 'redis' | 'mem'
    port?: number
    host?: string
  }
}

export const config = load(
  readFileSync(process.env['SAKUYA_CFG'] || './config.yml', 'utf-8')
) as Config
