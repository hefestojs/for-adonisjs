import { HttpContext } from '@adonisjs/core/http'
import swaggerJSDoc from 'swagger-jsdoc'
import path from 'node:path'
import fs from 'node:fs'
import HHelper from './helper.js'

export default class HSwagger {
  static async path(ctx: HttpContext) {
    switch (ctx.params['path']) {
      case undefined:
        return HSwagger.ui(ctx)
      case 'json':
        return HSwagger.json(ctx)
      case 'ui':
        return HSwagger.ui(ctx)
      default:
        const filePath = `./node_modules/swagger-ui-dist/${ctx.params['path']}`
        return ctx.response.download(filePath)
    }
  }

  static async json(ctx: HttpContext) {
    const projectRoot = HHelper.projectRoot()
    const packageJsonPath = path.resolve(projectRoot, 'package.json')

    if (!packageJsonPath) {
      throw new Error('package.json not found')
    }

    const { default: packageJson } = await import(packageJsonPath, {
      assert: {
        type: 'json',
      },
    })

    const options = {
      definition: {
        openapi: '3.1.0',
        info: {
          title: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
        },
      },
      apis: ['./app/**/*.ts', './node_modules/@hefestojs/for-adonisjs/docs/openapi/**/*.yml'],
    }

    const specs = swaggerJSDoc(options)
    return ctx.response.json(specs)
  }

  static async ui(ctx: HttpContext) {
    const indexFile = path.resolve('./node_modules/@hefestojs/for-adonisjs/docs/openapi/swagger.html')
    let indexContent = await fs.promises.readFile(indexFile, 'utf8')
    indexContent = indexContent.replace('_SWAGGER_JSON_', '/swagger/json')

    ctx.response.type('.html')
    return ctx.response.send(indexContent)
  }
}
