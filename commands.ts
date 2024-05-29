import { readFile } from 'node:fs/promises'

/**
 * In-memory cache of commands after they have been loaded
 */
let commandsMetaData :any

/**
 * Reads the commands from the "./_manifest.json" file. Since, the commands.json
 * file is generated automatically, we do not have to validate its contents
 */
export async function getMetaData() {
  if (commandsMetaData) {
    return commandsMetaData
  }

  const commandsIndex = await readFile(new URL('./commands/manifest.json', import.meta.url), 'utf-8')
  commandsMetaData = JSON.parse(commandsIndex).commands

  return commandsMetaData
}

/**
 * Imports the command by lookingup its path from the commands
 * metadata
 */
export async function getCommand(metaData: any) {
  const commands = await getMetaData()
  const command = commands.find(({ commandName }: { commandName: string }) => metaData.commandName === commandName)
  if (!command) {
    return null
  }

  const { default: commandConstructor } = await import(new URL(command.filePath, import.meta.url).href)
  return commandConstructor
}
