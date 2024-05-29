import { BaseCommand } from '@adonisjs/core/ace'
import path from 'node:path'
import fs from 'node:fs'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class ForgeManifest extends BaseCommand {
  static namespace = 'hefesto'
  static commandName = 'forge:manifest'
  static description = 'Forge a new Manifest file for hefesto custom ace commands'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    try {
      const currentFilePath = new URL(import.meta.url).pathname
      const directoryPath = path.join(path.dirname(currentFilePath), '..', 'commands')
      
      fs.readdir(directoryPath, async (error, files) => {
        if (error) {
          this.logger.error(error.message)
          return
        }

        const tsFiles = files.filter((file) => path.extname(file) === '.ts')
        const commandPromises = tsFiles.map((file) => {
          const filePath = path.resolve(directoryPath, file)
          return import(filePath).then((command) => ({
            namespace: command.default.namespace,
            commandName: command.default.commandName,
            description: command.default.description,
            args: command.default.args ?? [],
            aliases: command.default.aliases,
            flags: command.default.flags,
            options: command.default.options,
            filePath: `commands/${file.replace('.ts', '.js')}`,
          }))
        })
        const commands = await Promise.all(commandPromises)

        const jsonContent = JSON.stringify({ commands: commands, version: 1 }, null, 2)
        const outputPath = path.join(directoryPath, 'manifest.json')

        fs.writeFile(outputPath, jsonContent, 'utf8', (err) => {
          if (err) {
            this.logger.error(err.message)
            return
          }
          this.logger.success('Manifest file generated successfully (commands/manifest.json)')
        })
      })
    } catch (error) {
      this.logger.error(error.message)
    }
  }
}
