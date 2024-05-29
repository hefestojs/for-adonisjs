/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import { existsSync, writeFileSync, mkdirSync, appendFile, readFile } from 'node:fs'
import pluralize from 'pluralize'
import path from 'node:path'

export default class ForgeController extends BaseCommand {
  static namespace = 'hefesto';
  static commandName = 'forge:controller'
  static description = 'Forge a new HTTP controller class from a live database'

  @args.string({ description: 'Fill with schema.% or schema.table_name to generate a CONTROLLER for' })
  declare from: string

  @flags.string({ alias: 'c', description: 'Connection name from where the models will be generated', default: 'default', required: false })
  declare connectionName: string

  @flags.string({ alias: 'd', description: 'Directory inside app/controllers', default: '/', required: false})
  declare dir: string

  @flags.string({ alias: 'm', description: 'Directory inside app/models', default: '/', required: false })
  declare dirModel: string

  @flags.boolean({ alias: 'o', description: 'Overwrite existing Controller file', default: false, required: false})
  declare overwrite: boolean

  @flags.boolean({ alias: 'a', description: 'Basic OpenAPI specifications', default: false, required: false})
  declare openapi: boolean

  @flags.string({ alias: 's', description: 'Security scheme', default: 'bearer', required: false})
  declare securityScheme: string

  static options: CommandOptions = {
    startApp: true,
  }
  async run() {
    if (this.connectionName === 'default') {
      this.connectionName = db.connection().connectionName
    }
    if (this.dir === '/') {
      this.dir = ''
    }

    const tables = await this.getTables()
    if (!tables.length) {
      return this.logger.error(`Controller not generated: ${this.from} not found!`)
    }

    tables.forEach((each:any)  => {
      let imports = `import type { HttpContext } from '@adonisjs/core/http'\n`

      const modelFile = pluralize.singular(each.table)
      const modelName = this.camelCase(modelFile)
      const modelImport = path.join('#models', this.dirModel, `${modelFile}`)

      const controllerName = `${modelName}Controller`
      const controllerFile = `${modelFile}_controller`
      const controllerPath = path.join('app', 'controllers', this.dir, `${controllerFile}.ts`)
      const controllerImport = `#controllers/${!this.dir ? '' : this.dir + '/'}${controllerFile}`

      const endpoint = each.table.replace(/_/g, '-')
      const endpointPath = `${!this.dir ? '' : this.dir + '/'}${endpoint}`

      if (!this.overwrite && existsSync(controllerPath)) {
        return this.logger.error(`${controllerFile}.ts already exists!`)
      }

      imports += `import AppController from '#bonus/app/controller'\n`
      imports += `import ${modelName} from '${modelImport}'\n`

      let content = `\nexport default class ${controllerName} extends AppController {\n\n`

      if (this.openapi)
        content += `  ${this.openapiSpecs('index', endpointPath, modelName)}\n`

      content += `  async index({ request, response }: HttpContext) {\n`
      content += `    const pagination = await ${modelName}.pagination({\n`
      content += `      where: request.input('where', {}),\n`
      content += `      join: request.input('join', {}),\n`
      content += `      order: request.input('order', {}),\n`
      content += `      page: request.input('page', 1),\n`
      content += `      limit: request.input('limit', 100),\n`
      
      if(this.dir)
      content += `      baseUrl: '${endpointPath}',\n`
      
      content += `    })\n`
      content += `    return response.json(pagination)\n`
      content += `  }\n\n`
      
      if (this.openapi)
        content += `  ${this.openapiSpecs('store', endpointPath, modelName)}\n`

      content += `  async store({ request, response }: HttpContext) {\n`
      content += `    const requestData = request.only(${modelName}.getColumns())\n`
      content += `    const dataset = await ${modelName}.create(requestData)\n`
      content += `    return response.json({ severiry: 'success', summary: 'New record stored!', dataset, schema: ${modelName}.jsonSchema() })\n`
      content += `  }\n\n`

      if (this.openapi)
        content += `  ${this.openapiSpecs('show', endpointPath, modelName)}\n`

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
        content += `  ${this.openapiSpecs('update', endpointPath, modelName)}\n`

      content += `  async update({ params, request, response }: HttpContext) {\n`
      content += `    const dataset = await ${modelName}.findOrFail(params.id)\n`
      content += `          dataset.merge(request.only(${modelName}.getColumns()))\n`
      content += `    await dataset.save()\n`
      content += `    return response.json({ severiry: 'success', summary: 'Record updated!', dataset, schema: ${modelName}.jsonSchema() })\n`
      content += `  }\n\n`
      
      if (this.openapi)
        content += `  ${this.openapiSpecs('destroy', endpointPath, modelName)}\n`

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

      this.logger.success(`Controller generated from ${each.schema}:  ${controllerFile}`)

      this.setRoute(endpointPath, controllerImport)
    });
  }

