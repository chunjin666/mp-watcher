import fs = require('fs-extra')
import path = require('path')
import chokidar = require('chokidar')
import chalk = require('chalk')
import globby = require('globby')
import { formatPath, getComponentNameFromPath, toHtmlPath, toJSONPath, readJSONFile, readJSONFileSync, removePathExtension, pathJoin, toJsPath, toCSSPath } from './utils/utils'
import { getNonPrimitiveTagsFromHtml } from './utils/html'

import defaultComponentPrefixConfig from './defaultComponentPrefixConfig'
import type { SubPackageItem, ComponentBaseInfo, ComponentPrefixConfig, PageOrComponent, PageOrCompJSON, UsingComponentInfo } from './types'
import { WxConfig } from './platformConfig'

function getPrefixedComponentName(path: string, prefixConfig: Record<string, string>): string {
  let componentName: string = getComponentNameFromPath(path)
  for (const libName in prefixConfig) {
    if (path.startsWith('miniprogram_npm/' + libName)) {
      return prefixConfig[libName] + componentName
    }
  }
  return componentName
}

function findSubPackageFromPath(subPackages: SubPackageItem[], path: string): SubPackageItem | undefined {
  return subPackages.find((item) => path.startsWith(item.root))
}

async function addPageOrComponent(htmlPath: string, json?: PageOrCompJSON) {
  if (!json) {
    json = await fs.readJSON(toJSONPath(htmlPath), 'utf-8')
  }
  resolveUsingComponents(htmlPath, json!)
  if (json?.component) {
    let componentName: string = getPrefixedComponentName(htmlPath, componentPrefixConfig)
    const ownerSubPackage = findSubPackageFromPath(subPackages, htmlPath)
    const packageComponentMap = ownerSubPackage ? SubPackagesComponentMap.get(ownerSubPackage.root)! : MainPackageComponentMap
    packageComponentMap.set(componentName, { name: componentName, path: removePathExtension(htmlPath) })
  }
}

async function removePageOrComponent(htmlPath: string) {
  PageOrComponentMap.delete(htmlPath)
  PageMap.delete(htmlPath)
  ComponentMap.delete(htmlPath)

  const json: PageOrCompJSON = await fs.readJSON(toJSONPath(htmlPath), 'utf-8')
  if (json.component) {
    let componentName: string = getPrefixedComponentName(htmlPath, componentPrefixConfig)
    const ownerSubPackage = findSubPackageFromPath(subPackages, htmlPath)
    const packageComponentMap = ownerSubPackage ? SubPackagesComponentMap.get(ownerSubPackage.root)! : MainPackageComponentMap
    packageComponentMap.delete(componentName)
  }
}

/**
 * 获取组件信息，包括组件名和以/开头的绝对路径名，不带文件扩展名
 * @param compPath 组件路径，以项目根目录为根，不以/开头，不带文件扩展名
 * @returns
 */
function getUsingComponentInfo(compPath: string): UsingComponentInfo | undefined {
  if (fs.existsSync(toHtmlPath(compPath))) {
    return {
      name: getComponentNameFromPath(compPath),
      path: '/' + compPath,
    }
  } else if (!compPath.endsWith('/index')) {
    compPath += '/index'
    if (fs.existsSync(toHtmlPath(compPath))) {
      return {
        name: getComponentNameFromPath(compPath),
        path: '/' + compPath,
      }
    }
  }
  return undefined
}

