import db from '@adonisjs/lucid/services/db'

export default class LucidHelper {
  connectionName: string
  db: typeof db
  schema!: string
  table!: string
  primaryKey!: string

  constructor(_db: any) {
    this.db = _db
    this.connectionName = this.db.connection().connectionName
  }

  parseFrom(from: string) {
    const splitted = from.split('.')
    if (splitted.length > 1) {
      this.schema = splitted[0]
      this.table = splitted[1]
    } else {
      this.table = splitted[0]
    }
    return { schema: this.schema, table: this.table }
  }

  async getAllTables(from: string) {
    this.parseFrom(from)
    let allTables: any

    if (['postgres', 'redshift'].includes(this.db.connection(this.connectionName).dialect.name)) {
      this.schema = this.schema.replace(/%|^$/, 'public')
      allTables = await this.db.connection(this.connectionName).dialect.getAllTables([this.schema])
    } else {
      allTables = await this.db.connection(this.connectionName).dialect.getAllTables()
    }

    if (this.table === '%') {
      return allTables
    } else {
      return allTables.filter((table: string) => table.toLowerCase() === this.table.toLowerCase())
    }
  }

  async getAllColumns(table_name: string) {
    let infos: any
    if (['postgres', 'redshift'].includes(this.db.connection(this.connectionName).dialect.name)) {
      let columnsInfo = await this.db.connection(this.connectionName).rawQuery(
        `
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
        [this.schema, table_name]
      )
      infos = columnsInfo.rows
    } else {
      let firstRow = await this.db.connection(this.connectionName).from(table_name).first()
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
            schema: this.schema,
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
    }
    return infos
  }

  dataTypeMapper(data_type: string): string {
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
}
