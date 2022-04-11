import fs = require('fs-extra')
import path = require('path')
import chalk = require('chalk')
import globby = require('globby')
import { readJSONFile, readJSONFileSync } from './utils/utils'
import { formatPath, getComponentNameFromPath, toHtmlPath, toJSONPath, removePathExtension } from './utils/path'
import { getNonPrimitiveTagsFromHtml } from './utils/html'
import defaultComponentPrefixConfig from './prefixesConfig'
import { WxConfig } from './platformConfig'

import type {
  SubPackageItem,
  ComponentInfo,
  ComponentPrefixConfig,
  PageOrComponent,
  PageOrCompJSON,
  UsingComponentInfo,
  PlatformType,
  PackIgnoreItem,
  PageInfo,
} from './types'

function getPrefixedComponentName(path: string): string {
  let componentName: string = getComponentNameFromPath(path)
  for (const libName in componentPrefixConfig) {
    if (path.startsWith('miniprogram_npm/' + libName)) {
      return componentPrefixConfig[libName] + componentName
    }
  }
  return componentName
}

function findSubPackageFromPath(subPackages: SubPackageItem[], path: string): SubPackageItem | undefined {
  return subPackages.find((item) => path.startsWith(item.root))
}

function resolvePageOrComponentInfo(htmlPath: string, json: PageOrCompJSON) {
  const pageOrComponent = json.component
    ? ({ isComponent: true, componentName: '', path: htmlPath, json, usingComponents: [] } as ComponentInfo)
    : ({ isComponent: false, path: htmlPath, json, usingComponents: [] } as PageInfo)

  if (pageOrComponent.isComponent) {
    ComponentMap.set(htmlPath, pageOrComponent)
  } else {
    PageMap.set(htmlPath, pageOrComponent)
  }
  PageOrComponentMap.set(htmlPath, pageOrComponent)

  if (pageOrComponent.isComponent) {
    let componentName: string = getPrefixedComponentName(pageOrComponent.path)
    const subPackage = findSubPackageFromPath(subPackages, pageOrComponent.path)
    const packageComponentMap = subPackage ? SubPackagesComponentMap.get(subPackage.root)! : MainPackageComponentMap
    packageComponentMap.set(componentName, pageOrComponent)
  }

  return pageOrComponent
}

/**
 * 从 json 文件的 usingComponents 中解析用到的组件，找到其位置，并记录到 pageOrComponent 对象
 * @param pageOrComponent 页面或组件对象
 */
async function resolveUsingComponentsFromJson(pageOrComponent: PageOrComponent) {
  const { path: htmlPath, json } = pageOrComponent
  const usingComponentsFromJson: Record<string, string> = json.usingComponents || {}
  const pageOrComponentSubPkg = subPackages.find((item) => htmlPath.startsWith(item.root))
  await Promise.all(
    Object.entries(usingComponentsFromJson).map(async ([name, compPath]) => {
      // 兼容官方内置组件 weui
      if (compPath.startsWith('weui-miniprogram/')) {
        pageOrComponent.usingComponents.push({ isBuiltIn: true, name, path: compPath })
        return
      }
      const targetCompPaths = []
      if (path.isAbsolute(compPath)) {
        // 从主包根目录查找
        targetCompPaths.push(compPath.replace(/^\/|^\\/, ''))
      } else {
        if (/^\./.test(compPath)) {
          // 组件路径为相对于所属页面或者组件的相对路径
          targetCompPaths.push(formatPath(path.normalize(path.join(path.dirname(htmlPath), compPath))))
        } else {
          // 所属页面或者组件的根目录开始的路径
          targetCompPaths.push(formatPath(path.normalize(path.join(path.dirname(htmlPath), compPath))))
          // 可能为npm包中的组件
          // 先从子包的npm包中查找
          pageOrComponentSubPkg && targetCompPaths.push(formatPath(path.join(pageOrComponentSubPkg.root, 'miniprogram_npm/', compPath)))
          // 再从主包的npm包中查找
          targetCompPaths.push(formatPath(path.join('miniprogram_npm/', compPath)))
        }
      }

      for (const compPath of targetCompPaths) {
        const usingComponentInfo = getUsingComponentInfo(compPath)
        if (usingComponentInfo) {
          pageOrComponent.usingComponents.push(usingComponentInfo)
          return
        }
      }

      console.log(chalk.red(`Can't find component of :`), compPath, chalk.red('in'), chalk.blue(toJSONPath(htmlPath)))
    })
  )
}