function resolveUsingComponents(htmlPath: string, json: PageOrCompJSON) {
  let pageOrComponent = PageOrComponentMap.get(htmlPath)
  if (!pageOrComponent) {
    pageOrComponent = { path: htmlPath, component: !!json.component, usingComponents: [] }
    PageOrComponentMap.set(htmlPath, pageOrComponent)
    pageOrComponent.component ? ComponentMap.set(htmlPath, pageOrComponent) : PageMap.set(htmlPath, pageOrComponent)
  }
  const usingComponents: Record<string, string> = json.usingComponents || {}
  const dependencies = Object.keys(projectPackageConfig.dependencies)
  const ownerSubPkg = subPackages.find((item) => htmlPath.startsWith(item.root))
  Object.entries(usingComponents).forEach(async ([name, compPath]) => {
    if (compPath.startsWith('weui-miniprogram/')) {
      pageOrComponent?.usingComponents.push({ name, path: compPath })
      return
    }
    if (!path.isAbsolute(compPath)) {
      // 组件路径为相对于所属页面或者组件的相对路径
      let relativeCompPath = path.resolve(path.dirname(htmlPath), compPath)
      relativeCompPath = path.relative(process.cwd(), relativeCompPath).replace(/\\/g, '/')
      const usingComponentInfo = getUsingComponentInfo(relativeCompPath)
      if (usingComponentInfo) {
        pageOrComponent!.usingComponents.push(usingComponentInfo)
        return
      }

      // 组件可能为npm包中的组件
      if (/^[^./]/.test(compPath)) {
        // 先从子包的npm包中查找
        if (ownerSubPkg) {
          const compPathOfSubPkgNpm = path.join(ownerSubPkg.root, 'miniprogram_npm/' + compPath).replace(/\\/g, '/')
          const usingComponentInfo = getUsingComponentInfo(compPathOfSubPkgNpm)
          if (usingComponentInfo) {
            pageOrComponent!.usingComponents.push(usingComponentInfo)
            return
          }
        }
        // 再从主包的npm包中查找
        const dep = dependencies.find((depName) => compPath.startsWith(depName + '/'))
        if (dep) {
          const compPathAddNpmPrefix = 'miniprogram_npm/' + compPath
          const usingComponentInfo = getUsingComponentInfo(compPathAddNpmPrefix)
          if (usingComponentInfo) {
            pageOrComponent!.usingComponents.push(usingComponentInfo)
            return
          }
        }
      }
    } else {
      // 组件路径为绝对路径

      // 先从子包的npm依赖中查找
      if (ownerSubPkg) {
        const usingComponentInfo = getUsingComponentInfo(path.join(ownerSubPkg.root, compPath).replace(/\\/g, '/'))
        if (usingComponentInfo) {
          pageOrComponent!.usingComponents.push(usingComponentInfo)
          return
        }
      }
      // 再从主包的npm依赖中查找
      const usingComponentInfo = getUsingComponentInfo(compPath.replace(/^\//, ''))
      if (usingComponentInfo) {
        pageOrComponent!.usingComponents.push(usingComponentInfo)
        return
      }
    }

    console.log(chalk.red(`Can't find component of :`), compPath, chalk.blue(toJSONPath(htmlPath)))
  })
}

async function traverseAllHtml() {
  const paths: string[] = await globby(['./**/*.wxml', '!node_modules', '!./**/node_modules'])
  return Promise.all(
    paths.map(async (htmlPath: string) => {
      // console.log(chalk.yellow(htmlPath))
      const jsonPath = toJSONPath(htmlPath)
      if (!fs.existsSync(jsonPath)) return
      const json = await fs.readJSON(jsonPath, 'utf-8')
      if (!json) return
      await addPageOrComponent(htmlPath, json)
    })
  )
}

function resolvePrefixConfig(cfg?: Record<string, string>): Record<string, string> {
  const config = Object.assign({}, defaultComponentPrefixConfig, cfg) as Record<string, string>
  Object.entries(config).forEach(([key, value]) => {
    if (value && !value.endsWith('-')) {
      value += '-'
      config[key] = value
    }
  })
  return config
}

async function getSubPackages(): Promise<SubPackageItem[]> {
  const appJson = await fs.readJSON(path.join(process.cwd(), 'app.json'), 'utf-8')
  const subPackages: SubPackageItem[] = appJson?.subpackages || appJson?.subPackages || []
  return subPackages.map((item) => ({ root: item.root, independent: item.independent, components: undefined }))
}

async function readProjectPackageJson() {
  let json = await readJSONFile(path.join(process.cwd(), 'package.json'), {})
  json.mpComponentPrefixes = resolvePrefixConfig(json.mpComponentPrefixes)
  return json
}

async function updateUsingComponentsInJson(path: string, tabWidth = 2) {
  const jsonPath = toJSONPath(path)
  if (!fs.existsSync(jsonPath)) return
  const htmlContent = await fs.readFile(path, 'utf-8')
  const tags = getNonPrimitiveTagsFromHtml(htmlContent)
  // console.log('tags', tags)
  const ownerSubPackage = findSubPackageFromPath(subPackages, path)
  const ownerSubPackageComponentMap = ownerSubPackage ? SubPackagesComponentMap.get(ownerSubPackage.root) : undefined
  const usingComponents: Record<string, string> = tags.reduce<Record<string, string>>((acc, tag) => {
    let component: ComponentBaseInfo | undefined
    if (ownerSubPackageComponentMap) {
      component = ownerSubPackageComponentMap.get(tag)
      // 非独立子包才能使用主包中的组件
      if (!component && !ownerSubPackage?.independent) {
        component = MainPackageComponentMap.get(tag)
      }
    } else {
      component = MainPackageComponentMap.get(tag)
    }
    if (component) {
      acc[tag] = '/' + component.path
    } else {
      let buildInComp = BuildInComponentMap.get(tag)
      if (buildInComp) {
        acc[tag] = buildInComp.path
      }
    }
    return acc
  }, {})

  const json = (await fs.readJSON(jsonPath, 'utf-8')) || {}
  if (!json.usingComponents) json.usingComponents = {}
  json.usingComponents = usingComponents
  // Object.assign(json.usingComponents, usingComponents)
  console.log(chalk.blue('update usingComponents'), json.usingComponents)

  fs.writeJSON(jsonPath, json, { spaces: 2 })
}

function recordUsingComponentsOf(pageOrComponent: PageOrComponent) {
  // console.log('record', pageOrComponent.path)
  if (pageOrComponent.component) {
    UsingComponentsRecord.set(pageOrComponent.path, true)
  }
  pageOrComponent.usingComponents.forEach((item: UsingComponentInfo) => {
    const relativeCompHtmlPath = toHtmlPath(item.path).replace(/^\//, '')
    const comp = PageOrComponentMap.get(relativeCompHtmlPath)
    if (comp) {
      recordUsingComponentsOf(comp)
    } else {
      if (fs.existsSync(relativeCompHtmlPath)) {
        UsingComponentsRecord.set(relativeCompHtmlPath, true)
      }
    }
  })
}

interface IgnoreItem {
  type: string
  value: string
}

function getPrevPackIgnores(): string[] {
  if (packIgnores) return packIgnores
  const projectConfigJson = readJSONFileSync(path.resolve(process.cwd(), 'project.config.json'), {})
  const ignores: IgnoreItem[] = projectConfigJson?.packOptions?.ignore || []
  const manualIgnores: IgnoreItem[] = projectConfigJson?.packOptions?.manualIgnore || []
  packIgnores = ignores
    .filter((item) => item.type === 'glob' && !manualIgnores.some((mItem) => mItem.type === item.type && mItem.value === item.value))
    .map((item) => item.value)
    .sort()
  return packIgnores
}

async function writePackIgnores(ignores: string[], tabWidth = 2) {
  const projectConfigPath = path.resolve(process.cwd(), 'project.config.json')
  const projectConfigJson = await readJSONFile(projectConfigPath, {})
  if (!projectConfigJson.packOptions) {
    projectConfigJson.packOptions = {}
  }
  const manualIgnores: IgnoreItem[] = projectConfigJson?.packOptions?.manualIgnore || []
  projectConfigJson.packOptions.ignore = manualIgnores.concat(ignores.map((item) => ({ type: 'glob', value: item })))
  await fs.writeJSON(projectConfigPath, projectConfigJson, { spaces: tabWidth })
}

function checkUpdatePackIgnore(tabWidth?: number) {
  PageMap.forEach((value) => recordUsingComponentsOf(value))
  const allComponents = Array.from(ComponentMap.keys()) //.filter((compPath) => compPath.startsWith('miniprogram_npm/'))
  const ignoreComponents = allComponents.filter((compPath) => !UsingComponentsRecord.get(compPath))
  // console.log('ignoreComponentsInNpm', ignoreComponentsInNpm)
  const ignores: string[] = []
  ignoreComponents.forEach((compPath) => {
    const compDir = path.dirname(compPath)
    const compDirWithSuffixSlash = compDir + '/'
    const subComps = allComponents.filter(
      (compPath1) => compPath1.startsWith(compDirWithSuffixSlash) && compPath1.replace(compDirWithSuffixSlash, '').includes('/')
    )
    const siblingComps = allComponents.filter((compPath2) => compPath2 !== compPath && compPath2.startsWith(compDirWithSuffixSlash))
    // if (subComps.length || siblingComps.length) {
    //   console.log(compPath, subComps, siblingComps)
    // }
    if (siblingComps.some((compPath3) => UsingComponentsRecord.get(compPath3))) {
      ignores.push(compPath.replace(/\.\w+$/, '.*'))
    } else if (siblingComps.length || subComps.length) {
      ignores.push(compPath.replace(/[\w-]+\.\w+$/, '*.*'))
    } else {
      ignores.push(compDir + '/*.*')
    }
  })
  ignores.sort()
  const prevIgnores = getPrevPackIgnores()
  if (ignores.length === prevIgnores.length && ignores.every((item, index) => item === prevIgnores[index])) {
    return
  }
  console.log(chalk.yellowBright('pack ignore'), prevIgnores.slice(), ignores)
  packIgnores = ignores
  writePackIgnores(ignores, tabWidth)
}

function watchHtml(options?: WatchOptions) {
  console.log(chalk.green('start watching html ...'))
  chokidar
    .watch(['./**/*.wxml', '!node_modules', '!./**/node_modules', '!miniprogram_npm', '!./**/miniprogram_npm'])
    .on('change', (path: string, stats: fs.Stats) => {
      console.log('wxml change:', path)
      updateUsingComponentsInJson(formatPath(path), options?.tabWidth)
    })
}

function watchJson(options?: WatchOptions) {
  console.log(chalk.green('start watching json ...'))
  const timeBeforeWatch = Date.now()
  chokidar
    .watch(['./**/*.json', '!node_modules', '!./**/node_modules', '!miniprogram_npm', '!./**/miniprogram_npm'])
    .on('change', async (jsonPath: string, stats?: fs.Stats) => {
      console.log('change', jsonPath)
      // if (!stats || stats.birthtime.getTime() < timeBeforeWatch) return
      const htmlPath = toHtmlPath(formatPath(jsonPath))
      if (fs.existsSync(htmlPath)) {
        addPageOrComponent(htmlPath)
        options?.updateIgnore && checkUpdatePackIgnore(options?.tabWidth)
      }
    })
    .on('add', (jsonPath: string, stats?: fs.Stats) => {
      if (!stats || stats.mtime.getTime() < timeBeforeWatch) return
      console.log('add', jsonPath)
      const htmlPath = toHtmlPath(formatPath(jsonPath))
      if (fs.existsSync(htmlPath)) {
        addPageOrComponent(htmlPath)
        options?.updateIgnore && checkUpdatePackIgnore(options?.tabWidth)
      }
    })
    .on('unlink', (jsonPath: string) => {
      console.log('remove', jsonPath)
      const htmlPath = toHtmlPath(formatPath(jsonPath))
      removePageOrComponent(htmlPath)
      options?.updateIgnore && checkUpdatePackIgnore(options?.tabWidth)
    })
}

// ---------- 扁平存放页面或者组件及他所使用的组件情况 ----------
/**
 * key: html文件path，以项目根目录为基础路径
 */
const PageOrComponentMap: Map<string, PageOrComponent> = new Map()
/**
 * key: html文件path，以项目根目录为基础路径
 */
const PageMap: Map<string, PageOrComponent> = new Map()
/**
 * key: html文件path，以项目根目录为基础路径
 */
const ComponentMap: Map<string, PageOrComponent> = new Map()

// ---------- 分包存放对应包拥有的组件 ----------
/** key: component tag */
const MainPackageComponentMap: Map<string, ComponentBaseInfo> = new Map()
/** outerKey: sub package root, innerKey: component tag */
const SubPackagesComponentMap: Map<string, Map<string, ComponentBaseInfo>> = new Map()
/** key: component tag */
const BuildInComponentMap: Map<string, ComponentBaseInfo> = new Map()

/** 被使用到的组件，key: 组件html路径 */
const UsingComponentsRecord: Map<string, boolean> = new Map()

let packIgnores: string[]
let projectPackageConfig: { dependencies: Record<string, string>; mpComponentPrefixes?: ComponentPrefixConfig } = {
  dependencies: {},
}
let subPackages: SubPackageItem[]
let componentPrefixConfig: ComponentPrefixConfig

function initBuildInComponents(prefixConfig: ComponentPrefixConfig) {
  WxConfig.buildInUILibs.forEach((uiLib) => {
    const prefix = prefixConfig?.[uiLib.name]
    uiLib.components.forEach((compPath) => {
      const compName = prefix + getComponentNameFromPath(compPath)
      BuildInComponentMap.set(compName, {
        name: compName,
        path: removePathExtension(compPath),
      })
    })
  })
}

async function init(platform: Platforms, componentPrefixes?: ComponentPrefixConfig) {
  const [$projectPackageConfig, $subPackages] = await Promise.all([readProjectPackageJson(), getSubPackages()])
  projectPackageConfig = Object.assign(projectPackageConfig, $projectPackageConfig)
  subPackages = $subPackages
  const buildInPrefixes = WxConfig.buildInUILibs.reduce((acc, uiLib) => (acc[uiLib.name] = uiLib.prefix, acc), {} as ComponentPrefixConfig)
  componentPrefixConfig = Object.assign(
    {},
    buildInPrefixes,
    componentPrefixes,
    projectPackageConfig.mpComponentPrefixes,
  )
  subPackages.forEach((item) => SubPackagesComponentMap.set(item.root, new Map()))

  initBuildInComponents(componentPrefixConfig)

  console.time('traverse')
  await traverseAllHtml()
  console.timeEnd('traverse')
  // console.log(chalk.blue('main package:'), MainPackageComponentMap)
  // for (let [sub, compMap] of SubPackagesComponentMap.entries()) {
  //   console.log(chalk.blue(`sub package components:`), sub, compMap)
  // }
  // console.log('PageOrComponents', Array.from(PageOrComponentMap.values()).map(item => [item.path, item.usingComponents.map(comp => comp.path)]))
}

type Platforms = 'wx' | 'ali'
export interface BaseOptions {
  platform: Platforms
  tabWidth?: number
  componentPrefixes?: ComponentPrefixConfig
}
export interface WatchOptions extends BaseOptions {
  updateIgnore?: boolean
}
export interface GenerateCollectionPageOptions extends BaseOptions {
  name: string
  path: string
}
const DefaultOptions: BaseOptions = {
  platform: 'wx',
  tabWidth: 2,
}
const DefaultWatchOptions: WatchOptions = Object.assign({
  updateIgnore: false,
}, DefaultOptions)

export function watch(options?: WatchOptions) {
  options = Object.assign({}, DefaultWatchOptions, options)
  init(options?.platform, options?.componentPrefixes).then(() => {
    options?.updateIgnore && checkUpdatePackIgnore(options?.tabWidth)
    watchHtml(options)
    watchJson(options)
  })
}

export async function updateJson(options?: BaseOptions) {
  options = Object.assign({}, DefaultOptions, options)
  await init(options?.platform, options?.componentPrefixes)
  await Promise.all(
    Array.from(PageOrComponentMap.entries()).map(([key, value]) => {
      if (!key.includes('miniprogram_npm')) {
        updateUsingComponentsInJson(value.path)
      }
    })
  )
  console.log(chalk.green('更新成功'))
}

export async function updateIgnore(options: BaseOptions) {
  options = Object.assign({}, DefaultOptions, options)
  await init(options.platform, options.componentPrefixes)
  checkUpdatePackIgnore(options.tabWidth)
  console.log(chalk.green('更新成功'))
}

export async function generateCollectionPage(options: GenerateCollectionPageOptions) {
  options = Object.assign({}, DefaultOptions, options)

  await init(options?.platform, options?.componentPrefixes)
  // @ts-ignore
  const allPages = Array.from(PageMap.values()).sort((a, b) => a.path - b.path)
  let html = ''
  allPages.forEach((page) => {
    const pagePath = removePathExtension(page.path)
    html += `<navigator class="link-page" url="/${pagePath}">${pagePath}</navigator>
    `
  })
  const pagePath = pathJoin(options.path, options.name, options.name).replace(/^\//, '')
  const pageDir = path.dirname(pagePath)
  console.log('pageDir', pageDir)
  if (!fs.existsSync(pageDir)) {
    fs.mkdir(pageDir)
  }
  const promises = [
    fs.writeFile(toHtmlPath(pagePath), html, 'utf-8'),
  ]
  const extensions = ['.js', '.json', '.wxss']
  extensions.forEach(ext => {
    const srcPath = path.join(__dirname, '../template/collection-page/collection-page' + ext)
    if(!fs.existsSync(srcPath)) {
      promises.push(fs.copyFile(srcPath, pagePath + ext))
    }
  })
  await Promise.all(promises)
  const appJson = await fs.readJSON('./app.json', 'utf-8') || {}
  if (!appJson.pages.includes(pagePath)) {
    appJson.pages.push(pagePath)
    await fs.writeJSON('./app.json', appJson, { encoding: 'utf-8', spaces: options.tabWidth })
  }
  console.log(chalk.green('生成成功'))
}
