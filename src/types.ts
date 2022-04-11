
export type PlatformType = 'wx' | 'ali'
export interface BaseOptions {
  platform: PlatformType
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

export interface ProjectConfig {
  extraIgnore?: PackIgnoreItem[]
  packOptions?: {
    ignore?: PackIgnoreItem[]
  }
}

/**
 * key: lib name, value: prefix
 */
export type ComponentPrefixConfig = Record<string, string>

export type PageOrCompJSON = { component?: boolean, usingComponents?: Record<string, string> } & Record<string, any>

export interface ComponentInfo {
  componentName: string
  /** xxx/yyy.html */
  path: string
  isComponent: true,
  /** json 文件内容 */
  json: PageOrCompJSON,
  usingComponents: UsingComponentInfo[]
}

export interface PageInfo {
  /** xxx/yyy.html */
  path: string
  isComponent: false,
  /** json 文件内容 */
  json: PageOrCompJSON,
  usingComponents: UsingComponentInfo[]
}


export type PageOrComponent = PageInfo | ComponentInfo

export interface UsingComponentInfoBuiltIn {
  isBuiltIn: true
  name: string
  /** /xxx/yyy 文件绝对路径，不带文件扩展名 */
  path: string
}

export interface UsingComponentInfoNormal {
  isBuiltIn: false
  name: string
  /** /xxx/yyy 文件绝对路径，不带文件扩展名 */
  path: string
  component: ComponentInfo
}

export type UsingComponentInfo = UsingComponentInfoBuiltIn | UsingComponentInfoNormal

export interface SubPackageItem {
  root: string
  independent?: boolean
  components?: Map<string, ComponentInfo>
}

export interface PackIgnoreItem {
  type: 'folder' | 'file' | 'suffix' | 'prefix' | 'regexp' | 'glob'
  value: string | RegExp
}