export async function addPageOrComponent(htmlPath: string, json: PageOrCompJSON) {
  const pageOrComponent = resolvePageOrComponentInfo(htmlPath, json)
  await resolveUsingComponentsFromJson(pageOrComponent)
}

export async function removePageOrComponent(htmlPath: string) {
  PageOrComponentMap.delete(htmlPath)
  PageMap.delete(htmlPath)
  ComponentMap.delete(htmlPath)

  const json: PageOrCompJSON = await fs.readJSON(toJSONPath(htmlPath), 'utf-8')
  if (json.component) {
    let componentName: string = getPrefixedComponentName(htmlPath)
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
  const compInfo = ComponentMap.get(toHtmlPath(compPath)) || ComponentMap.get(toHtmlPath(path.join(compPath, 'index')))
  if (compInfo) {
    return {
      isBuiltIn: false,
      name: getPrefixedComponentName(compInfo.path),
      path: '/' + removePathExtension(compInfo.path),
      component: compInfo,
    }
  }
  return undefined
}

async function traverseAllHtml() {
  const htmlPaths: string[] = await globby(['./**/*.wxml', '!node_modules', '!./**/node_modules'])
  const htmlPathAndJsonList = await Promise.all(
    htmlPaths
      .filter((path) => fs.existsSync(toJSONPath(path)))
      .map(async (path) => {
        const json = await readJSONFile(toJSONPath(path), {})
        return [path, json]
      })
  )
  // 先处理所有页面和组件
  const pageOrComps = await Promise.all(htmlPathAndJsonList.map(([htmlPath, json]) => resolvePageOrComponentInfo(htmlPath, json)))
  // 再更新页面和组件的 usingComponents
  await Promise.all(pageOrComps.map(resolveUsingComponentsFromJson))
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

export async function updateUsingComponentsInJson(path: string, tabWidth: number) {
  const jsonPath = toJSONPath(path)
  if (!fs.existsSync(jsonPath)) return
  const htmlContent = await fs.readFile(path, 'utf-8')
  const tags = getNonPrimitiveTagsFromHtml(htmlContent)
  // console.log('tags', tags)
  const subPackage = findSubPackageFromPath(subPackages, path)
  const subPackageComponentMap = subPackage ? SubPackagesComponentMap.get(subPackage.root) : undefined
  const usingComponents: Record<string, string> = tags.reduce<Record<string, string>>((acc, tag) => {
    let component: ComponentInfo | undefined
    if (subPackageComponentMap) {
      component = subPackageComponentMap.get(tag)
      // 非独立子包才能使用主包中的组件
      if (!component && !subPackage?.independent) {
        component = MainPackageComponentMap.get(tag)
      }
    } else {
      component = MainPackageComponentMap.get(tag)
    }
    if (component) {
      acc[tag] = '/' + removePathExtension(component.path)
    } else {
      let buildInComp = BuiltInComponentMap.get(tag)
      if (buildInComp) {
        acc[tag] = buildInComp.path
      }
    }
    return acc
  }, {})

  const json = await readJSONFile(jsonPath, {})
  json.usingComponents = usingComponents

  fs.writeJSON(jsonPath, json, { spaces: tabWidth })
}

function recordUsingComponentsOf(pageOrComponent: PageOrComponent) {
  if ((pageOrComponent as ComponentInfo).componentName) {
    UsingComponentsRecord.set(pageOrComponent.path, true)
  }
  pageOrComponent.usingComponents.forEach((item: UsingComponentInfo) => {
    const relativeCompHtmlPath = formatPath(toHtmlPath(item.path))
    const comp = PageOrComponentMap.get(relativeCompHtmlPath)
    if (comp) {
      // 组件引用自己
      if (comp.path === pageOrComponent.path) {
        return
      } else {
        recordUsingComponentsOf(comp)
      }
    } else {
      if (fs.existsSync(relativeCompHtmlPath)) {
        UsingComponentsRecord.set(relativeCompHtmlPath, true)
      }
    }
  })
}

function getPrevPackIgnores(): (string | RegExp)[] {
  if (packIgnores) return packIgnores
  const projectConfigJson = readJSONFileSync(path.resolve(process.cwd(), 'project.config.json'), {})
  const ignores: PackIgnoreItem[] = projectConfigJson?.packOptions?.ignore || []
  const extraIgnores: PackIgnoreItem[] = projectConfigJson?.packOptions?.extraIgnore || []
  packIgnores = ignores
    .filter((item) => item.type === 'glob' && !extraIgnores.some((mItem) => mItem.type === item.type && mItem.value === item.value))
    .map((item) => item.value)
    .sort()
  return packIgnores
}

async function writePackIgnores(ignores: string[], tabWidth: number) {
  const projectConfigPath = path.resolve(process.cwd(), 'project.config.json')
  const projectConfigJson = await readJSONFile(projectConfigPath, {})
  if (!projectConfigJson.packOptions) {
    projectConfigJson.packOptions = {}
  }
  const extraIgnores: PackIgnoreItem[] = projectConfigJson?.packOptions?.extraIgnore || []
  projectConfigJson.packOptions.ignore = extraIgnores.concat(ignores.map((item) => ({ type: 'glob', value: item })))
  await fs.writeJSON(projectConfigPath, projectConfigJson, { spaces: tabWidth })
}

export async function checkUpdatePackIgnore(tabWidth: number): Promise<boolean> {
  UsingComponentsRecord.clear()
  PageMap.forEach((value) => recordUsingComponentsOf(value))
  const allComponents = Array.from(ComponentMap.keys())
  const ignoreComponents = allComponents.filter((compPath) => !UsingComponentsRecord.get(compPath))
  const ignores: string[] = []
  ignoreComponents.forEach((compPath) => {
    const compDir = path.dirname(compPath)
    const compDirWithSuffixSlash = compDir + '/'
    const subComps = allComponents.filter(
      (compPath1) => compPath1.startsWith(compDirWithSuffixSlash) && compPath1.replace(compDirWithSuffixSlash, '').includes('/')
    )
    const siblingComps = allComponents.filter((compPath2) => compPath2 !== compPath && compPath2.startsWith(compDirWithSuffixSlash))
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
    return false
  }
  // console.log(chalk.yellowBright('pack ignore'), prevIgnores.slice(), ignores)
  packIgnores = ignores
  await writePackIgnores(ignores, tabWidth)
  return true
}

// ---------- 扁平存放页面或者组件及他所使用的组件情况 ----------
/**
 * key: html文件path，以项目根目录为基础路径的相对路径
 */
export const PageOrComponentMap: Map<string, PageOrComponent> = new Map()
/**
 * key: html文件path，以项目根目录为基础路径
 */
export const PageMap: Map<string, PageInfo> = new Map()
/**
 * key: html文件path，以项目根目录为基础路径
 */
const ComponentMap: Map<string, ComponentInfo> = new Map()
// ---------- 分包存放对应包拥有的组件 ----------
/** key: component tag */
const MainPackageComponentMap: Map<string, ComponentInfo> = new Map()
/** outerKey: sub package root, innerKey: component tag */
const SubPackagesComponentMap: Map<string, Map<string, ComponentInfo>> = new Map()
/** key: component tag */
const BuiltInComponentMap: Map<string, ComponentInfo> = new Map()
/** 被使用到的组件，key: 组件html路径 */
const UsingComponentsRecord: Map<string, boolean> = new Map()
let packIgnores: (string | RegExp)[]
let projectPackageConfig: { dependencies: Record<string, string>; mpComponentPrefixes?: ComponentPrefixConfig } = {
  dependencies: {},
}
let subPackages: SubPackageItem[]
let componentPrefixConfig: ComponentPrefixConfig

function initBuiltInComponents(prefixConfig: ComponentPrefixConfig) {
  WxConfig.buildInUILibs.forEach((uiLib) => {
    const prefix = prefixConfig?.[uiLib.name]
    uiLib.components.forEach((compPath) => {
      const compName = prefix + getComponentNameFromPath(compPath)
      BuiltInComponentMap.set(compName, {
        isComponent: true,
        componentName: compName,
        path: removePathExtension(compPath),
        json: {},
        usingComponents: [],
      })
    })
  })
}

export async function init(platform: PlatformType, componentPrefixes?: ComponentPrefixConfig) {
  const [$projectPackageConfig, $subPackages] = await Promise.all([readProjectPackageJson(), getSubPackages()])
  projectPackageConfig = Object.assign(projectPackageConfig, $projectPackageConfig)
  subPackages = $subPackages
  const buildInPrefixes = WxConfig.buildInUILibs.reduce(
    (acc, uiLib) => ((acc[uiLib.name] = uiLib.prefix), acc),
    {} as ComponentPrefixConfig
  )
  componentPrefixConfig = Object.assign({}, buildInPrefixes, componentPrefixes, projectPackageConfig.mpComponentPrefixes)
  subPackages.forEach((item) => SubPackagesComponentMap.set(item.root, new Map()))

  initBuiltInComponents(componentPrefixConfig)

  console.time('traverse')
  await traverseAllHtml()
  console.timeEnd('traverse')
}