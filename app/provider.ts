import 'reflect-metadata'
import { ApplicationService } from '@adonisjs/core/types'

export default class HProvider {
  constructor(protected appService: ApplicationService) {}
  register() {}

  async boot() {}

  async start() {}

  async ready() {}

  async shutdown() {}
}
