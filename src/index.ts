import fs = require('fs-extra')
import chokidar = require('chokidar')
import path = require('path')
import chalk = require('chalk')
import { readJSONFile } from './utils/utils'
import { formatPath, toHtmlPath, toJSONPath, removePathExtension, pathJoin } from './utils/path'
import {
  addPageOrComponent,
  checkUpdatePackIgnore,
  init,
  PageOrComponentMap,
  updateUsingComponentsInJson,
  PageMap,
  removePageOrComponent,
} from './handler'

import type { BaseOptions, WatchOptions, GenerateCollectionPageOptions } from './types'

export const DefaultOptions: BaseOptions = {
  platform: 'wx',
  tabWidth: 2,
}
const DefaultWatchOptions: WatchOptions = Object.assign(
  {
    updateIgnore: false,
  },
  DefaultOptions
)

async function onJsonFileChange(jsonPath: string, options: BaseOptions & WatchOptions) {
  const htmlPath = toHtmlPath(formatPath(jsonPath))
  if (fs.existsSync(htmlPath)) {
    const jsonPath = toJSONPath(htmlPath)
    const json = await readJSONFile(jsonPath, {})
    await addPageOrComponent(htmlPath, json)
    if (options.updateIgnore) {
      const ignoreUpdated = await checkUpdatePackIgnore(options.tabWidth!)
      ignoreUpdated && console.log(chalk.green('ignore配置已更新'))
    }
  }
}

function watchHtml(options?: WatchOptions) {
  console.log(chalk.green('start watching html ...'))
  chokidar
    .watch(['./**/*.wxml', '!node_modules', '!./**/node_modules', '!miniprogram_npm', '!./**/miniprogram_npm'])
    .on('change', async (path: string, stats: fs.Stats) => {
      console.log(chalk.blue('wxml changed:'), path)
      await updateUsingComponentsInJson(formatPath(path), options?.tabWidth!)
    })
}

function watchJson($options?: WatchOptions) {
  console.log(chalk.green('start watching json ...'))
  const options = Object.assign({}, DefaultOptions, $options)
  const timeBeforeWatch = Date.now()
  chokidar
    .watch(['./**/*.json', '!node_modules', '!./**/node_modules', '!miniprogram_npm', '!./**/miniprogram_npm'])
    .on('change', async (jsonPath: string, stats?: fs.Stats) => {
      console.log(chalk.blue('json changed:'), jsonPath)
      await onJsonFileChange(jsonPath, options)
    })
    .on('add', async (jsonPath: string, stats?: fs.Stats) => {
      if (!stats || stats.mtime.getTime() < timeBeforeWatch) return
      console.log(chalk.blue('json added:'), jsonPath)
      await onJsonFileChange(jsonPath, options)
    })
    .on('unlink', async (jsonPath: string) => {
      console.log(chalk.blue('json removed:'), jsonPath)
      const htmlPath = toHtmlPath(formatPath(jsonPath))
      await removePageOrComponent(htmlPath)
      if (options.updateIgnore) {
        const ignoreUpdated = await checkUpdatePackIgnore(options.tabWidth!)
        ignoreUpdated && console.log(chalk.green('ignore配置已更新'))
      }
    })
}

export async function watch(options?: WatchOptions) {
  options = Object.assign({}, DefaultWatchOptions, options)
  await init(options.platform, options.componentPrefixes)
  options.updateIgnore && checkUpdatePackIgnore(options.tabWidth!)
  watchHtml(options)
  watchJson(options)
}

export async function updateJson(options: BaseOptions) {
  options = Object.assign({}, DefaultOptions, options)
  await init(options?.platform, options?.componentPrefixes)
  await Promise.all(
    Array.from(PageOrComponentMap.entries())
      .filter(([key, value]) => !key.includes('miniprogram_npm'))
      .map(([key, value]) => updateUsingComponentsInJson(value.path, options.tabWidth!))
  )
  console.log(chalk.green('更新成功'))
}

export async function updateIgnore(options: BaseOptions) {
  options = Object.assign({}, DefaultOptions, options)
  await init(options.platform, options.componentPrefixes)
  checkUpdatePackIgnore(options.tabWidth!)
  console.log(chalk.green('更新成功'))
}

export async function generateCollectionPage(options: GenerateCollectionPageOptions) {
  options = Object.assign({}, DefaultOptions, options)

  await init(options?.platform, options?.componentPrefixes)
  const allPages = Array.from(PageMap.values()).sort((a, b) => a.path.localeCompare(b.path))
  let html = ''
  allPages.forEach((page) => {
    const pagePath = removePathExtension(page.path)
    html += `<navigator class="link-page" url="/${pagePath}">📄${pagePath}</navigator>
    `
  })
  const pagePath = pathJoin(options.path, options.name, options.name).replace(/^\//, '')
  const pageDir = path.dirname(pagePath)
  if (!fs.existsSync(pageDir)) {
    fs.mkdir(pageDir)
  }
  const promises = [fs.writeFile(toHtmlPath(pagePath), html, 'utf-8')]
  const extensions = ['.js', '.json', '.wxss']
  extensions.forEach((ext) => {
    const srcPath = path.join(__dirname, '../template/collection-page/collection-page' + ext)
    const distPath = pagePath + ext
    if (!fs.existsSync(distPath)) {
      promises.push(fs.copyFile(srcPath, distPath))
    }
  })
  await Promise.all(promises)
  const appJson = (await fs.readJSON('./app.json', 'utf-8')) || {}
  if (!appJson.pages.includes(pagePath)) {
    appJson.pages.push(pagePath)
    await fs.writeJSON('./app.json', appJson, { encoding: 'utf-8', spaces: options.tabWidth })
  }
  console.log(chalk.green('生成成功'))
}
