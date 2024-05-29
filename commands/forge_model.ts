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
import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import pluralize from 'pluralize'
import { existsSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

export default class ForgeModel extends BaseCommand {
  static namespace = 'hefesto';
  static commandName = 'forge:model'
  static description = 'Forge a new Lucid model from a live database'

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
    if(this.connectionName === 'default') {
      this.connectionName = db.connection().connectionName
    }

    const tables = await this.getTables()
    if (!tables.length) {
      return this.logger.error(`Model not generated: ${this.from} not found!`)
    }

    await Promise.all(
      tables.map(async (each: any) => {
        let imports = `import AppModel from '#bonus/app/model'\n`
        imports += `import { column } from '@adonisjs/lucid/orm'`

        let content = ''

        const modelFile = pluralize.singular(each.table)
        const modelName = this.camelCase(modelFile)
        const modelPath = path.join('app', 'models', this.dir, `${modelFile}.ts`)

        if (!this.overwrite && existsSync(modelPath)) {
          return this.logger.error(`Model ${modelFile}.ts already exists!`)
        }

        const columns = await this.getColumnsInfo(each.schema, each.table)
        if (!columns.length) {
          return this.logger.error(`Model not generated: ${this.from} need have at least 1 row!`)
        }

        content += `\n\nexport default class ${modelName} extends AppModel { \n`
        
        content += `  static connection = '${this.connectionName}'\n`
        content += `  static table = '${each.schema}.${each.table}'\n\n`

        Object.entries(columns).forEach(([, column]: [string, any]) => {        
          const atColumn = (column.is_primary === 'YES' || column.name.toLowerCase() === 'id' || column.name.toLowerCase() === this.primaryKey.toLowerCase()) ? 'isPrimary: true' : ''
          const dataType = this.dataTypeMapper(column.data_type)

          content += `  @column({${atColumn}})\n`
          content += `  declare ${this.camelCase(column.name, false)}: ${dataType}\n\n`

          if (dataType === 'DateTime' && imports.indexOf(`{ DateTime } from 'luxon'`) === -1) {
            imports += `\nimport { DateTime } from 'luxon'`
          }

          if (column.name.endsWith('_id') || column.name.startsWith('id_')) {
            let column_name = column.name.replace('_id', '').replace('id_', '')
            let columnName = this.camelCase(column_name)
            let foreignDir = this.dir;
            let foreignModel = column_name;
            
            if (column.comment) {
              if (column.comment.endsWith('--polymorph')) {
                return
              }
              const schemaTable = column.comment.split('fk:').pop().split('.');
              if (schemaTable.length > 1) {
                [foreignDir, foreignModel] = (schemaTable).map((word: any) => this.snakeCase(word));
                foreignDir = foreignDir === 'public' ? '' : foreignDir + '/';
              } else {
                [foreignModel] = (schemaTable).map((word: any) => this.snakeCase(word));
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
          content += this.openapiSpecs(modelName, columns)

        const dirPath = path.dirname(modelPath)
        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true })
        }
        writeFileSync(modelPath, imports + content)

        this.logger.success(`Model generated from ${each.schema}: ${modelFile}`)
      })
    )
  }

  private camelCase(name: string, firstLetter = true) {
    const parts = name.split('.')
    if (parts.length > 1) {
      name = parts[1]
    }

    name = name.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('')
    name = firstLetter ? name.charAt(0).toUpperCase() + name.slice(1) : name.charAt(0).toLowerCase() + name.slice(1)

    return name
  }

  private snakeCase(name: string) {
    return name
      .replace('.', '_')
      .split(/(?=[A-Z])/)
      .join('_')
      .toLowerCase()
  }

  private async getTables() {
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

  private async getColumnsInfo(table_schema: string, table_name: string) {
    let infos: any
    switch (db.connection(this.connectionName).dialect.name) {
      case 'postgres':
        let columnsInfo = await db.connection(this.connectionName).rawQuery(`
            SELECT
                table_schema as schema,
                table_name as table,
                column_name as name,
                data_type,
                character_maximum_length as max_length,
                column_default as default_value,
                is_identity as is_primary,
                identity_increment as autoincrement,
                pg_catalog.col_description(class.oid, columns.ordinal_position::int) as comment
            FROM information_schema.columns columns
            LEFT JOIN pg_catalog.pg_class class ON columns.table_name = class.relname and class.relacl is null
            WHERE lower(table_schema) like lower(?)
            and lower(table_name) like lower(?)
            ORDER BY table_schema, table_name, ordinal_position
          `,
          [table_schema, table_name]
        )
        infos = columnsInfo.rows
        break
      default:
        let firstRow = await db.connection(this.connectionName).from(table_name).first()
        if (firstRow) {
          infos = Object.keys(firstRow).map((key) => {
            const value = firstRow[key]

            let inferredDataType = 'any'
            if (typeof value === 'string') {
              inferredDataType = 'string'
            } else if (typeof value === 'number') {
              inferredDataType = 'number'
            } else if (typeof value === 'boolean') {
              inferredDataType = 'Boolean'
            } else if (value instanceof Date) {
              inferredDataType = 'DateTime'
            }

            return {
              schema: table_schema,
              table: table_name,
              name: key,
              data_type: inferredDataType,
              max_length: null,
              default_value: null,
              is_primary: key === 'id' ? 'YES' : 'NO',
              autoincrement: null,
            }
          })
        }
        break
    }
    
    return infos
  }

  private dataTypeMapper(data_type: string): string {
    switch (data_type) {
      case 'integer':
      case 'smallint':
      case 'bigint':
      case 'decimal':
      case 'numeric':
      case 'real':
      case 'double precision':
      case 'smallserial':
      case 'serial':
      case 'bigserial':
        return 'number'
      case 'character varying':
      case 'varchar':
      case 'character':
      case 'char':
      case 'text':
      case 'citext':
      case 'uuid':
      case 'bytea':
        return 'string'
      case 'date':
      case 'interval':
      case 'time':
      case 'timestamp':
      case 'time with time zone':
      case 'timestamp with time zone':
      case 'timestamp without time zone':
        return 'DateTime'
      case 'json':
      case 'jsonb':
      case 'ARRAY':
        return 'object'
      default:
        return data_type
    }
  }

  private openapiSpecs(modelName: string, columns: any) {
    let specs = `\n/** @openapi definitions:\n`
        specs += ` *   ${modelName}:\n`
        specs += ` *     type: object\n`
        specs += ` *     properties:\n`

    Object.entries(columns).forEach(([, column]: [string, any]) => {
      if(column.is_primary === 'YES' || column.name.toLowerCase() === 'id' || column.name.toLowerCase() === this.primaryKey.toLowerCase()){
        return
      }
      specs += ` *       ${this.camelCase(column.name, false)}:\n`
      specs += ` *         type: ${this.dataTypeMapper(column.data_type)}\n`
    })

    specs += ` */`
    return specs
  }
}
