import 'reflect-metadata'
import { ApplicationService } from '@adonisjs/core/types'
// import { Ignitor, prettyPrintError } from '@adonisjs/core'
// import HHelper from './helper.js'

export default class HProvider {
  constructor(protected appService: ApplicationService) {}
  register() {
    // console.log('HProvider.register')
    // const APP_ROOT = new URL('file://' + HHelper.projectRoot())
    // const APP_ENV = HHelper.projectRoot() + '/start/env.js'
    // const IMPORTER = (filePath: string) => {
    //   if (filePath.startsWith('./') || filePath.startsWith('../')) {
    //     return import(new URL(filePath, APP_ROOT).href)
    //   }
    //   return import(filePath)
    // }
    // new Ignitor(APP_ROOT, { importer: IMPORTER })
    //   .tap((app) => {
    //     console.debug(1)
    //     app.booting(async () => {
    //       await import(APP_ENV)
    //     })
    //     // console.debug(2)
    //     // app.listen('SIGTERM', () => app.terminate())
    //     // console.debug(3)
    //     // app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
    //     // console.debug(4)
    //   })
    //   .ace()
    //   .handle(process.argv.splice(2))
    //   .catch((error) => {
    //     process.exitCode = 1
    //     prettyPrintError(error)
    //   })
  }

  async boot() {}

  async start() {}

  async ready() {}

  async shutdown() {}
}
