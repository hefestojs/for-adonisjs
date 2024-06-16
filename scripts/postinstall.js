/* eslint-disable prettier/prettier */
import * as fs from 'node:fs'
import * as path from 'node:path'
import HHelper from '@hefestojs/for-adonisjs/helper'

const adonisRcPath = path.resolve(HHelper.projectRoot(), 'adonisrc.ts')

const commandImport = `() => import('@hefestojs/for-adonisjs/commands')`
const commandsSectionRegex = /(commands:\s*\[)/


const providerImport = `() => import('@hefestojs/for-adonisjs/provider')`
const providersSectionRegex = /(providers:\s*\[)/

let adonisRcContent

try {
  adonisRcContent = fs.readFileSync(adonisRcPath, 'utf-8')
  if (!adonisRcContent.includes(commandImport)) {
    adonisRcContent = adonisRcContent.replace(commandsSectionRegex, `$1${commandImport}, `)
    fs.writeFileSync(adonisRcPath, adonisRcContent, 'utf-8')
    console.info('Command import added in adonisrc.ts')
  }
  if (!adonisRcContent.includes(providerImport)) {
    adonisRcContent = adonisRcContent.replace(providersSectionRegex, `$1\n    ${providerImport}, `)
    fs.writeFileSync(adonisRcPath, adonisRcContent, 'utf-8')
    console.info('Provider import added in adonisrc.ts')
  }
} catch (err) {
  console.error(`Failed to write to ${adonisRcPath}: `, err)
  process.exit(1)
}
