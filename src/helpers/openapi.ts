import StringHelper from './string.js'

export default class OpenApiHelper {
  static modelDefinitions(lucid: any, modelName: string, columns: any) {
    let specs = `\n/** @openapi components:\n`
    specs += ` *  schemas:\n`
    specs += ` *   Model ${modelName}:\n`
    specs += ` *     type: object\n`
    specs += ` *     properties:\n`

    Object.entries(columns).forEach(([, column]: [string, any]) => {
      if (
        column.is_primary === 'YES' ||
        column.name.toLowerCase() === 'id' ||
        column.name.toLowerCase() === lucid.primaryKey.toLowerCase()
      ) {
        return
      }
      specs += ` *       ${StringHelper.camelCase(column.name, false)}:\n`
      specs += ` *         type: ${lucid.dataTypeMapper(column.data_type)}\n`
    })

    specs += ` */`
    return specs
  }

  static controllerEndpoint(
    action: string,
    endpointPath: string,
    modelName: string,
    securityScheme: string = 'bearer'
  ) {
    switch (action) {
      case 'index':
        return `/** @openapi /${endpointPath}:
   *  get:
   *    tags:
   *      - ${modelName}
   *    security:
   *      - ${securityScheme}: []
   *    parameters:
   *      - $ref: '#/components/parameters/Where'
   *      - $ref: '#/components/parameters/Join'
   *      - $ref: '#/components/parameters/Order'
   *    responses:
   *      200:
   *        $ref: '#/components/responses/Paginated'
   *      500:
   *        $ref: '#/components/responses/InternalServerError'
   */`
      case 'store':
        return `/** @openapi /${endpointPath}:
   *   post:
   *     tags:
   *       - ${modelName}
   *     security:
   *       - ${securityScheme}: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Model ${modelName}'
   *     responses:
   *       200:
   *         $ref: '#/components/responses/RecordStored'
   *       422:
   *         $ref: '#/components/responses/ValidationError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */`
      case 'show':
        return `/** @openapi /${endpointPath}/{id}:
   *   get:
   *     tags:
   *       - ${modelName}
   *     security:
   *       - ${securityScheme}: []
   *     parameters:
   *      - $ref: '#/components/parameters/PrimaryKey'
   *     responses:
   *       200:
   *        $ref: '#/components/responses/RecordFound'
   *       404:
   *        $ref: '#/components/responses/RecordNotFound'
   */`
      case 'update':
        return `/** @openapi /${endpointPath}/{id}:
   *   put:
   *     tags:
   *       - ${modelName}
   *     security:
   *       - ${securityScheme}: []
   *     parameters:
   *      - $ref: '#/components/parameters/PrimaryKey'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Model ${modelName}'
   *     responses:
   *       200:
   *        $ref: '#/components/responses/RecordUpdated'
   *       422:
   *         $ref: '#/components/responses/ValidationError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */`
      case 'destroy':
        return `/** @openapi /${endpointPath}/{id}:
   *   delete:
   *     tags:
   *       - ${modelName}
   *     security:
   *       - ${securityScheme}: []
   *     parameters:
   *      - $ref: '#/components/parameters/PrimaryKey'
   *     responses:
   *       200:
   *        $ref: '#/components/responses/RecordDeleted'
   *       404:
   *        $ref: '#/components/responses/RecordNotFound'
   */`
      default:
        break
    }
  }
}