  private async getTables(){
    const parts = this.from.split('.')
    let table_schema = ''
    let table_name = ''

    if (parts.length > 1) {
      table_schema = parts[0]
      table_name = parts[1]
    } else {
      table_schema = '%'
      table_name = parts[0]
    }
    
    let infos: any
    
    switch (db.connection(this.connectionName).dialect.name) {
      case 'postgres':
        let columnsInfo = await db.connection(this.connectionName).rawQuery(`
          SELECT
             table_schema as schema,
             table_name as table
          FROM information_schema.tables
          WHERE lower(table_schema) like lower('${table_schema}') 
            and lower(table_name) like lower('${table_name}')
            and table_schema NOT IN ('pg_catalog', 'information_schema')
          ORDER BY table_schema, table_name
          `)
        infos = columnsInfo.rows
        break
    }
    return infos;
  }

  private camelCase(name: string) {
    const parts = name.split('.')
    if (parts.length > 1) {
      name = parts[1]
    }
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }

  private setRoute(endpoint: string, controller: string) {
    endpoint = endpoint.replace(/_/g, '-')
    
    const params = `'/${endpoint}', '${controller}'`
    const nl = `\nrouter.resource(${params})`;

    readFile('start/routes.ts', 'utf8', (err, data) => {
      if (err) {
        this.logger.error(err);
        return;
      }

    if (data.includes(controller)) {
        return;
    }

    appendFile('start/routes.ts', nl, (error) => {
        if (error) {
            this.logger.error('Erro ao escrever no arquivo: ' + error);
            return;
        }
        this.logger.success(`Resource for ${controller} added into routes.ts!`)
    });
    });
  }

  private openapiSpecs(action: string, endpointPath: string, modelName: string) {
    switch (action) {
      case 'index':
        return `/** @openapi /${endpointPath}:
   *  get:
   *    tags:
   *      - ${modelName}
   *    security:
   *      - ${this.securityScheme}: []
   *    parameters:
   *      - $ref: '#/components/parameters/Where'
   *      - $ref: '#/components/parameters/Join'
   *      - $ref: '#/components/parameters/Order'
   *    responses:
   *      200:
   *        $ref: '#/components/responses/Paginated'
   *      500:
   *        $ref: '#/components/responses/InternalServerError'
   */`;
      case 'store':
        return `/** @openapi /${endpointPath}:
   *   post:
   *     tags:
   *       - ${modelName}
   *     security:
   *       - ${this.securityScheme}: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/${modelName}' 
   *     responses:
   *       200:
   *         $ref: '#/components/responses/RecordStored'
   *       422:
   *         $ref: '#/components/responses/ValidationError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */`;
      case 'show':
        return `/** @openapi /${endpointPath}/{id}:
   *   get:
   *     tags:
   *       - ${modelName}
   *     security:
   *       - ${this.securityScheme}: []
   *     parameters:
   *      - $ref: '#/components/parameters/PrimaryKey'
   *     responses:
   *       200:
   *        $ref: '#/components/responses/RecordFound'
   *       404:
   *        $ref: '#/components/responses/RecordNotFound'
   */`;
      case 'update':
        return `/** @openapi /${endpointPath}/{id}:
   *   put:
   *     tags:
   *       - ${modelName}
   *     security:
   *       - ${this.securityScheme}: []
   *     parameters:
   *      - $ref: '#/components/parameters/PrimaryKey'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/${modelName}' 
   *     responses:
   *       200:
   *        $ref: '#/components/responses/RecordUpdated'
   *       422:
   *         $ref: '#/components/responses/ValidationError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */`;
      case 'destroy':
        return `/** @openapi /${endpointPath}/{id}:
   *   delete:
   *     tags:
   *       - ${modelName}
   *     security:
   *       - ${this.securityScheme}: []
   *     parameters:
   *      - $ref: '#/components/parameters/PrimaryKey'
   *     responses:
   *       200:
   *        $ref: '#/components/responses/RecordDeleted'
   *       404:
   *        $ref: '#/components/responses/RecordNotFound'
   */`;
      default:
        break;
    }
  }
}