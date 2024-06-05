import { BaseCommand, Kernel, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions, ParsedOutput, UIPrimitives } from '@adonisjs/core/types/ace'
import { existsSync, writeFileSync, mkdirSync, appendFile, readFile } from 'node:fs'
import pluralize from 'pluralize'
import path from 'node:path'
import { ApplicationService } from '@adonisjs/core/types'
import db from '@adonisjs/lucid/services/db'
import LucidHelper from '../helpers/lucid.js'
import StringHelper from '../helpers/string.js'
import OpenApiHelper from '../helpers/openapi.js'

export default class ForgeController extends BaseCommand {
  static namespace = 'hefesto'
  static commandName = 'forge:controller'
  static description = 'Forge a new HTTP controller class from a live database'
  private db!: typeof db
  private lucid!: any

  constructor(
    app: ApplicationService,
    kernel: Kernel,
    parsed: ParsedOutput,
    ui: UIPrimitives,
    prompt: Kernel['prompt']
  ) {
    super(app, kernel, parsed, ui, prompt)
    app.container.make('lucid.db').then((_db) => {
      this.db = _db
    })
  }

  @args.string({
    description: 'Fill with schema.% or schema.table_name to generate a CONTROLLER for',
  })
  declare from: string

  @flags.string({
    alias: 'c',
    description: 'Connection name from where the models will be generated',
    default: 'default',
    required: false,
  })
  declare connectionName: string

  @flags.string({
    alias: 'd',
    description: 'Directory inside app/controllers',
    default: '/',
    required: false,
  })
  declare dir: string

  @flags.string({
    alias: 'm',
    description: 'Directory inside app/models',
    default: '/',
    required: false,
  })
  declare dirModel: string

  @flags.boolean({
    alias: 'o',
    description: 'Overwrite existing Controller file',
    default: false,
    required: false,
  })
  declare overwrite: boolean

  @flags.boolean({
    alias: 'a',
    description: 'Basic OpenAPI specifications',
    default: false,
    required: false,
  })
  declare openapi: boolean

  @flags.string({ alias: 's', description: 'Security scheme', default: 'bearer', required: false })
  declare securityScheme: string

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.lucid = new LucidHelper(this.db)
    if (this.connectionName === 'default') {
      this.connectionName = this.db.connection().connectionName
    }
    if (this.dir === '/') {
      this.dir = ''
    }

    const tables = await this.lucid.getAllTables(this.from)
    if (!tables.length) {
      return this.logger.error(`Controller not generated: ${this.from} not found!`)
    }

    tables.forEach((each_table: any) => {
      let imports = `import type { HttpContext } from '@adonisjs/core/http'\n`

      const modelFile = pluralize.singular(each_table)
      const modelName = StringHelper.camelCase(modelFile)
      const modelImport = path.join('#models', this.dirModel, `${modelFile}`)

      const controllerName = `${modelName}Controller`
      const controllerFile = `${modelFile}_controller`
      const controllerPath = path.join('app', 'controllers', this.dir, `${controllerFile}.ts`)
      const controllerImport = `#controllers/${!this.dir ? '' : this.dir + '/'}${controllerFile}`

      const endpoint = each_table.replace(/_/g, '-')
      const endpointPath = `${!this.dir ? '' : this.dir + '/'}${endpoint}`

      if (!this.overwrite && existsSync(controllerPath)) {
        return this.logger.error(`${controllerFile}.ts already exists!`)
      }

      imports += `import HController from '@hefestojs/for-adonisjs/controller'\n`
      imports += `import ${modelName} from '${modelImport}'\n`

      let content = `\nexport default class ${controllerName} extends HController {\n\n`

      if (this.openapi)
        content += `  ${OpenApiHelper.controllerEndpoint('index', endpointPath, modelName)}\n`

      content += `  async index({ request, response }: HttpContext) {\n`
      content += `    const pagination = await ${modelName}.pagination({\n`
      content += `      where: request.input('where', {}),\n`
      content += `      join: request.input('join', {}),\n`
      content += `      order: request.input('order', {}),\n`
      content += `      page: request.input('page', 1),\n`
      content += `      limit: request.input('limit', 100),\n`

      if (this.dir) content += `      baseUrl: '${endpointPath}',\n`

      content += `    })\n`
      content += `    return response.json(pagination)\n`
      content += `  }\n\n`

      if (this.openapi)
        content += `  ${OpenApiHelper.controllerEndpoint('store', endpointPath, modelName)}\n`

      content += `  async store({ request, response }: HttpContext) {\n`
      content += `    const requestData = request.only(${modelName}.getColumns())\n`
      content += `    const dataset = await ${modelName}.create(requestData)\n`
      content += `    return response.json({ severiry: 'success', summary: 'New record stored!', dataset, schema: ${modelName}.jsonSchema() })\n`
      content += `  }\n\n`

      if (this.openapi)
        content += `  ${OpenApiHelper.controllerEndpoint('show', endpointPath, modelName)}\n`

      content += `  async show({ params, request, response }: HttpContext) {\n`
      content += `    if (params.id === '--schema') {\n`
      content += `      return response.json({ severity: 'success', summary: 'Showing only Schema!', dataset: new ${modelName}(), schema: ${modelName}.jsonSchema() })\n`
      content += `    }\n`
      content += `    const dataset = await ${modelName}.findOrFailWith({\n`
      content += `      id: params.id,\n`
      content += `      join: request.input('join', {})\n`
      content += `    })\n`
      content += `    return response.json({ severity: 'success', summary: 'Record retrieved!', dataset, schema: ${modelName}.jsonSchema() })\n`
      content += `  }\n\n`

      if (this.openapi)
        content += `  ${OpenApiHelper.controllerEndpoint('update', endpointPath, modelName)}\n`

      content += `  async update({ params, request, response }: HttpContext) {\n`
      content += `    const dataset = await ${modelName}.findOrFail(params.id)\n`
      content += `          dataset.merge(request.only(${modelName}.getColumns()))\n`
      content += `    await dataset.save()\n`
      content += `    return response.json({ severiry: 'success', summary: 'Record updated!', dataset, schema: ${modelName}.jsonSchema() })\n`
      content += `  }\n\n`

      if (this.openapi)
        content += `  ${OpenApiHelper.controllerEndpoint('destroy', endpointPath, modelName)}\n`

      content += `  async destroy({ params, response }: HttpContext) {\n`
      content += `    const dataset = await ${modelName}.findOrFail(params.id)\n`
      content += `    await dataset.delete()\n`
      content += `    return response.status(200).json({ severiry: 'warning', summary: 'Record deleted!', dataset, schema: ${modelName}.jsonSchema() })\n`
      content += `  }\n`

      content += '}'

      const dirPath = path.dirname(controllerPath)

      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true })
      }
      writeFileSync(controllerPath, imports + content)

      this.logger.success(`Controller generated from ${this.lucid.schema}:  ${controllerFile}`)

      this.setRoute(endpointPath, controllerImport)
    })
  }

  private setRoute(endpoint: string, controller: string) {
    endpoint = endpoint.replace(/_/g, '-')

    const params = `'/${endpoint}', '${controller}'`
    const nl = `\nrouter.resource(${params})`

    readFile('start/routes.ts', 'utf8', (err, data) => {
      if (err) {
        this.logger.error(err)
        return
      }

      if (data.includes(controller)) {
        return
      }

      appendFile('start/routes.ts', nl, (error) => {
        if (error) {
          this.logger.error('Erro ao escrever no arquivo: ' + error)
          return
        }
        this.logger.success(`Resource for ${controller} added into routes.ts!`)
      })
    })
  }
}
