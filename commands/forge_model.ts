/**
 * ============================================================================
 * Data Modeling Conventions
 * ============================================================================
 *
 * We use column comments to document special behaviors:
 *
 * 'fk:schema.table': Indicates a foreign key relationship with a table from another schema.
 *
 * 'fk:--polymorph': Indicates that this column has a polymorphic relationship and should be ignored.
 *
 * These conventions allow us to keep the data structure clear and understandable.
 */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/naming-convention */
import { BaseCommand, Kernel, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions, ParsedOutput, UIPrimitives } from '@adonisjs/core/types/ace'
import pluralize from 'pluralize'
import { existsSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { ApplicationService } from '@adonisjs/core/types'
import db from '@adonisjs/lucid/services/db'
import LucidHelper from '../helpers/lucid.js'
import OpenApiHelper from '../helpers/openapi.js'
import StringHelper from '../helpers/string.js'

export default class ForgeModel extends BaseCommand {
  static namespace = 'hefesto';
  static commandName = 'forge:model'
  static description = 'Forge a new Lucid model from a live database'
  db!: typeof db
  lucid!: any
  openApiHelper!: any

  constructor(app: ApplicationService, kernel: Kernel, parsed: ParsedOutput, ui: UIPrimitives, prompt: Kernel['prompt']) {
    super(app, kernel, parsed, ui, prompt)
    app.container.make('lucid.db').then((_db) => {
      this.db = _db
    })
  }

  @args.string({ description: 'Fill with schema.% or schema.table_name to generate a model for' })
  declare from: string

  @flags.string({ alias: 'c', description: 'Connection name from where the models will be generated', default: 'default', required: false })
  declare connectionName: string

  @flags.string({ alias: 'd', description: 'Directory inside app/models', default: '/', required: false })
  declare dir: string

  @flags.boolean({ alias: 'o', description: 'Overwrite existing Model file', default: false })
  declare overwrite: boolean

  @flags.string({ alias: 'k', description: 'Custom primary key', default: 'id' })
  declare primaryKey: string

  @flags.boolean({ alias: 'r', description: 'Do not generate relationship bindings (belongsTo)', default: false })
  declare noRelations: boolean

  @flags.boolean({ alias: 'a', description: 'Basic OpenAPI specifications', default: false, required: false})
  declare openapi: boolean

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.lucid = new LucidHelper(this.db)
    this.lucid.primaryKey = this.primaryKey

    if(this.connectionName === 'default') {
      this.connectionName = this.db.connection().connectionName
    }

    const tables = await await this.lucid.getAllTables(this.from)
    if (!tables.length) {
      return this.logger.error(`Model not generated: ${this.from} not found!`)
    }

    await Promise.all(
      tables.map(async (each_table: any) => {
        let imports = `import HBaseModel from '@hefestojs/for-adonisjs/model'\n`
        imports += `import { column } from '@adonisjs/lucid/orm'`

        let content = ''

        const modelFile = pluralize.singular(each_table)
        const modelName = StringHelper.camelCase(modelFile)
        const modelPath = path.join('app', 'models', this.dir, `${modelFile}.ts`)

        if (!this.overwrite && existsSync(modelPath)) {
          return this.logger.error(`Model ${modelFile}.ts already exists!`)
        }

        const columns = await this.lucid.getAllColumns(each_table)
        if (!columns.length) {
          return this.logger.error(`Model not generated: ${this.from} need have at least 1 row!`)
        }

        content += `\n\nexport default class ${modelName} extends HBaseModel { \n`
        
        content += `  static connection = '${this.connectionName}'\n`
        content += `  static table = '${this.lucid.schema}.${each_table}'\n\n`

        Object.entries(columns).forEach(([, column]: [string, any]) => {        
          const atColumn = (column.is_primary === 'YES' || column.name.toLowerCase() === 'id' || column.name.toLowerCase() === this.primaryKey.toLowerCase()) ? 'isPrimary: true' : ''
          const dataType = this.lucid.dataTypeMapper(column.data_type)

          content += `  @column({${atColumn}})\n`
          content += `  declare ${StringHelper.camelCase(column.name, false)}: ${dataType}\n\n`

          if (dataType === 'DateTime' && imports.indexOf(`{ DateTime } from 'luxon'`) === -1) {
            imports += `\nimport { DateTime } from 'luxon'`
          }

          if (column.name.endsWith('_id') || column.name.startsWith('id_')) {
            let column_name = column.name.replace('_id', '').replace('id_', '')
            let columnName = StringHelper.camelCase(column_name)
            let foreignDir = this.dir;
            let foreignModel = column_name;
            
            if (column.comment) {
              if (column.comment.endsWith('--polymorph')) {
                return
              }
              const schemaTable = column.comment.split('fk:').pop().split('.');
              if (schemaTable.length > 1) {
                [foreignDir, foreignModel] = (schemaTable).map((word: any) => StringHelper.snakeCase(word));
                foreignDir = foreignDir === 'public' ? '' : foreignDir + '/';
              } else {
                [foreignModel] = (schemaTable).map((word: any) => StringHelper.snakeCase(word));
              }
            }
            try {
              if (!this.noRelations) {
                content += `  @belongsTo(() => ${columnName})\n`
                content += `  declare ${column_name}: BelongsTo<typeof ${columnName}>\n\n`

                if (imports.indexOf('belongsTo') === -1) {
                  imports += `\nimport { belongsTo } from '@adonisjs/lucid/orm'`
                  imports += `\nimport type { BelongsTo } from '@adonisjs/lucid/types/relations'`
                }

                const foreignPath = path.join(
                  '#models',
                  foreignDir,
                  pluralize.singular(foreignModel)
                )
                imports += `\nimport ${columnName} from '${foreignPath}'`
              }
            } catch (error) {
              this.logger.error(
                `Model not generated: ${column_name} at ${modelName}, foreignModel is ${foreignModel}!`
              )
            }
          }
        })
        content += '}'
        if (this.openapi)
          content += OpenApiHelper.modelDefinitions(this.lucid, modelName, columns)

        const dirPath = path.dirname(modelPath)
        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true })
        }
        writeFileSync(modelPath, imports + content)

        this.logger.success(`Model generated from ${this.lucid.schema}: ${modelFile}`)
      })
    )
  }
}
