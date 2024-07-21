import { BaseModel } from '@adonisjs/lucid/orm'
import HHelper from './helper.js'

type Property = {
  label?: string
  [key: string]: any
}

type Relation = {
  label?: string
  [key: string]: any
}

type Schema = {
  $schema: string
  name: string
  title: string
  type: string
  properties: { [key: string]: Property }
  relations: { [key: string]: Relation }
}

export default class HBaseModel extends BaseModel {
  static title?: string
  static customName?: string
  static schema: Schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    name: 'undefined',
    title: 'undefined',
    type: 'object',
    properties: {},
    relations: {},
  }

  static jsonSchema() {
    this.schema.name = this.customName || this.name
    this.schema.title = this.title || this.name

    this.schema.properties = {}
    this.schema.properties = this.setSchemaProperties(this['$columnsDefinitions'])

    this.schema.relations = {}
    this['$relationsDefinitions'].forEach((relationsDefinition, key: string) => {
      this.schema.relations[key] = {}
      this.schema.relations[key]['type'] = relationsDefinition.type
      this.schema.relations[key]['properties'] = this.setSchemaProperties(
        relationsDefinition.relatedModel()['$columnsDefinitions']
      )
    })

    return this.schema
  }

  static setSchemaProperties(columnDefinitions: any) {
    const properties: { [key: string]: Property } = {}
    columnDefinitions.forEach((columnDefinition: any, key: string) => {
      properties[key] = {}
      properties[key]['label'] = HHelper.prettify(key.toString())
      for (const metaKey in columnDefinition.meta) {
        properties[key][metaKey] = columnDefinition.meta[metaKey]
      }
    })
    return properties
  }

  static getColumns() {
    return Array.from(this['$columnsDefinitions'].entries())
      .filter(([_, def]) => def.serializeAs !== null && def.serializeAs !== 'id')
      .map(([columnName, _]) => columnName)
  }

  static queryWith(join: any = {}, orderby: any = {}): any {
    const query = this.query()
    if (Array.isArray(join)) {
      for (const relationship of join) {
        query.preload(relationship);
      }
    } else {
      for (const relationship of Object.keys(join)) {
        const options = join[relationship];
        query.preload(relationship as any, options ?? (() => { }));
      }
    }
    Object.keys(orderby).forEach((col) => {
      query.orderBy(col, orderby[col])
    })
    return query
  }

  static async findOrFailWith({ id, join = {}, scopes = {} }: { id: any; join?: { [key: string]: any } | string[], scopes?: { [key: string]: any } }) {
    const query = this.queryWith(join)
    for (const scope in scopes) {
      query.withScopes((model: any) => model[scope](scopes[scope]))
    }
    const result = await query.where('id', id).firstOrFail()
    return result
  }

  static async pagination({
    where = {},
    join = {},
    order = {},
    page = 1,
    limit = 100,
    baseUrl = '',
    scopes = {},
  }: {
    where?: any
    join?: any
    order?: any
    page?: number
    limit?: number
    baseUrl?: string,
    scopes?: { [key: string]: any }
  }) {
    if (baseUrl === '') {
      baseUrl = this.table.replace(/_/g, '-')
      if (this.table.split('.').length > 1) {
        baseUrl = baseUrl.split('.')[1]
      }
    }

    const queryParams = HHelper.serializeQueryParams({ where, join, order, limit })
    const whereParsed = HHelper.parseQueryJSON(where)
    const orderParsed = HHelper.parseQueryJSON(order)

    const query = this.queryWith(join, orderParsed)
    for (const scope in scopes) {
      query.withScopes((model: any)=>model[scope](scopes[scope]))
    }

    for (const column in whereParsed) {
      const condition = whereParsed[column]
      if (condition instanceof Object) {
        for (let operator in condition) {
          let value = condition[operator]
          if (operator === '0') {
            operator = '=';
          }
          if (operator === 'in') {
            value = value.split(';');
          }
          query.where(column, operator, value)
        }
      }
      else {
        query.where(column, condition)
      }
    }

    const paginated = await query.paginate(page, limit)
    paginated.baseUrl(`/${baseUrl}?${queryParams}`)
    const paginatedMeta = HHelper.normalizeMeta(paginated.getMeta())
    return {
      severity: 'success',
      summary: `Dataset retrieved Successfully with (${paginatedMeta.total}) records.`,
      pagination: paginatedMeta,
      dataset: paginated.all(),
      schema: this.jsonSchema(),
    }
  }
}
