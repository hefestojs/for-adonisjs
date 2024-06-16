import * as fs from 'node:fs'
import * as path from 'node:path'

export default class HHelper {
  static prettify(snake_text: string) {
    return snake_text
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  static normalizeMeta(meta: any) {
    for (const key in meta) {
      if (key.endsWith('Url') !== false && meta[key] !== null) {
        const lastIndex = meta[key].lastIndexOf('?')
        if (lastIndex === -1) continue
        meta[key] = meta[key].substring(0, lastIndex) + '&' + meta[key].substring(lastIndex + 1)
      }
    }
    return meta
  }

  static serializeQueryParams({
    where = undefined,
    join = undefined,
    order = undefined,
    limit = undefined,
  }: {
    where?: any
    join?: any
    order?: any
    limit?: number
  }) {
    const params: any = { where, join, order, limit }
    const parts: any = []

    Object.keys(params).forEach((key) => {
      if (params.hasOwnProperty(key)) {
        const value = params[key]
        if (typeof value === 'object' && value !== null) {
          for (const subKey in value) {
            if (value.hasOwnProperty(subKey)) {
              parts.push(
                `${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(value[subKey])}`
              )
            }
          }
        } else {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        }
      }
    })
    return parts.join('&')
  }

  static projectRoot() {
    const currentFilePath = new URL(import.meta.url).pathname

    let dir = path.dirname(currentFilePath)
    while (!fs.existsSync(path.join(dir, '@hefestojs'))) {
      const parentDir = path.resolve(dir, '..')
      if (parentDir === dir) {
        throw new Error('Project root not found')
      }
      dir = parentDir
    }

    return path.resolve(dir, '../')
  }
}