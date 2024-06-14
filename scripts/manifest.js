import path from 'node:path'
import fs from 'node:fs'

async function generateManifest() {
  try {
    const currentFilePath = new URL(import.meta.url).pathname
    const directoryPath = path.join(path.dirname(currentFilePath), '../build', 'commands')
    fs.readdir(directoryPath, async (error, files) => {
      if (error) {
        console.error(error.message)
        return
      }
      const tsFiles = files.filter((file) => path.extname(file) === '.js' && file !== 'main.js')
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
          filePath: `${file}`,
        }))
      })
      const commands = await Promise.all(commandPromises)
      const jsonContent = JSON.stringify({ commands: commands, version: 1 }, null, 2)
      const outputPath = path.join(directoryPath, 'manifest.json')
      fs.writeFile(outputPath, jsonContent, 'utf8', (err) => {
        if (err) {
          console.error(err.message)
          return
        }
        console.info('Manifest file generated successfully (commands/manifest.json)')
      })
    })
  } catch (error) {
    console.error(error.message)
  }
}
generateManifest()
